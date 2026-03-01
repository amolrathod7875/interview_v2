import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import CoreProblem from "../models/CoreProblem.js";
import UserProgress from "../models/UserProgress.js";
import UserStats from "../models/UserStats.js";
import Topic from "../models/Topic.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                        JUDGE0 CONFIGURATION                                 */
/* -------------------------------------------------------------------------- */
const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";

const LANGUAGE_MAP = {
  python:     71,  // Python 3.8.1
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  java:       62,  // Java (OpenJDK 13.0.1)
  cpp:        54   // C++ (GCC 9.2.0)
};

/* -------------------------------------------------------------------------- */
/*                           HELPER FUNCTIONS                                  */
/* -------------------------------------------------------------------------- */

// Execute code using Judge0
const executeCode = async (language, code, stdin = "") => {
  const languageId = LANGUAGE_MAP[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const response = await axios.post(
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

  return response.data;
};

// Update user streak
const updateStreak = async (userId) => {
  const stats = await UserStats.findOne({ userId });
  if (!stats) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
  
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Already active today, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      stats.currentStreak += 1;
    } else {
      // Streak broken
      stats.currentStreak = 1;
    }
  } else {
    // First time active
    stats.currentStreak = 1;
  }
  
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }
  
  stats.lastActiveDate = today;
  
  // Update daily activity map
  const dateKey = today.toISOString().split('T')[0];
  const activity = stats.dailyActivityMap.get(dateKey) || { problemsSolved: 0, tokensEarned: 0 };
  activity.problemsSolved = (activity.problemsSolved || 0) + 1;
  stats.dailyActivityMap.set(dateKey, activity);
  
  // Award tokens for solving a problem
  const tokenReward = 10;
  stats.tokens += tokenReward;
  stats.totalTokensEarned += tokenReward;
  activity.tokensEarned = (activity.tokensEarned || 0) + tokenReward;
  
  await stats.save();
};

/* -------------------------------------------------------------------------- */
/*                        GET CORE PROBLEMS LIST                              */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/codex/core
 * Query params: topicId?, difficulty?, status? (solved/unsolved)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { topicId, difficulty, status } = req.query;
    const userId = req.user.id;

    // Build query
    const query = { isPublished: true };
    if (topicId) query.topic = topicId;
    if (difficulty) query.difficulty = difficulty;

    // Fetch problems
    const problems = await CoreProblem.find(query)
      .populate("topic", "name")
      .sort({ difficulty: 1, title: 1 });

    // Get user's progress for core problems
    const userProgress = await UserProgress.findOne({ userId });
    const solvedCoreIds = userProgress?.coreProgress
      .filter(p => p.status === "solved")
      .map(p => p.problemId.toString()) || [];

    // Add status to problems
    const problemsWithStatus = problems.map(p => ({
      _id: p._id,
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      status: solvedCoreIds.includes(p._id.toString()) ? "solved" : "unsolved"
    }));

    // Filter by status if provided
    let filteredProblems = problemsWithStatus;
    if (status === "solved") {
      filteredProblems = problemsWithStatus.filter(p => p.status === "solved");
    } else if (status === "unsolved") {
      filteredProblems = problemsWithStatus.filter(p => p.status === "unsolved");
    }

    res.json({
      problems: filteredProblems,
      total: problems.length,
      solved: solvedCoreIds.length
    });
  } catch (err) {
    console.error("Error fetching core problems:", err.message);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        GET SINGLE PROBLEM                                  */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/codex/core/:id
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const problem = await CoreProblem.findById(req.params.id)
      .populate("topic", "name");

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json(problem);
  } catch (err) {
    console.error("Error fetching problem:", err.message);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        SUBMIT SOLUTION                                     */
/* -------------------------------------------------------------------------- */
/**
 * POST /api/codex/core/submit
 * Body: { problemId, code, language }
 */
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user.id;

    if (!problemId || !code || !language) {
      return res.status(400).json({ error: "problemId, code, and language are required" });
    }

    // Fetch problem with test cases
    const problem = await CoreProblem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    if (!problem.testCases || problem.testCases.length === 0) {
      return res.status(400).json({ error: "No test cases available" });
    }

    // Run against test cases
    const testResults = [];
    let passed = 0;
    let totalExecutionTime = 0;
    let totalMemory = 0;

    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      
      try {
        const result = await executeCode(language, code, testCase.input);
        
        const actualOutput = (result.stdout || "").trim();
        const expectedOutput = testCase.expectedOutput.trim();
        const testPassed = actualOutput === expectedOutput;
        
        if (testPassed) passed++;
        
        testResults.push({
          testCase: i + 1,
          passed: testPassed,
          input: testCase.input,
          output: actualOutput,
          expected: expectedOutput,
          status: result.status?.description || "Unknown"
        });
        
        // Track execution metrics (approximate)
        totalExecutionTime += result.time || 0;
        totalMemory += result.memory || 0;
        
      } catch (execErr) {
        testResults.push({
          testCase: i + 1,
          passed: false,
          input: testCase.input,
          output: "",
          expected: testCase.expectedOutput,
          error: execErr.message
        });
      }
    }

    const success = passed === problem.testCases.length;

    // Update user progress if all tests pass
    if (success) {
      const userProgress = await UserProgress.findOne({ userId });
      
      if (userProgress) {
        const existingCoreProgress = userProgress.coreProgress.find(
          cp => cp.problemId.toString() === problemId
        );
        
        if (existingCoreProgress) {
          // Already solved, just update if not already solved
          if (existingCoreProgress.status !== "solved") {
            existingCoreProgress.status = "solved";
            existingCoreProgress.solvedAt = new Date();
            existingCoreProgress.executionTime = totalExecutionTime;
            existingCoreProgress.memoryUsed = totalMemory;
          }
        } else {
          // New solve
          userProgress.coreProgress.push({
            problemId,
            status: "solved",
            executionTime: totalExecutionTime,
            memoryUsed: totalMemory,
            solvedAt: new Date()
          });
        }
        
        userProgress.lastAttemptAt = new Date();
        await userProgress.save();
      }

      // Update streak and stats
      await updateStreak(userId);
    }

    res.json({
      success,
      passed,
      total: problem.testCases.length,
      executionTime: totalExecutionTime,
      memoryUsed: totalMemory,
      testResults
    });

  } catch (err) {
    console.error("Error submitting solution:", err.message);
    res.status(500).json({ error: "Failed to submit solution" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        GET TOPICS FOR CORE                                 */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/codex/core/topics
 */
router.get("/topics", authMiddleware, async (req, res) => {
  try {
    const topics = await Topic.find().sort({ order: 1 });
    res.json(topics);
  } catch (err) {
    console.error("Error fetching topics:", err.message);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

export default router;
