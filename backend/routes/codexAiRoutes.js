import express from "express";
import axios from "axios";
import { callCohere, parseCohereJSON } from "../services/cohere.service.js";
import mongoose from "mongoose";
import Topic from "../models/Topic.js";
import Problem from "../models/Problem.js";
import UserProgress from "../models/UserProgress.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/* -------------------------------------------------------------------------- */
/*                        STARTER CODE NORMALIZER                              */
/* -------------------------------------------------------------------------- */
const normalizeStarterCode = (code = "") => {
  if (!code) return "";

  return code
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/if __name__ == "__main__":[\s\S]*/g, "")
    .replace(/print\(.*?\)/g, "")
    .replace(/input\(.*?\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/* -------------------------------------------------------------------------- */
/*                             GENERATE PROBLEM                               */
/* -------------------------------------------------------------------------- */
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const { topicId, difficulty } = req.body;

    if (!topicId || !difficulty) {
      return res.status(400).json({ error: "topicId and difficulty are required" });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    // Try OpenRouter first; if it fails, fallback to Cohere using COHERE_API_KEY_CODEX
    let parsed;
    const systemMsg = `
You are a LeetCode-style problem generator.

Return ONLY valid JSON.

JSON FORMAT:
{
  "title": "string",
  "description": "string",
  "input": "string",
  "output": "string",
  "constraints": "string",
  "examples": "string",
  "starterCode": {
    "python": "string",
    "javascript": "string",
    "cpp": "string",
    "java": "string"
  }
}

starterCode rules:
- Template only
- NO main / input / print
- NO implementation
`;
    const userMsg = `Generate a ${difficulty} problem for topic: ${topic.name}`;

    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: process.env.OPENROUTER_MODEL_amol,
          temperature: 0.3,
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: userMsg }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_amol}`,
            "Content-Type": "application/json"
          }
        }
      );

      parsed = JSON.parse(response.data.choices[0].message.content);
    } catch (orErr) {
      console.warn("[CODEX] OpenRouter failed, falling back to Cohere (COHERE_API_KEY_CODEX):", orErr.message);
      const cohereKey = process.env.COHERE_API_KEY_CODEX;
      const text = await callCohere(userMsg, systemMsg, 2048, cohereKey);
      parsed = parseCohereJSON(text);
    }

    const problem = await Problem.create({
      title: parsed.title,
      description: parsed.description,
      input: parsed.input,
      output: parsed.output,
      constraints: parsed.constraints,
      examples: parsed.examples,
      starterCode: {
        python: normalizeStarterCode(parsed.starterCode?.python),
        javascript: normalizeStarterCode(parsed.starterCode?.javascript),
        cpp: normalizeStarterCode(parsed.starterCode?.cpp),
        java: normalizeStarterCode(parsed.starterCode?.java)
      },
      topic: topic._id,
      difficulty,
      generatedBy: "ai"
    });

    res.json(problem);
  } catch (err) {
    console.error(" Problem generation failed:", err.message);
    res.status(500).json({ error: "Failed to generate problem" });
  }
});

/* -------------------------------------------------------------------------- */
/*                               ANALYZE CODE                                 */
/* -------------------------------------------------------------------------- */
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { problemId, code } = req.body;

    if (!problemId || !code) {
      return res.status(400).json({ error: "problemId and code are required" });
    }

    const problem = await Problem.findById(problemId).populate("topic");
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    // Try OpenRouter first; fallback to Cohere (COHERE_API_KEY_CODEX) if OpenRouter errors
    const analyzeSystemMsg = `
You are a LeetCode solution evaluator.

Return ONLY valid JSON.
Judge logic only, not execution.
`;
    const analyzeUserMsg = `
Problem:
${problem.description}

User Code:
${code}

JSON:
{
  "correct": true | false,
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "improvements": ["string"]
}
`;

    let raw;
    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: process.env.OPENROUTER_MODEL_amol,
          temperature: 0.2,
          messages: [
            { role: "system", content: analyzeSystemMsg },
            { role: "user", content: analyzeUserMsg }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_amol}`,
            "Content-Type": "application/json"
          }
        }
      );

      raw = response.data.choices[0].message.content;
    } catch (orErr) {
      console.warn("[CODEX] OpenRouter analyze failed, falling back to Cohere (COHERE_API_KEY_CODEX):", orErr.message);
      const cohereKey = process.env.COHERE_API_KEY_CODEX;
      raw = await callCohere(analyzeUserMsg, analyzeSystemMsg, 1024, cohereKey);
    }
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: "Invalid analysis response" });
    }

    const analysis = JSON.parse(match[0]);

    /* ---------------- SAFE PROGRESS UPDATE ---------------- */
    try {
      const userId = req.user?.id;

      if (analysis.correct === true && mongoose.Types.ObjectId.isValid(userId)) {
        const progress = await UserProgress.findOneAndUpdate(
          { userId, topic: problem.topic._id },
          { $addToSet: { solvedProblems: problem._id } },
          { upsert: true, new: true }
        );

        const totalProblems = await Problem.countDocuments({
          topic: problem.topic._id
        });

        progress.completion =
          progress.solvedProblems.length / totalProblems;

        await progress.save();
      }
    } catch (progressErr) {
      console.warn("️ Progress update skipped:", progressErr.message);
    }

    res.json(analysis);
  } catch (err) {
    console.error(" Code analysis failed:", err.message);
    res.status(500).json({ error: "Failed to analyze code" });
  }
});

/* -------------------------------------------------------------------------- */
/*                               GET TOPICS                                   */
/* -------------------------------------------------------------------------- */
router.get("/topics", authMiddleware, async (req, res) => {
  const topics = await Topic.find().sort({ order: 1 });
  res.json(topics);
});

/* -------------------------------------------------------------------------- */
/*                              GET PROBLEMS                                  */
/* -------------------------------------------------------------------------- */
router.get("/problems", authMiddleware, async (req, res) => {
  const { topicId, difficulty } = req.query;
  if (!topicId) return res.status(400).json({ error: "topicId is required" });

  const problems = await Problem.find({
    topic: topicId,
    ...(difficulty && { difficulty })
  });

  res.json(problems);
});

export default router;
