import mongoose from "mongoose";

const CoreProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  description: { type: String, required: true },
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

export default mongoose.model("CoreProblem", CoreProblemSchema);
