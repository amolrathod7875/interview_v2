import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { parseFileToText } from "../services/fileParser.service.js";
import { generateStudyMaterial, generateQuiz } from "../services/studyAI.service.js";
import audioService from "../services/audio.service.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// In-memory store for study sessions (in production, use Redis or database)
const studySessions = new Map();

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

      console.log(`[STUDY] Processing ${req.files.length} files in parallel...`);

      // 1️⃣ Extract text from all files IN PARALLEL
      const parsePromises = req.files.map(async (file) => {
        try {
          const text = await parseFileToText(file.path);
          console.log(`[STUDY] Parsed file: ${file.originalname}, text length: ${text?.length || 0}`);
          return { name: file.originalname, text: text || "" };
        } catch (error) {
          console.error(`[STUDY] Error parsing ${file.originalname}:`, error.message);
          return { name: file.originalname, text: "", error: error.message };
        }
      });

      const parsedFiles = await Promise.all(parsePromises);
      
      // Combine text from all files
      let combinedText = "";
      for (const file of parsedFiles) {
        if (file.text && file.text.trim()) {
          combinedText += "\n\n" + file.text;
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

      // Generate a session ID for this study session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the combined text for quiz regeneration
      studySessions.set(sessionId, {
        text: combinedText,
        createdAt: new Date(),
      });

      // Add session ID to response
      const responseData = {
        success: true,
        sessionId,
        summary: studyData.summary,
        flashcards: studyData.flashcards,
        quiz: studyData.quiz,
      };

      // 3️⃣ Return FLAT JSON (frontend expects this)
      return res.status(200).json(responseData);
    } catch (error) {
      console.error("STUDY PROCESS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process study files",
      });
    }
  }
);

/**
 * POST /api/study/quiz
 * Generate a new quiz with custom question count
 * Body: { sessionId, count }
 */
router.post("/quiz", async (req, res) => {
  try {
    const { sessionId, count, text } = req.body;

    if (!sessionId && !text) {
      return res.status(400).json({
        success: false,
        message: "Either sessionId or text is required",
      });
    }

    let combinedText = "";

    if (sessionId) {
      // Retrieve text from existing session
      const session = studySessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found. Please upload files again.",
        });
      }
      combinedText = session.text;
    } else if (text) {
      // Use provided text directly
      combinedText = text;
    }

    if (combinedText.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Text too short to generate quiz",
      });
    }

    // Validate and sanitize count
    const questionCount = Math.min(Math.max(parseInt(count) || 5, 3), 20);
    console.log(`[STUDY] Generating quiz with ${questionCount} questions`);

    // Generate quiz with custom count
    const quiz = await generateQuiz(combinedText, questionCount);

    return res.status(200).json({
      success: true,
      quiz,
      count: quiz.length,
    });
  } catch (error) {
    console.error("QUIZ GENERATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate quiz",
    });
  }
});

/**
 * GET /api/study/session/:sessionId
 * Get session info (for debugging)
 */
router.get("/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const session = studySessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  return res.status(200).json({
    success: true,
    session: {
      textLength: session.text.length,
      createdAt: session.createdAt,
    },
  });
});

/**
 * POST /api/study/audio
 * Generate audio from text using DeepGram Nova
 */
router.post("/audio", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    console.log(`[AUDIO] Generating audio for ${text.length} characters...`);

    // If text exceeds DeepGram TTS limits, summarize or truncate before TTS
    let textToSynthesize = text;
    if (text.length > 2000) {
      console.warn(`[AUDIO] Input text (${text.length}) exceeds DeepGram limit. Summarizing before TTS.`);
      try {
        const summaryData = await generateStudyMaterial(text);
        if (summaryData && summaryData.summary && summaryData.summary.trim().length > 0) {
          textToSynthesize = summaryData.summary.trim();
          console.log(`[AUDIO] Summarization produced ${textToSynthesize.length} characters.`);
        } else {
          // Fallback: truncate to first 2000 chars
          textToSynthesize = text.slice(0, 2000);
          console.log(`[AUDIO] Summarization empty; truncated text to ${textToSynthesize.length} chars.`);
        }
      } catch (err) {
        console.error('[AUDIO] Summarization failed, truncating text for TTS', err);
        textToSynthesize = text.slice(0, 2000);
      }
    }

    // Clean text: remove markdown formatting before audio generation
    textToSynthesize = textToSynthesize
      .replace(/^#{1,6}\s+/gm, '') // Remove headers (# Header -> Header)
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold (**text** -> text)
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic (*text* -> text)
      .replace(/`([^`]+)`/g, '$1') // Remove inline code (`code` -> code)
      .replace(/^[\-\*]\s+/gm, '') // Remove bullet points (- or * at start)
      .replace(/\n{3,}/g, '\n\n') // Clean excessive newlines
      .trim();

    console.log(`[AUDIO] Cleaned text for audio: ${textToSynthesize.length} characters.`);

    // Generate unique filename based on content hash (use synthesized text for cache key)
    const hash = crypto.createHash("md5").update(textToSynthesize).digest("hex");
    const filename = `study_audio_${hash}.mp3`;

    // Check if audio already exists (cache)
    const audioPath = path.join(__dirname, "../uploads/audio", filename);

    let audioBuffer;
    if (fs.existsSync(audioPath)) {
      // Use cached audio
      console.log(`[AUDIO] Using cached audio: ${filename}`);
      audioBuffer = fs.readFileSync(audioPath);
    } else {
      // Generate new audio
      console.log(`[AUDIO] Generating new audio with DeepGram...`);
      audioBuffer = await audioService.generateAudio(textToSynthesize);

      // Save for future use
      const dir = path.dirname(audioPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(audioPath, audioBuffer);
      console.log(`[AUDIO] Saved audio to: ${audioPath}`);
    }

    // Send audio file
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "Content-Disposition": `inline; filename="${filename}"`,
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error("[AUDIO] Generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate audio",
      error: error.message,
    });
  }
});

export default router;
