import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

// Import Routes (existing)
import uploadRoute from './routes/uploadRoute.js'
import questionRoute from './routes/questionRoute.js'
import answerRoute from './routes/answerRoutes.js'
import interviewRoute from './routes/interviewRoutes.js'
import resultRoute from './routes/resultRoutes.js'
import quizRoute from './routes/quizRoute.js'
import userRoute from './routes/userRoute.js'
import roadmapRoute from './routes/roadmapRoute.js'
import buildRoutes from './routes/buildRoutes.js'
import codexCodeRoutes from './routes/codexCodeRoutes.js'
import codexAiRoutes from './routes/codexAiRoutes.js'

// ✅ NEW: Kanban Job Routes
import jobRoutes from './routes/jobRoutes.js'

dotenv.config()
const app = express()

app.use(express.json())

// --- CORS CONFIGURATION (UNCHANGED & SAFE) ---
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://interview-v2.vercel.app',
    process.env.FRONTEND_URL
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}))
// -------------------------------------------

// Existing Routes
app.use('/questions', questionRoute)
app.use('/interview', interviewRoute)
app.use('/answers', answerRoute)
app.use('/results', resultRoute)
app.use('/user', userRoute)
app.use('/resume', uploadRoute)
app.use('/quiz', quizRoute)
app.use('/roadmap', roadmapRoute)
app.use('/buildResume', buildRoutes)
app.use('/codex/code', codexCodeRoutes)
app.use('/codex/ai', codexAiRoutes)

// ✅ NEW: Kanban Job Tracker API
app.use('/api/jobs', jobRoutes)

// Health Check (Render-safe)
app.get('/', (req, resp) => {
  resp.json({
    status: "Active",
    message: "Backend is running successfully 🚀"
  })
})

// --- DATABASE CONNECTION (SAFE MODE) ---
if (process.env.USE_DB === 'true') {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.log("❌ DB Connection Error:", err))
} else {
  console.log("⚠️ MongoDB disabled — using local storage for jobs")
}
// ---------------------------------------

// Start Server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`))
