import express from 'express'
import multer from 'multer'
import ResumeModel from '../models/resumeModel.js'
import ocrSpacePkg from 'ocr-space-api-wrapper';
import OpenAI from 'openai';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { oracleStorage } from '../config/oracleStorage.js';
import pdfParse from 'pdf-parse';

const { ocrSpace } = ocrSpacePkg;
const router = express.Router()
const openai = new OpenAI({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://ai-interview.app',
    'X-Title': 'AI Interview Platform',
  },
});

// ── Memory storage: file stays in RAM as req.file.buffer ─────────────────────
// No disk I/O, no Oracle download-to-process roundtrip.
const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard cap
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted for resume analysis.'));
  }
});

// ── Upload buffer to Oracle Cloud Object Storage ──────────────────────────────
const uploadToOracle = async (buffer, originalname, mimetype) => {
  const key = `${Date.now()}-${originalname}`;
  const bucket = process.env.ORACLE_BUCKET;
  const endpoint = process.env.ORACLE_ENDPOINT;

  await oracleStorage.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));

  return `${endpoint}/${bucket}/${key}`;
};

/**
 * Extract plain text from a PDF buffer.
 *
 * Strategy:
 *  1. pdf-parse  — instant, offline, works for all text-layer PDFs
 *  2. OCR.space  — base64 fallback for scanned / image-only PDFs (≤ 900 KB)
 */
const extractText = async (buffer, mimetype, originalname) => {
  const fileSizeKB = buffer.length / 1024;

  // ── 1. pdf-parse (primary) ────────────────────────────────────────────────
  if (mimetype === 'application/pdf' || originalname?.toLowerCase().endsWith('.pdf')) {
    try {
      const parsed = await pdfParse(buffer);
      const text = parsed.text?.trim();
      if (text && text.length > 50) {
        console.log(`[EXTRACT] pdf-parse succeeded: ${text.length} chars`);
        return text;
      }
      console.warn('[EXTRACT] pdf-parse returned too little text — trying OCR fallback');
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      // Encrypted PDFs can't be read even by OCR — fail fast with a clear message
      if (msg.includes('password') || msg.includes('encrypt')) {
        throw new Error('This PDF is password-protected. Please upload an unlocked copy.');
      }
      console.warn('[EXTRACT] pdf-parse failed:', err.message, '— trying OCR fallback');
    }
  }

  // ── 2. OCR.space fallback (scanned PDFs only, ≤ 900 KB) ──────────────────
  if (fileSizeKB > 900) {
    throw new Error(
      `This appears to be a scanned PDF and is too large for OCR processing (${Math.round(fileSizeKB)} KB). ` +
      `Please use a text-based PDF or reduce the file size to under 900 KB.`
    );
  }

  console.log(`[EXTRACT] Falling back to OCR.space (${Math.round(fileSizeKB)} KB)...`);
  const base64 = buffer.toString('base64');
  const result = await ocrSpace(`data:${mimetype || 'application/pdf'};base64,${base64}`, {
    apiKey: process.env.OCR_API_KEY,
    language: 'eng',
    isBase64Image: true,
    isOverlayRequired: false,
  });

  console.log('[OCR] Exit code:', result?.OCRExitCode, '| Error:', result?.ErrorMessage || 'none');

  if (!result?.ParsedResults?.length) {
    throw new Error(
      `OCR failed (code ${result?.OCRExitCode}): ${result?.ErrorMessage || result?.ErrorDetails || 'No text extracted'}`
    );
  }

  const ocrText = result.ParsedResults[0].ParsedText?.trim();
  if (!ocrText || ocrText.length < 50) {
    throw new Error('Could not extract readable text from this resume. Ensure the PDF is not password-protected or corrupted.');
  }

  return ocrText;
}

const getPrompt = (text) => {
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

export const analyseResume = async (text) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume evaluator. Always respond with valid JSON only — no markdown, no extra text.'
        },
        {
          role: 'user',
          content: getPrompt(text)
        }
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content;
  } catch (e) {
    console.error('[RESUME ANALYSE]', e.message);
    throw e;
  }
}


router.post('/upload', memUpload.single('resume'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Make sure the field name is "resume" and Content-Type is multipart/form-data.'
      });
    }

    console.log(`[UPLOAD] Received: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);

    // Step 1 — Extract text from in-memory buffer (no Oracle roundtrip needed)
    const text = await extractText(file.buffer, file.mimetype, file.originalname);

    // Step 2 — Analyse with OpenAI
    const rawAnalysis = await analyseResume(text);
    const cleaned = rawAnalysis.replace(/```json/gi, '').replace(/```/g, '').trim();
    const modifiedResp = JSON.parse(cleaned);
    console.log('[RESUME] Score:', modifiedResp.score);

    // Step 3 — Persist to Oracle (non-blocking: don't fail the whole request if this errors)
    let fileUrl = `oracle://${file.originalname}`;
    try {
      fileUrl = await uploadToOracle(file.buffer, file.originalname, file.mimetype);
      console.log('[UPLOAD] Saved to Oracle:', fileUrl);
    } catch (uploadErr) {
      console.warn('[UPLOAD] Oracle persist failed (non-fatal):', uploadErr.message);
    }

    // Step 4 — Save record to MongoDB
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
    });

    res.json({ success: true, resume: record });

  } catch (e) {
    console.error('[UPLOAD ERROR]', e.message);
    res.status(500).json({ success: false, message: e.message });
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
