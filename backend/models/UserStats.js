import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  tokens: { type: Number, default: 100 },         // Starting tokens
  totalTokensSpent: { type: Number, default: 0 },
  totalTokensEarned: { type: Number, default: 0 },
  
  // Streak tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  
  // Activity heatmap (GitHub-style)
  dailyActivityMap: {
    type: Map,
    of: {
      problemsSolved: { type: Number, default: 0 },
      tokensEarned: { type: Number, default: 0 }
    },
    default: new Map()
  },
  
  // Problem type counts
  coreProblemsSolved: { type: Number, default: 0 },
  sandboxProblemsAttempted: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("UserStats", UserStatsSchema);
