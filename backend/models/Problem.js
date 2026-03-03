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

    //  NEW: LeetCode-style starter code
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

    questionNumber: {
      type: Number,
      min: 1,
      default: null
    },

    isPublished: {
      type: Boolean,
      default: true
    },

    lastServedAt: {
      type: Date,
      default: null
    },

    generatedBy: {
      type: String,
      enum: ["ai", "admin"],
      default: "ai"
    }
  },
  { timestamps: true }
);

ProblemSchema.index(
  { topic: 1, difficulty: 1, questionNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { questionNumber: { $type: "number" } }
  }
);

ProblemSchema.index({ topic: 1, difficulty: 1, isPublished: 1, questionNumber: 1 });

export default mongoose.model("Problem", ProblemSchema);
