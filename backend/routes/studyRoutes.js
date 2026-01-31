import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { parseFileToText } from "../services/fileParser.service.js";
import { generateStudyMaterial } from "../services/studyAI.service.js";

const router = express.Router();

/**
 * POST /api/study/process
 * multipart/form-data
 * field name: files (MULTIPLE)
 */
router.post(
  "/process",
  upload.array("files"),
  async (req, res) => {
    try {
      // 🛑 Guard: no files
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      // 1️⃣ Extract text from all files
      let combinedText = "";

      for (const file of req.files) {
        const text = await parseFileToText(file.path);
        console.log(`[STUDY] Parsed file: ${file.originalname}, text length: ${text?.length || 0}`);
        if (text && text.trim()) {
          combinedText += "\n\n" + text;
        }
      }

      console.log(`[STUDY] Total combined text length: ${combinedText.length}`);
      console.log(`[STUDY] First 200 chars of extracted text: "${combinedText.slice(0, 200)}"`);

      // Allow short text (minimum 10 chars) to proceed to AI
      if (combinedText.length < 10) {
        console.warn(`[STUDY] Text too short (${combinedText.length} chars), attempting to process anyway...`);
      }

      // 2️⃣ Generate study material
      const studyData = await generateStudyMaterial(combinedText);

      // 3️⃣ Return FLAT JSON (frontend expects this)
      return res.status(200).json({
        success: true,
        summary: studyData.summary,
        podcast_script: studyData.podcast_script,
        flashcards: studyData.flashcards,
        quiz: studyData.quiz,
      });
    } catch (error) {
      console.error("STUDY PROCESS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process study files",
      });
    }
  }
);

export default router;
