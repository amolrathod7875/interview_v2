import express from 'express'
import mongoose from 'mongoose'
import uploadRoute from './routes/uploadRoute.js'
import questionRoute from './routes/questionRoute.js'
import answerRoute from './routes/answerRoutes.js'
import cors from 'cors'
import dotenv from 'dotenv'
// import { authenticate } from "./middleware/auth.js"
import interviewRoute from './routes/interviewRoutes.js'
import resultRoute from './routes/resultRoutes.js'
import quizRoute from './routes/quizRoute.js'
import userRoute from './routes/userRoute.js'
import roadmapRoute from './routes/roadmapRoute.js'
import buildRoutes from './routes/buildRoutes.js'

dotenv.config()
const app = express()

app.use(express.json())
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}))

app.use('/questions', questionRoute)
app.use('/interview', interviewRoute);
app.use('/answers', answerRoute);
app.use('/results', resultRoute);
app.use('/user', userRoute);
app.use('/resume', uploadRoute)
app.use('/quiz', quizRoute)
app.use('/roadmap', roadmapRoute);
app.use('/buildResume', buildRoutes);
app.get('/', (req, resp) => {
    resp.json("hello world");
})


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("database connected"))
.catch(err => console.log(err))


const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Running on ${PORT}`))
