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

/* -------------------------------------------------------------------------- */
/*                            EXECUTE USER CODE                               */
/* -------------------------------------------------------------------------- */
/**
 * POST /codex/code/execute
 * body: { language, code }
 */
router.post("/execute", async (req, res) => {
  console.log("🔥 /codex/code/execute HIT");

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
      success: run.code === 0,
      output: run.stdout || "",
      error: run.stderr || null
    });

  } catch (error) {
    console.error("❌ PISTON ERROR:", error.message);

    return res.status(500).json({
      success: false,
      output: "",
      error: "Code execution failed"
    });
  }
});

export default router;
