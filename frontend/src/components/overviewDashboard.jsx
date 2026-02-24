import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreCircle from './ui/scoreCircle'
import { Button } from './ui/button'
import LoadingWave from './ui/LoadingWave'

// Job Analytics
import JobAnalytics from './jobTracker/JobAnalytics'

// GitHub Analysis Card
import GithubAnalysisCard from './dashboard/GithubAnalysisCard'

// GitHub Icon
import { FaGithub } from 'react-icons/fa'

const API = import.meta.env.VITE_API_BASE_URL

const OverviewDashboard = () => {
  const [data, setData] = useState([])
  const [quiz, setQuiz] = useState([])
  const [score, setScore] = useState(0)
  const [loading, setIsLoading] = useState(true)

  // NEW: user profile
  const [user, setUser] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const firebaseId = localStorage.getItem('userUid')

        // 1️⃣ interviews + quiz
        const interviewResp = await axios.get(
          `${API}/interview/getInterviewsForDashboard/${firebaseId}`
        )

        const result = Array.isArray(interviewResp.data.data)
          ? interviewResp.data.data
          : Object.values(interviewResp.data.data)

        setData(result)
        setScore(Math.round(interviewResp.data.avgScore))
        setQuiz(interviewResp.data.quizResp)

        // 2️⃣ user profile (GitHub status)
        const userResp = await axios.get(`${API}/user/me`, {
          params: { firebaseId },
        })

        setUser(userResp.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const getQuizResult = async (quizId, noOfQuestions) => {
    try {
      const resp = await axios.get(`${API}/quiz/results/${quizId}`)
      navigate('/quizResult', {
        state: { score: resp.data.score, noOfQuestions },
      })
    } catch (e) {
      console.log(e.message)
    }
  }

  const connectGithub = () => {
    window.location.href = `${API}/auth/github`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingWave />
      </div>
    )
  }

  const github = user?.github

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-9">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-2">
            Dashboard
          </h1>
          <p className="text-gray-500 text-lg">
            Track your progress and performance across interviews, quizzes, and job applications
          </p>
        </div>

        {/* GITHUB ANALYSIS CARD */}
        <GithubAnalysisCard />

        {/* JOB ANALYTICS */}
        <JobAnalytics />

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center flex-col text-center">
                <h3 className="text-xl font-semibold text-black mb-1">
                  Interview Readiness Score
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Overall performance evaluation
                </p>

                {data.length === 0 ? (
                  <p className="text-gray-400 font-medium">
                    Attempt at least one interview to view score
                  </p>
                ) : (
                  <ScoreCircle score={score} />
                )}
              </div>
            </div>

            <div
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm cursor-pointer"
              onClick={() => navigate('/analyseResume')}
            >
              <h3 className="text-xl font-semibold text-black mb-2">
                Analyse Your Resume
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Get AI-powered feedback to improve your chances of getting hired
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Resume Analysis
              </Button>
            </div>
          </div>

          {/* COMPLETED INTERVIEWS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-xl font-semibold text-black mb-1">
              Completed Interviews
            </h3>

            <div className="space-y-3 overflow-y-auto">
              {data.filter(d => d.isCompleted).length > 0 ? (
                data.filter(d => d.isCompleted).map(item => (
                  <div
                    key={item._id}
                    onClick={() =>
                      navigate('/postInterview', {
                        state: { interviewId: item._id },
                      })
                    }
                    className="flex gap-4 p-4 border rounded-xl hover:bg-blue-50 cursor-pointer"
                  >
                    <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold">
                      {item.topic?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.topic}</p>
                      <p className="text-xs text-gray-500">
                        Skills: {item.skills.join(', ')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center mt-8">
                  No completed interviews yet
                </p>
              )}
            </div>
          </div>

          {/* COMPLETED QUIZZES */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-xl font-semibold text-black mb-1">
              Completed Quizzes
            </h3>

            <div className="space-y-3 overflow-y-auto">
              {quiz.filter(q => q.isCompleted).length > 0 ? (
                quiz.filter(q => q.isCompleted).map(item => (
                  <div
                    key={item._id}
                    onClick={() => getQuizResult(item._id, item.noOfQuestions)}
                    className="flex gap-4 p-4 border rounded-xl hover:bg-indigo-50 cursor-pointer"
                  >
                    <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-semibold">
                      {item.topic?.[0]?.toUpperCase() || 'Q'}
                    </div>
                    <div>
                      <p className="font-semibold">{item.topic}</p>
                      <p className="text-xs text-gray-500">
                        Questions: {item.noOfQuestions}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center mt-8">
                  No completed quizzes yet
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default OverviewDashboard
