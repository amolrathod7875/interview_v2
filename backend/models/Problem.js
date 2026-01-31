import mongoose from "mongoose";

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    input: {
      type: String,
      default: ""
    },

    output: {
      type: String,
      default: ""
    },

    constraints: {
      type: String,
      default: ""
    },

    examples: {
      type: String,
      default: ""
    },

    // ✅ NEW: LeetCode-style starter code
    starterCode: {
      python: {
        type: String,
        default: ""
      },
      javascript: {
        type: String,
        default: ""
      },
      cpp: {
        type: String,
        default: ""
      },
      java: {
        type: String,
        default: ""
      }
    },

    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true
    },

    generatedBy: {
      type: String,
      enum: ["ai", "admin"],
      default: "ai"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Problem", ProblemSchema);
