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
    const envUrl = process.env.PISTON_URL || process.env.PISTON_ENDPOINT || null;
    const PISTON_KEY = process.env.PISTON_KEY || process.env.PISTON_API_KEY || null;

    // Candidate Piston base URLs (will call <base>/runtimes then <base>/execute)
    const candidates = [];

    // Prefer explicit env override if provided
    if (envUrl) {
      const base = envUrl.replace(/\/execute\/?$/i, "").replace(/\/api\/v2\/?$/i, "");
      // add a few likely normalized variants
      candidates.push(base);
      candidates.push(`${base}/api/v2`);
      candidates.push(`${base}/api/v2/piston`);
    }

    // Common local docker mapping for piston (container starts on 2000)
    candidates.push("http://localhost:2000");
    candidates.push("http://localhost:2000/api/v2");
    candidates.push("http://localhost:2000/api/v2/piston");

    // Public instances to try (in order)
    candidates.push("https://emkc.org/api/v2/piston");
    candidates.push("https://piston.rs/api/v2");

    const headers = { "Content-Type": "application/json" };
    if (PISTON_KEY) {
      headers["Authorization"] = `Bearer ${PISTON_KEY}`;
      headers["x-api-key"] = PISTON_KEY;
    }

    let lastError = null;
    const attemptLog = [];

    for (const base of candidates) {
      try {
        // Check runtimes first (some instances require auth even for runtimes)
        const runtimesUrl = `${base.replace(/\/$/, "")}/runtimes`;
        const r = await axios.get(runtimesUrl, { headers, timeout: 5000 });
        attemptLog.push({ url: runtimesUrl, status: r.status });

        if (r.status !== 200) {
          lastError = { url: runtimesUrl, status: r.status, data: r.data };
          continue; // try next candidate
        }

        // runtimes ok — choose a concrete version if available to avoid "*-" lookups
        let execVersion;
        try {
          if (Array.isArray(r.data) && r.data.length > 0) {
            // Prefer an exact language match (normalize digits from pistonLang like python3 -> python)
            const langKey = pistonLang.replace(/[0-9]/g, "").toLowerCase();
            const exact = r.data.find((rt) => rt.language && rt.language.toLowerCase() === langKey);
            const candidate = exact || r.data[0];
            execVersion = candidate.version || (candidate.runtime || "").split("-").slice(1).join("-") || undefined;
          }
        } catch (e) {
          // ignore and proceed without version
          execVersion = undefined;
        }

        const executeUrl = `${base.replace(/\/$/, "")}/execute`;
        const payload = {
          language: pistonLang,
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
        };

        if (execVersion) payload.version = execVersion;

        const pistonResponse = await axios.post(executeUrl, payload, { headers, timeout: 10000 });

        // Successful execute — return result
        const run = pistonResponse.data.run;
        return res.json({ success: run.code === 0, output: run.stdout || "", error: run.stderr || null });
      } catch (err) {
        // log and continue to next candidate if auth or not available
        if (err.response) {
          attemptLog.push({ url: err.config && err.config.url, status: err.response.status, data: err.response.data });
          console.error("❌ PISTON ATTEMPT ERROR:", err.config && err.config.url, err.response.status, err.response.data);
          lastError = { url: err.config && err.config.url, status: err.response.status, data: err.response.data };
          // if unauthorized, try next candidate
          continue;
        } else {
          attemptLog.push({ url: err.config && err.config.url, error: err.message });
          console.error("❌ PISTON ATTEMPT NETWORK ERROR:", err.message);
          lastError = { url: err.config && err.config.url, error: err.message };
          continue;
        }
      }
    }

    // If we reach here, no candidate worked
    console.error("❌ PISTON ALL ATTEMPTS FAILED:", attemptLog);
    const errMsg = lastError && lastError.status === 401 ? "Piston unauthorized (401) — no valid public endpoint or key" : "No available Piston endpoint responded successfully";

    return res.status(502).json({ success: false, output: "", error: errMsg, attempts: attemptLog });
  } catch (error) {
    // Fallback generic error (should be rare since inner loop handles most)
    if (error.response) {
      console.error("❌ PISTON ERROR:", error.response.status, error.response.data);
    } else {
      console.error("❌ PISTON ERROR:", error.message);
    }

    return res.status(500).json({ success: false, output: "", error: "Code execution failed" });
  }
});

export default router;
