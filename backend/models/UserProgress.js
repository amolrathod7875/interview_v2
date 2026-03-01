import mongoose from "mongoose";

const UserProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true
  },
  solvedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem"
  }],
  completion: {
    type: Number,
    default: 0
  },
  // Core problem tracking
  coreProgress: [{
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: "CoreProblem" },
    status: { type: String, enum: ["attempted", "solved"], default: "attempted" },
    executionTime: { type: Number, default: 0 },    // ms
    memoryUsed: { type: Number, default: 0 },        // KB
    solvedAt: { type: Date }
  }],
  lastAttemptAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("UserProgress", UserProgressSchema);
