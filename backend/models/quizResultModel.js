import mongoose from "mongoose"

const quizResultSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
    unique: true
  },

  score: {
    type: Number,
    required: true,
  },
}, { timestamps: true })

export const quizResultModel = mongoose.model("quiz_results", quizResultSchema)
