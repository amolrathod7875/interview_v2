import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// -------------------- ROUTES --------------------
import studyRoutes from "./routes/studyRoutes.js";
import uploadRoute from "./routes/uploadRoute.js";
import questionRoute from "./routes/questionRoute.js";
import answerRoute from "./routes/answerRoutes.js";
import interviewRoute from "./routes/interviewRoutes.js";
import resultRoute from "./routes/resultRoutes.js";
import quizRoute from "./routes/quizRoute.js";
import userRoute from "./routes/userRoute.js";
import roadmapRoute from "./routes/roadmapRoute.js";
import buildRoutes from "./routes/buildRoutes.js";
import codexCodeRoutes from "./routes/codexCodeRoutes.js";
import codexAiRoutes from "./routes/codexAiRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";

// 🔥 GitHub
import githubAuthRoutes from "./routes/githubAuth.routes.js";
import githubApiRoutes from "./routes/githubApi.routes.js";
import githubAiRoutes from "./routes/githubAiRoutes.js";
// ------------------------------------------------

dotenv.config();
const app = express();

/* ================= MIDDLEWARE ================= */

// ⚠️ IMPORTANT
// ❌ DO NOT parse multipart here
// ✅ JSON only for non-file routes
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://interview-v2.vercel.app",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  })
);

// 🔍 DEBUG incoming requests (keep for now)
app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

/* ================= ROUTES ================= */

// ✅ FILE UPLOAD ROUTE — MUST COME FIRST
app.use("/api/study", studyRoutes);

// Core routes
app.use("/questions", questionRoute);
app.use("/interview", interviewRoute);
app.use("/answers", answerRoute);
app.use("/results", resultRoute);
app.use("/user", userRoute);

app.use("/resume", uploadRoute);
app.use("/quiz", quizRoute);
app.use("/roadmap", roadmapRoute);
app.use("/buildResume", buildRoutes);
app.use("/codex/code", codexCodeRoutes);
app.use("/codex/ai", codexAiRoutes);
app.use("/api/jobs", jobRoutes);

// GitHub
app.use("/auth", githubAuthRoutes);
app.use("/api/github", githubApiRoutes);
app.use("/api/ai/github", githubAiRoutes);

/* ================= HEALTH ================= */

app.get("/", (_req, res) => {
  res.json({
    status: "Active",
    message: "Backend is running successfully 🚀",
  });
});

/* ================= GLOBAL ERROR HANDLER ================= */
/**
 * 🔥 THIS IS THE KEY FIX
 * Multer + Express errors will ALWAYS return JSON now
 */
app.use((err, _req, res, _next) => {
  console.error("❌ GLOBAL ERROR:", err);

  // Multer file errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ================= DATABASE ================= */

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
