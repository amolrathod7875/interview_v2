import mongoose from "mongoose";
import { normalizeText, computeDescriptionFingerprint } from "../services/problemDedup.service.js";

const CoreProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  description: { type: String, required: true },
  normalizedDescription: { type: String, default: "" },
  descriptionFingerprint: { type: String, default: "" },
  input: { type: String, default: "" },
  output: { type: String, default: "" },
  examples: { type: String, default: "" },
  constraints: { type: String, default: "" },
  starterCode: {
    python: { type: String, default: "" },
    javascript: { type: String, default: "" },
    cpp: { type: String, default: "" },
    java: { type: String, default: "" }
  },
  testCases: [{
    input: { type: String, required: true },      // Hidden from user
    expectedOutput: { type: String, required: true }, // Hidden from user
    isHidden: { type: Boolean, default: true }
  }],
  createdBy: { type: String, default: "admin" },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

const applyDedupFields = (target = {}) => {
  const description = String(target.description || "");
  target.normalizedDescription = normalizeText(description).slice(0, 300);
  target.descriptionFingerprint = computeDescriptionFingerprint(description);
};

CoreProblemSchema.pre("validate", function coreProblemPreValidate(next) {
  applyDedupFields(this);
  next();
});

CoreProblemSchema.pre("findOneAndUpdate", function coreProblemPreFindOneAndUpdate(next) {
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

CoreProblemSchema.index(
  { descriptionFingerprint: 1 },
  {
    unique: true,
    partialFilterExpression: { descriptionFingerprint: { $type: "string", $ne: "" } }
  }
);
CoreProblemSchema.index({ normalizedDescription: 1 });

export default mongoose.model("CoreProblem", CoreProblemSchema);
