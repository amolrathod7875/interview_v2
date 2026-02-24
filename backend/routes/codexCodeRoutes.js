import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * Judge0 CE - free public code execution API (no key required for CE)
 * Docs: https://ce.judge0.com/
 */
const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";

/**
 * Judge0 CE language IDs
 * Full list: GET https://ce.judge0.com/languages
 */
const LANGUAGE_MAP = {
  python:     71,  // Python 3.8.1
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  java:       62,  // Java (OpenJDK 13.0.1)
  cpp:        54   // C++ (GCC 9.2.0)
};

/* -------------------------------------------------------------------------- */
/*                            EXECUTE USER CODE                               */
/* -------------------------------------------------------------------------- */
/**
 * POST /codex/code/execute
 * body: { language, code, stdin? }
 */
router.post("/execute", async (req, res) => {
  console.log("🔥 /codex/code/execute HIT");

  const { language, code, stdin = "" } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "language and code are required" });
  }

  const languageId = LANGUAGE_MAP[language];

  if (!languageId) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  try {
    // Submit with wait=true for a synchronous response (no polling needed)
    const judge0Res = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: stdin,
        redirect_stderr_to_stdout: false
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 20000
      }
    );

    const result = judge0Res.data;
    console.log("✅ Judge0 status:", result.status?.description);

    // status id 3 = Accepted (success), others are errors/TLE/etc.
    const success = result.status?.id === 3;
    const output  = result.stdout || "";
    const errOut  = result.stderr || result.compile_output || result.message || null;

    return res.json({ success, output, error: errOut });

  } catch (error) {
    console.error("❌ JUDGE0 ERROR:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:",   JSON.stringify(error.response.data));
    }

    return res.status(500).json({
      success: false,
      output: "",
      error: `Code execution failed: ${error.message}`
    });
  }
});

export default router;

