import express from "express";
import { Octokit } from "@octokit/rest";
import { githubAuth } from "../middlewares/githubAuth.js";
import axios from "axios";

const router = express.Router();

/*
  Mounted at:
  app.use("/api/ai/github", githubAiRoutes)

  FINAL ENDPOINT:
  POST /api/ai/github/analyze
*/

// 🔥 IMPORTANT: prevent cookie leakage to OpenRouter
axios.defaults.withCredentials = false;

router.post("/analyze", githubAuth, async (req, res) => {
  try {
    const { owner, repo } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: "owner and repo are required",
      });
    }

    /* =====================
       GitHub API (uses cookie auth)
    ===================== */
    const octokit = new Octokit({
      auth: req.githubToken,
    });

    /* =====================
       1️⃣ FETCH README
    ===================== */
    let readmeText = "";
    try {
      const readmeResp = await octokit.repos.getReadme({ owner, repo });
      readmeText = Buffer.from(
        readmeResp.data.content,
        "base64"
      ).toString("utf-8");
    } catch {
      readmeText = "No README found.";
    }

    /* =====================
       2️⃣ FETCH FILE TREE
    ===================== */
    const treeResp = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "1",
    });

    const paths = treeResp.data.tree
      .filter((f) => f.path)
      .map((f) => f.path);

    /* =====================
       3️⃣ TECH STACK
    ===================== */
    const techStack = detectTechStack(paths, readmeText);

    /* =====================
       4️⃣ OPENROUTER AI (NO COOKIES)
    ===================== */
    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [
          {
            role: "system",
            content:
              "You are a senior software engineer helping candidates analyze GitHub projects for resumes and interviews.",
          },
          {
            role: "user",
            content: `
Analyze the following GitHub repository and respond STRICTLY in JSON.

Repository: ${owner}/${repo}

README:
${readmeText}

Detected Tech Stack:
${JSON.stringify(techStack)}

File Structure:
${paths.slice(0, 80).join("\n")}

Return JSON with:
- projectSummary (string)
- resumeBulletPoints (array of strings)
- interviewQuestions (array of strings)
`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_amol}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Interview.io",
        },
        withCredentials: false, // 🔥 ABSOLUTELY REQUIRED
      }
    );

    const content =
      aiResponse.data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        projectSummary: content,
        resumeBulletPoints: [],
        interviewQuestions: [],
      };
    }

    return res.status(200).json({
      success: true,
      repo: `${owner}/${repo}`,
      techStack,
      ...parsed,
    });
  } catch (err) {
    console.error(
      "❌ GitHub AI Analyze Error:",
      err.response?.data || err.message
    );
    res.status(500).json({
      success: false,
      message: "GitHub AI analysis failed",
    });
  }
});

export default router;

/* =====================
   HELPERS
===================== */
function detectTechStack(paths, readme) {
  const stack = {
    languages: [],
    frameworks: [],
    domain: [],
  };

  const text = `${paths.join(" ")} ${readme}`.toLowerCase();

  if (text.includes("package.json")) stack.languages.push("JavaScript");
  if (text.includes("requirements.txt")) stack.languages.push("Python");
  if (text.includes(".java")) stack.languages.push("Java");

  if (text.includes("react")) stack.frameworks.push("React");
  if (text.includes("express")) stack.frameworks.push("Express");
  if (text.includes("django")) stack.frameworks.push("Django");
  if (text.includes("flask")) stack.frameworks.push("Flask");

  if (
    text.includes("sklearn") ||
    text.includes("tensorflow") ||
    text.includes("pytorch")
  ) {
    stack.domain.push("Machine Learning");
  }

  return stack;
}
