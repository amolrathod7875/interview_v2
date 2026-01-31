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
  }
}, { timestamps: true });

export default mongoose.model("UserProgress", UserProgressSchema);
