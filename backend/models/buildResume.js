import mongoose from 'mongoose'

const buildResumeSchema = new mongoose.Schema({
  userId: { type: String, required: true },

  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  extractedText: {type: String, required: true},
  score: { type: Number, required: true},
  improvements: {type: [String], required: true},
  feedback: { type: String, default: ''},

  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('buildResume', buildResumeSchema)
