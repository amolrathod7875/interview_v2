import express from "express";
import axios from "axios";
import { callCohere, parseCohereJSON } from "../services/cohere.service.js";
import mongoose from "mongoose";
import Topic from "../models/Topic.js";
import Problem from "../models/Problem.js";
import ProblemCounter from "../models/ProblemCounter.js";
import UserProgress from "../models/UserProgress.js";
import UserStats from "../models/UserStats.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Token cost for generating a sandbox problem
const SANDBOX_GENERATE_COST = 5;
const POOL_MIN_CONFIG = Number(process.env.CODEX_POOL_MIN || 10);
const POOL_TARGET_CONFIG = Number(process.env.CODEX_POOL_TARGET || 15);
const PROBLEM_POOL_MIN = Math.max(1, Math.min(POOL_MIN_CONFIG, POOL_TARGET_CONFIG));
const PROBLEM_POOL_TARGET = Math.max(PROBLEM_POOL_MIN, POOL_TARGET_CONFIG);
const MAX_UNIQUENESS_RETRIES = Number(process.env.CODEX_UNIQUENESS_RETRIES || 5);

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

const getCounterKey = (topicId, difficulty) => `${topicId}_${difficulty}`;

const normalizeText = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTokenSet = (text = "") => {
  const normalized = normalizeText(text);
  if (!normalized) return new Set();
  return new Set(normalized.split(" ").filter(Boolean));
};

const jaccardSimilarity = (setA, setB) => {
  if (!setA.size && !setB.size) return 1;
  if (!setA.size || !setB.size) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }

  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
};

const buildFingerprint = ({ title = "", description = "" }) => {
  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description).slice(0, 300);
  return {
    normalizedTitle,
    normalizedDescription,
    titleTokens: getTokenSet(title),
    descriptionTokens: getTokenSet(description)
  };
};

const isNearDuplicate = (candidate, existingFingerprints) => {
  if (!candidate.normalizedTitle) return true;

  return existingFingerprints.some((existing) => {
    if (candidate.normalizedTitle === existing.normalizedTitle) return true;
    if (
      candidate.normalizedDescription &&
      existing.normalizedDescription &&
      candidate.normalizedDescription === existing.normalizedDescription
    ) {
      return true;
    }

    const titleSimilarity = jaccardSimilarity(candidate.titleTokens, existing.titleTokens);
    const descriptionSimilarity = jaccardSimilarity(
      candidate.descriptionTokens,
      existing.descriptionTokens
    );

    return titleSimilarity >= 0.8 || (titleSimilarity >= 0.6 && descriptionSimilarity >= 0.75);
  });
};

const pruneDuplicateProblems = async (topicId, difficulty) => {
  const publishedProblems = await Problem.find({
    topic: topicId,
    difficulty,
    isPublished: true,
    questionNumber: { $type: "number" }
  })
    .select("_id title description questionNumber createdAt")
    .sort({ questionNumber: 1, createdAt: 1 })
    .lean();

  if (publishedProblems.length <= 1) {
    return { removed: 0, remaining: publishedProblems.length };
  }

  const keptFingerprints = [];
  const duplicateIds = [];

  for (const problem of publishedProblems) {
    const fingerprint = buildFingerprint(problem);
    if (isNearDuplicate(fingerprint, keptFingerprints)) {
      duplicateIds.push(problem._id);
      continue;
    }
    keptFingerprints.push(fingerprint);
  }

  if (duplicateIds.length > 0) {
    await Problem.updateMany(
      { _id: { $in: duplicateIds } },
      { $set: { isPublished: false } }
    );
  }

  return {
    removed: duplicateIds.length,
    remaining: publishedProblems.length - duplicateIds.length
  };
};

const getExistingFingerprints = async (topicId, difficulty) => {
  const existingProblems = await Problem.find({
    topic: topicId,
    difficulty,
    isPublished: true,
    questionNumber: { $type: "number" }
  })
    .select("title description")
    .lean();

  return existingProblems.map((problem) => buildFingerprint(problem));
};

const getNextQuestionNumber = async (topicId, difficulty) => {
  const key = getCounterKey(topicId, difficulty);
  const counter = await ProblemCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
};

const generateProblemPayload = async (topic, difficulty, existingFingerprints = []) => {
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
  const avoidTitles = existingFingerprints
    .map((f) => f.normalizedTitle)
    .filter(Boolean)
    .slice(-8)
    .join(" | ");

  const uniquenessHint = avoidTitles
    ? `\nAvoid repeating or closely paraphrasing these existing problems: ${avoidTitles}`
    : "";

  const userMsg = `Generate a ${difficulty} problem for topic: ${topic.name}.${uniquenessHint}\nUse a distinctly different core idea than previous problems.`;

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

  return {
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
    generatedBy: "ai",
    isPublished: true
  };
};

const createNumberedProblem = async (topic, difficulty) => {
  const fingerprints = await getExistingFingerprints(topic._id, difficulty);

  for (let attempt = 1; attempt <= MAX_UNIQUENESS_RETRIES; attempt += 1) {
    const payload = await generateProblemPayload(topic, difficulty, fingerprints);
    const candidateFingerprint = buildFingerprint(payload);

    if (isNearDuplicate(candidateFingerprint, fingerprints)) {
      continue;
    }

    const questionNumber = await getNextQuestionNumber(topic._id.toString(), difficulty);
    const created = await Problem.create({
      ...payload,
      questionNumber
    });

    return created;
  }

  throw new Error("Failed to generate a unique problem after multiple attempts");
};

const getPoolCount = async (topicId, difficulty) =>
  Problem.countDocuments({
    topic: topicId,
    difficulty,
    isPublished: true,
    questionNumber: { $type: "number" }
  });

const topUpProblemPool = async (topic, difficulty) => {
  let count = await getPoolCount(topic._id, difficulty);
  if (count >= PROBLEM_POOL_MIN) return count;

  while (count < PROBLEM_POOL_TARGET) {
    await createNumberedProblem(topic, difficulty);
    count += 1;
  }

  return count;
};

/* -------------------------------------------------------------------------- */
/*                             GENERATE PROBLEM                               */
/* -------------------------------------------------------------------------- */
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const { topicId, difficulty, forceNew = false } = req.body;
    const userId = req.user.id;

    if (!topicId || !difficulty) {
      return res.status(400).json({ error: "topicId and difficulty are required" });
    }

    // Check token balance
    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = await UserStats.create({ userId });
    }

    if (stats.tokens < SANDBOX_GENERATE_COST) {
      return res.status(402).json({ 
        error: "Insufficient tokens",
        tokens: stats.tokens,
        cost: SANDBOX_GENERATE_COST
      });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    await pruneDuplicateProblems(topic._id, difficulty);

    let poolCount = await topUpProblemPool(topic, difficulty);

    let problem;
    if (forceNew) {
      problem = await createNumberedProblem(topic, difficulty);
      poolCount += 1;
    } else {
      problem = await Problem.findOneAndUpdate(
        {
          topic: topic._id,
          difficulty,
          isPublished: true,
          questionNumber: { $type: "number" }
        },
        { $set: { lastServedAt: new Date() } },
        {
          new: true,
          sort: { lastServedAt: 1, questionNumber: 1 }
        }
      );

      if (!problem) {
        problem = await createNumberedProblem(topic, difficulty);
        poolCount = 1;
      }
    }

    // Deduct tokens for generating problem
    stats.tokens -= SANDBOX_GENERATE_COST;
    stats.totalTokensSpent += SANDBOX_GENERATE_COST;
    await stats.save();

    res.json({
      ...problem._doc,
      tokensSpent: SANDBOX_GENERATE_COST,
      remainingTokens: stats.tokens,
      poolSize: poolCount
    });
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
      
      // Update sandbox stats
      if (analysis.correct === true && mongoose.Types.ObjectId.isValid(userId)) {
        const stats = await UserStats.findOne({ userId });
        if (stats) {
          stats.sandboxProblemsAttempted += 1;
          await stats.save();
        }
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
router.get("/topics", async (req, res) => {
  const topics = await Topic.find().sort({ order: 1 });
  res.json(topics);
});

/* -------------------------------------------------------------------------- */
/*                              GET PROBLEMS                                  */
/* -------------------------------------------------------------------------- */
router.get("/problems", authMiddleware, async (req, res) => {
  try {
    const { topicId, difficulty } = req.query;
    if (!topicId) return res.status(400).json({ error: "topicId is required" });

    if (difficulty) {
      await pruneDuplicateProblems(topicId, difficulty);
    }

    const problems = await Problem.find({
      topic: topicId,
      isPublished: true,
      questionNumber: { $type: "number" },
      ...(difficulty && { difficulty })
    }).sort({ questionNumber: 1, createdAt: 1 });

    const progress = await UserProgress.findOne({
      userId: req.user.id,
      topic: topicId
    }).select("solvedProblems");

    const solvedSet = new Set((progress?.solvedProblems || []).map((id) => id.toString()));

    const fingerprints = [];
    const dedupedProblems = problems.filter((problem) => {
      const candidate = buildFingerprint(problem);
      if (isNearDuplicate(candidate, fingerprints)) {
        return false;
      }
      fingerprints.push(candidate);
      return true;
    });

    const enrichedProblems = dedupedProblems.map((problem, index) => ({
      ...problem.toObject(),
      questionNumber: problem.questionNumber || index + 1,
      solved: solvedSet.has(problem._id.toString())
    }));

    res.json({
      problems: enrichedProblems,
      total: enrichedProblems.length,
      solved: enrichedProblems.filter((p) => p.solved).length
    });
  } catch (err) {
    console.error("Failed to fetch sandbox problems:", err.message);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

export default router;
