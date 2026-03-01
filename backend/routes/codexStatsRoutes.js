import express from "express";
import UserStats from "../models/UserStats.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                        GET USER STATS                                      */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/codex/stats
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let stats = await UserStats.findOne({ userId });
    
    // Create stats if doesn't exist
    if (!stats) {
      stats = await UserStats.create({ userId });
    }
    
    // Convert Map to plain object for JSON response
    const dailyActivityMap = {};
    if (stats.dailyActivityMap) {
      stats.dailyActivityMap.forEach((value, key) => {
        dailyActivityMap[key] = value;
      });
    }
    
    res.json({
      tokens: stats.tokens,
      totalTokensSpent: stats.totalTokensSpent,
      totalTokensEarned: stats.totalTokensEarned,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastActiveDate: stats.lastActiveDate,
      dailyActivityMap,
      coreProblemsSolved: stats.coreProblemsSolved,
      sandboxProblemsAttempted: stats.sandboxProblemsAttempted
    });
  } catch (err) {
    console.error("Error fetching user stats:", err.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        UPDATE DAILY ACTIVITY                               */
/* -------------------------------------------------------------------------- */
/**
 * POST /api/codex/stats/daily
 * Called when user solves a problem
 */
router.post("/daily", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemType = "core", tokensEarned = 10 } = req.body;
    
    let stats = await UserStats.findOne({ userId });
    
    if (!stats) {
      stats = await UserStats.create({ userId });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().split('T')[0];
    
    // Update streak
    const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
    
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Already active today
      } else if (daysDiff === 1) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }
    } else {
      stats.currentStreak = 1;
    }
    
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
    
    stats.lastActiveDate = today;
    
    // Update daily activity
    const activity = stats.dailyActivityMap.get(dateKey) || { problemsSolved: 0, tokensEarned: 0 };
    activity.problemsSolved = (activity.problemsSolved || 0) + 1;
    activity.tokensEarned = (activity.tokensEarned || 0) + tokensEarned;
    stats.dailyActivityMap.set(dateKey, activity);
    
    // Award tokens
    stats.tokens += tokensEarned;
    stats.totalTokensEarned += tokensEarned;
    
    // Update problem type counts
    if (problemType === "core") {
      stats.coreProblemsSolved += 1;
    } else {
      stats.sandboxProblemsAttempted += 1;
    }
    
    await stats.save();
    
    res.json({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      tokens: stats.tokens,
      tokensEarned
    });
  } catch (err) {
    console.error("Error updating daily activity:", err.message);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        DEDUCT TOKENS                                       */
/* -------------------------------------------------------------------------- */
/**
 * POST /api/codex/stats/deduct
 * Body: { amount }
 */
router.post("/deduct", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    let stats = await UserStats.findOne({ userId });
    
    if (!stats) {
      stats = await UserStats.create({ userId });
    }
    
    if (stats.tokens < amount) {
      return res.status(402).json({ 
        error: "Insufficient tokens",
        tokens: stats.tokens,
        required: amount
      });
    }
    
    stats.tokens -= amount;
    stats.totalTokensSpent += amount;
    await stats.save();
    
    res.json({
      tokens: stats.tokens,
      spent: amount
    });
  } catch (err) {
    console.error("Error deducting tokens:", err.message);
    res.status(500).json({ error: "Failed to deduct tokens" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        ADD TOKENS (Admin/Bonus)                            */
/* -------------------------------------------------------------------------- */
/**
 * POST /api/codex/stats/add
 * Body: { amount }
 */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    let stats = await UserStats.findOne({ userId });
    
    if (!stats) {
      stats = await UserStats.create({ userId });
    }
    
    stats.tokens += amount;
    stats.totalTokensEarned += amount;
    await stats.save();
    
    res.json({
      tokens: stats.tokens,
      added: amount
    });
  } catch (err) {
    console.error("Error adding tokens:", err.message);
    res.status(500).json({ error: "Failed to add tokens" });
  }
});

export default router;
