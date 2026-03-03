import express from 'express'
import buildResume from '../models/buildResume.js'

const router = express.Router()
import ocrSpacePkg from 'ocr-space-api-wrapper';
import { upload } from '../middlewares/upload.js';

const { ocrSpace } = ocrSpacePkg;


const extractText = async (s3Url) => {
    const result = await ocrSpace(s3Url, {
        apiKey: process.env.OCR_API_KEY,
        language: 'eng'
    });

    const parsedText = result?.ParsedResults?.[0]?.ParsedText;
    if (!parsedText) {
        throw new Error('OCR parsing failed: no extracted text returned');
    }

    return parsedText;
}


router.get('/:userId', async (req, resp) => {
    try {
        const { userId } = req.params

        const resumes = await buildResume.find({ userId })

        if (!resumes || resumes.length === 0) {
            return resp.status(200).json([])
        }

        resp.status(200).json(resumes)
    } catch (e) {
        resp.status(500).json({ message: 'Server error', error: e.message })
    }
})
router.post('/', upload.single('resume'), async (req, resp) => {
    try {
        const { userId } = req.body
        const file = req.file

        if (!userId || !file) {
            return resp.status(400).json({
                message: 'userId and resume file are required'
            })
        }

        // If using S3 via multer-s3, file.location will exist
        const fileUrl = file.location || null

        if (!fileUrl) {
            return resp.status(400).json({
                message: 'File upload failed (no file URL)'
            })
        }

        // OCR
        const extractedText = await extractText(fileUrl)

        const resume = new buildResume({
            userId,
            fileUrl,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            extractedText,
            score: 0,                // initial score
            improvements: [],        // can be filled later
            feedback: ''             // can be filled later
        })

        const savedResume = await resume.save()

        resp.status(201).json({
            success: true,
            resume: savedResume
        })
    } catch (e) {
        console.error(e)
        resp.status(500).json({
            message: 'Failed to create resume',
            error: e.message
        })
    }
})


export default router
