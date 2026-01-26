import mongoose from "mongoose"

const resultSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Interview",
    required: true,
    unique: true
  },

  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  improvements: {
    type: [String],
    default: []
  },

  overallAssessment: {
    type: String,
    required: true
  },

}, { timestamps: true })

export default mongoose.model("Result", resultSchema)
