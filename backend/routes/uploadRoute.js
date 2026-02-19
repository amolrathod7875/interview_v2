import express from 'express'
import { memoryUpload } from '../middlewares/upload.js'
import ResumeModel from '../models/resumeModel.js'
import ocrSpacePkg from 'ocr-space-api-wrapper';
import fs from 'fs'
import pdf from 'pdf-parse'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { oracleStorage, oracleBucket } from '../config/oracleStorage.js'
import { s3 } from '../config/s3.js'
import { GoogleGenAI } from '@google/genai';

const { ocrSpace } = ocrSpacePkg;
const router = express.Router()


/**
 * Extract text from a file buffer.
 * PDFs → pdf-parse (fast, no network call)
 * Images → OCR-Space (requires OCR_API_KEY; uploads buffer as base64 via the API)
 */
const extractTextFromBuffer = async (buffer, mimeType, originalname) => {
  const isPDF = mimeType === 'application/pdf'
    || originalname.toLowerCase().endsWith('.pdf')

  if (isPDF) {
    const data = await pdf(buffer)
    if (data && data.text && data.text.trim().length > 0) return data.text.trim()
    throw new Error('PDF parse produced no text – the file may be scanned/image-only')
  }

  // For image files use OCR-Space with base64
  const FILETYPE_MAP = {
    'image/jpeg': 'JPG', 'image/jpg': 'JPG',
    'image/png':  'PNG', 'image/gif': 'GIF',
    'image/bmp':  'BMP', 'image/tiff': 'TIF',
  }
  const filetype = FILETYPE_MAP[mimeType]
  if (!filetype) throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF or an image.`)

  const base64 = buffer.toString('base64')
  const result = await ocrSpace(`data:${mimeType};base64,${base64}`, {
    apiKey: process.env.OCR_API_KEY,
    language: 'eng',
    filetype,
    isBase64Image: true,
  })
  if (!result?.ParsedResults?.[0]?.ParsedText) {
    console.error('OCR returned unexpected result', { result })
    throw new Error('OCR failed to extract text')
  }
  return result.ParsedResults[0].ParsedText
}

/**
 * Upload buffer to Oracle Cloud (primary) or AWS S3 (fallback) and return the public URL.
 */
const uploadBufferToStorage = async (buffer, originalname, mimeType) => {
  const key = `${Date.now()}-${originalname}`

  // Oracle Cloud (priority)
  if (process.env.ORACLE_BUCKET && process.env.ORACLE_ENDPOINT && process.env.ORACLE_ACCESS_KEY_ID) {
    await oracleStorage.send(new PutObjectCommand({
      Bucket: oracleBucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }))
    return `${process.env.ORACLE_ENDPOINT}/${oracleBucket}/${key}`
  }

  // AWS S3 fallback
  if (process.env.AWS_BUCKET) {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }))
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  }

  // Local disk fallback
  const uploadDir = `${process.cwd()}/uploads/files`
  fs.mkdirSync(uploadDir, { recursive: true })
  const localPath = `${uploadDir}/${key}`
  fs.writeFileSync(localPath, buffer)
  return localPath
}

const getPrompt = async (file, text) => {
  return `You are a senior technical recruiter and career coach.

Your task is to evaluate the following resume text and produce a professional hiring assessment.

Scoring Rules:
- Score the resume from 0 to 100 based on employability, clarity, structure, technical depth, and market alignment.
- Be strict and realistic. Do not inflate the score.

Output Requirements (CRITICAL):
- The output must be a single valid JSON object.
- Do NOT include markdown.
- Do NOT include explanations outside JSON.
- The JSON must be directly parsable using JSON.parse() with no modifications.

The JSON must contain exactly these fields:

{
  "score": number (0–100),
  "improvements": string[],
  "recruiterFeedback": string
}

Guidelines:
- Base all conclusions only on the provided resume.
- Do not invent qualifications.
- Focus on real hiring standards for modern tech roles.
- Be concise, specific, and actionable.

Here is the resume content:
${text}
`
}
export const analyseResume = async (file, text) => {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
    const prompt = await getPrompt(file, text);
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    return geminiResponse;
  }
  catch (e) {
    console.error('analyseResume error', e)
    // Propagate error to caller to handle consistently
    throw e
  }
}


router.post('/upload', memoryUpload.single('resume'), async (req, res) => {
  try {
    const file = req.file
    if (!file || !file.buffer) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    // 1. Extract text directly from the in-memory buffer (no remote download needed)
    const text = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname)

    // 2. Upload buffer to Oracle/S3/local and get back a stored URL
    const fileUrl = await uploadBufferToStorage(file.buffer, file.originalname, file.mimetype)

    // 3. Analyse with Gemini
    const geminiResp = await analyseResume(file, text)

    // 4. Validate AI response shape
    const contentText = geminiResp?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) {
      console.error('Unexpected AI response shape', geminiResp)
      return res.status(502).json({ success: false, message: 'Unexpected AI response shape' })
    }

    let modifiedResp
    try {
      modifiedResp = JSON.parse(contentText)
    } catch (err) {
      console.error('Failed to parse AI response JSON', err)
      return res.status(502).json({ success: false, message: 'Failed to parse AI response', details: err.message })
    }

    // 5. Persist and respond
    const record = await ResumeModel.create({
      userId: req.body.userId,
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      extractedText: text,
      improvements: modifiedResp.improvements,
      score: modifiedResp.score,
      feedback: modifiedResp.recruiterFeedback
    })

    res.json({ success: true, resume: record })
  } catch (e) {
    console.error('Upload handler error', e)
    res.status(500).json({
      success: false,
      message: e.message,
      details: process.env.NODE_ENV === 'production' ? undefined : e.stack
    })
  }
})

router.get('/scores/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const resumes = await ResumeModel.find(
      { userId },
      {
        score: 1,
        fileName: 1,
        fileUrl: 1,
        createdAt: 1
      }
    ).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      resumes
    })
  } catch (e) {
    console.log(e.message)
    res.status(500).json({
      success: false,
      message: e.message
    })
  }
})


export default router
