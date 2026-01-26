import express from "express";
import axios from "axios";

const router = express.Router();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * POST /codex/ai/generate
 */
router.post("/generate", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY_amol) {
      throw new Error("OPENROUTER_API_KEY_amol is missing");
    }

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: process.env.OPENROUTER_MODEL_amol,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `
You are a competitive programming problem setter.

You MUST return VALID JSON.
You MUST fill ALL fields with meaningful content.
DO NOT leave any field empty.
DO NOT add markdown.
DO NOT add explanations.
DO NOT add solutions.

JSON FORMAT (STRICT):
{
  "title": "string",
  "description": "string",
  "input": "string",
  "output": "string",
  "constraints": "string",
  "examples": "string"
}
`
          },
          {
            role: "user",
            content: "Generate one medium-difficulty DSA coding problem."
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_amol}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    // ✅ SAFE JSON PARSE
    let problem;
    try {
      problem = JSON.parse(raw);
    } catch (e) {
      console.error("Invalid JSON from OpenRouter:", raw);
      return res.status(500).json({
        error: "Invalid problem format returned by AI"
      });
    }

    // ✅ FINAL GUARARD (never return empty fields)
    const normalizedProblem = {
      title: problem.title?.trim() || "Untitled Problem",
      description: problem.description?.trim() || "No description provided.",
      input: problem.input?.trim() || "No input description.",
      output: problem.output?.trim() || "No output description.",
      constraints: problem.constraints?.trim() || "No constraints provided.",
      examples: problem.examples?.trim() || "No examples provided."
    };

    res.json(normalizedProblem);

  } catch (err) {
    console.error(
      "Problem Generation Error:",
      err.response?.data || err.message
    );

    res.status(500).json({
      error: "Failed to generate problem"
    });
  }
});

/**
 * POST /codex/ai/analyze
 */
router.post("/analyze", async (req, res) => {
  try {
    const { problem, code } = req.body;

    if (!problem || !code) {
      return res.status(400).json({
        error: "problem and code are required"
      });
    }

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: process.env.OPENROUTER_MODEL_amol,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
You are a strict code reviewer.

Return:
- Correctness (Yes/No)
- Time Complexity
- Space Complexity
- Improvements (if any)
`
          },
          {
            role: "user",
            content: `
Problem:
${JSON.stringify(problem, null, 2)}

User Code:
${code}
`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_amol}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      analysis: response.data.choices[0].message.content
    });

  } catch (err) {
    console.error(
      "Code Analysis Error:",
      err.response?.data || err.message
    );

    res.status(500).json({
      error: "Failed to analyze code"
    });
  }
});

export default router;
