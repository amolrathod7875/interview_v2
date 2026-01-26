import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * Supported language mapping
 * (Frontend -> Piston)
 */
const LANGUAGE_MAP = {
  python: "python3",
  javascript: "javascript",
  java: "java",
  cpp: "cpp"
};

/**
 * POST /codex/code/execute
 * body: { language, code }
 */
router.post("/execute", async (req, res) => {
  console.log("🔥 /codex/code/execute HIT");
  console.log("👉 BODY:", req.body);

  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({
      error: "language and code are required"
    });
  }

  const pistonLang = LANGUAGE_MAP[language];

  if (!pistonLang) {
    return res.status(400).json({
      error: "Unsupported language"
    });
  }

  try {
    const pistonResponse = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: pistonLang,
        version: "*",
        files: [
          {
            name:
              pistonLang === "python3"
                ? "main.py"
                : pistonLang === "javascript"
                ? "main.js"
                : pistonLang === "java"
                ? "Main.java"
                : "main.cpp",
            content: code
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    const run = pistonResponse.data.run;

    return res.json({
      run: {
        stdout: run.stdout,
        stderr: run.stderr,
        output: run.output,
        code: run.code
      }
    });

  } catch (error) {
    console.error("❌ PISTON ERROR");
    console.error(error.response?.data || error.message);

    return res.status(500).json({
      error: "Code execution failed",
      details: error.response?.data || error.message
    });
  }
});

export default router;
