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
import codexCodeRoutes from './routes/codexCodeRoutes.js';
import codexAiRoutes from './routes/codexAiRoutes.js';

dotenv.config()
const app = express()

app.use(express.json())

// --- CRITICAL UPDATE: CORS CONFIGURATION ---
app.use(cors({
  origin: [
    'http://localhost:5173',                // Allow your local laptop (Vite)
    'https://interview-v2.vercel.app',      // Allow your deployed frontend (Vercel)
    process.env.FRONTEND_URL                // Allow an extra URL if you add it to .env
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}))
// -------------------------------------------

// Routes
app.use('/questions', questionRoute)
app.use('/interview', interviewRoute);
app.use('/answers', answerRoute);
app.use('/results', resultRoute);
app.use('/user', userRoute);
app.use('/resume', uploadRoute)
app.use('/quiz', quizRoute)
app.use('/roadmap', roadmapRoute);
app.use('/buildResume', buildRoutes);
app.use('/codex/code', codexCodeRoutes); 
app.use('/codex/ai', codexAiRoutes);    

// Health Check Route (Important for Render)
app.get('/', (req, resp) => {
    resp.json({ status: "Active", message: "Backend is running successfully!" });
})

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("database connected"))
.catch(err => console.log("DB Connection Error:", err))

// Start Server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Running on ${PORT}`))