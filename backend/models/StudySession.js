import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
});

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Optional - for future auth integration
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    files: [fileSchema],
    combinedText: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: "",
    },
    flashcards: {
      type: Array,
      default: [],
    },
    quiz: {
      type: Array,
      default: [],
    },
    chatHistory: [chatMessageSchema],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for efficient querying
studySessionSchema.index({ userId: 1, createdAt: -1 });
studySessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }); // Auto-delete after 24 hours (optional)

const StudySession = mongoose.model("StudySession", studySessionSchema);

export default StudySession;
