import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

// Public pages
import Starter from "./components/starter";
import Login from "./components/login";
import Signup from "./components/signup";

// Core layout & auth
import AfterLoginLayout from "./components/afterLoginLayout";
import ProtectedRoute from "./components/ProjectedRoute";

// Features
import AiInterview from "./components/aiInterview";
import PostInterview from "./components/postInterview";
import Quiz from "./components/quiz";
import AnalyseResume from "./components/analyseResume";
import QuizResult from "./components/quizResult";
import BuildResume from "./components/BuildResume";

// Resume templates
import ClassicATS from "./components/ui/ClassicATS";
import SingleColumnATS from "./components/ui/SingleColumnATS";
import AcademicSingleColumnATS from "./components/ui/AcademicSingleColumnATS";

// CodeX
import Codex from "./components/Codex";

// Job Tracker
import JobBoard from "./components/jobTracker/Board";

// GitHub
import GithubRepos from "./pages/GithubRepos";
import GithubAnalysis from "./pages/GithubAnalysis"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Starter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AfterLoginLayout />
            </ProtectedRoute>
          }
        />

        {/* ================= FEATURES ================= */}
        <Route path="/ai-interview" element={<AiInterview />} />
        <Route path="/postinterview" element={<PostInterview />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/analyseResume" element={<AnalyseResume />} />
        <Route path="/quizResult" element={<QuizResult />} />
        <Route path="/buildresume" element={<BuildResume />} />

        {/* ================= RESUME TEMPLATES ================= */}
        <Route path="/temp" element={<ClassicATS />} />
        <Route path="/temp1" element={<SingleColumnATS />} />
        <Route path="/temp2" element={<AcademicSingleColumnATS />} />

        {/* ================= GITHUB ================= */}
        <Route
          path="/github-repos"
          element={
            <ProtectedRoute>
              <GithubRepos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/github-analysis"
          element={
            <ProtectedRoute>
              <GithubAnalysis />
            </ProtectedRoute>
          }
        />
        {/* ================= CODEX ================= */}
        <Route
          path="/codex"
          element={
            <ProtectedRoute>
              <Codex />
            </ProtectedRoute>
          }
        />

        {/* ================= JOB TRACKER ================= */}
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobBoard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
