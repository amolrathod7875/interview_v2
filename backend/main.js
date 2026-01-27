import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

// Import Routes
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
import jobRoutes from './routes/jobRoutes.js'

dotenv.config()
const app = express()

// -------------------- MIDDLEWARE --------------------
app.use(express.json())

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://interview-v2.vercel.app',
    process.env.FRONTEND_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
// ---------------------------------------------------

// -------------------- ROUTES ------------------------
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
app.use('/api/jobs', jobRoutes)
// ---------------------------------------------------

// -------------------- HEALTH CHECK ------------------
app.get('/', (req, res) => {
  res.json({
    status: 'Active',
    message: 'Backend is running successfully 🚀'
  })
})

// DB Health (VERY IMPORTANT for debugging)
app.get('/health/db', async (req, res) => {
  try {
    const state = mongoose.connection.readyState
    res.json({
      mongoState: state === 1 ? 'connected' : 'not connected'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// ---------------------------------------------------

// -------------------- DATABASE ----------------------
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI missing in .env')
  process.exit(1)
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })

mongoose.connection.on('error', err => {
  console.error('❌ Mongo runtime error:', err)
})
// ---------------------------------------------------

// -------------------- SERVER ------------------------
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`)
})
// ---------------------------------------------------
