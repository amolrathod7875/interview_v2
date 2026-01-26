import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

import Starter from './components/starter'
import Login from './components/login'
import Signup from './components/signup'
import AiInterview from './components/aiInterview'
import AfterLoginLayout from './components/afterLoginLayout'
import ProtectedRoute from './components/ProjectedRoute'
import PostInterview from './components/postInterview'
import Quiz from './components/quiz'
import AnalyseResume from './components/analyseResume'
import QuizResult from './components/quizResult'
import ClassicATS from "./components/ui/ClassicATS";
import SingleColumnATS from "./components/ui/SingleColumnATS";
import AcademicSingleColumnATS from "./components/ui/AcademicSingleColumnATS";
import BuildResume from './components/BuildResume'

// ✅ NEW: CodeX
import Codex from './components/Codex'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Starter />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />

        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <AfterLoginLayout />
            </ProtectedRoute>
          }
        />

        <Route path='/ai-interview' element={<AiInterview />} />
        <Route path='/postinterview' element={<PostInterview />} />
        <Route path='/quiz' element={<Quiz />} />
        <Route path='/analyseResume' element={<AnalyseResume />} />
        <Route path='/quizResult' element={<QuizResult />} />
        <Route path='/temp' element={<ClassicATS />} />
        <Route path='/temp1' element={<SingleColumnATS />} />
        <Route path='/temp2' element={<AcademicSingleColumnATS />} />
        <Route path='/buildresume' element={<BuildResume />} />

        {/* ✅ NEW: CodeX Route */}
        <Route
          path='/codex'
          element={
            <ProtectedRoute>
              <Codex />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
