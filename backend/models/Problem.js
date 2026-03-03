import mongoose from "mongoose";
import { normalizeText, computeDescriptionFingerprint } from "../services/problemDedup.service.js";

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

    normalizedDescription: {
      type: String,
      default: ""
    },

    descriptionFingerprint: {
      type: String,
      default: ""
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

const applyDedupFields = (target = {}) => {
  const description = String(target.description || "");
  target.normalizedDescription = normalizeText(description).slice(0, 300);
  target.descriptionFingerprint = computeDescriptionFingerprint(description);
};

ProblemSchema.pre("validate", function problemPreValidate(next) {
  applyDedupFields(this);
  next();
});

ProblemSchema.pre("findOneAndUpdate", function problemPreFindOneAndUpdate(next) {
  const update = this.getUpdate() || {};
  const directDescription = update.description;
  const setDescription = update.$set?.description;
  const description = directDescription ?? setDescription;

  if (description !== undefined) {
    if (!update.$set) update.$set = {};
    update.$set.normalizedDescription = normalizeText(String(description)).slice(0, 300);
    update.$set.descriptionFingerprint = computeDescriptionFingerprint(String(description));
  }

  this.setUpdate(update);
  next();
});

ProblemSchema.index(
  { topic: 1, difficulty: 1, questionNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { questionNumber: { $type: "number" } }
  }
);

ProblemSchema.index({ topic: 1, difficulty: 1, isPublished: 1, questionNumber: 1 });
ProblemSchema.index(
  { descriptionFingerprint: 1 },
  {
    unique: true,
    partialFilterExpression: { descriptionFingerprint: { $type: "string", $ne: "" } }
  }
);
ProblemSchema.index({ normalizedDescription: 1 });

export default mongoose.model("Problem", ProblemSchema);
