import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreCircle from './ui/scoreCircle'
import { Button } from './ui/button'
import LoadingWave from './ui/LoadingWave'

// Skill tag colors based on technology
const skillColors = {
  // Frontend
  react: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  vue: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  angular: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  javascript: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  typescript: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  css: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  html: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  // Backend
  node: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'node.js': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  python: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  java: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  spring: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  // Database
  sql: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  mongodb: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  postgresql: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  mysql: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  // Cloud/DevOps
  aws: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  docker: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  kubernetes: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  // Data Science
  'machine learning': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  ml: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  tensorflow: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  pytorch: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  // Default
  default: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
}

// Get color for a skill
const getSkillColor = (skill) => {
  const normalizedSkill = skill.toLowerCase().trim()
  return skillColors[normalizedSkill] || skillColors.default
}

// Get relative time
const getRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  return past.toLocaleDateString()
}

// Topic colors
const topicColors = {
  react: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'bg-blue-500' },
  javascript: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'bg-yellow-500' },
  python: { bg: 'bg-green-100', text: 'text-green-700', icon: 'bg-green-500' },
  java: { bg: 'bg-red-100', text: 'text-red-700', icon: 'bg-red-500' },
  node: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'bg-emerald-500' },
  'node.js': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'bg-emerald-500' },
  typescript: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'bg-indigo-500' },
  angular: { bg: 'bg-red-100', text: 'text-red-700', icon: 'bg-red-500' },
  vue: { bg: 'bg-teal-100', text: 'text-teal-700', icon: 'bg-teal-500' },
  css: { bg: 'bg-pink-100', text: 'text-pink-700', icon: 'bg-pink-500' },
  html: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'bg-orange-500' },
  sql: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'bg-purple-500' },
  mongodb: { bg: 'bg-green-100', text: 'text-green-700', icon: 'bg-green-500' },
  default: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'bg-slate-500' }
}

const getTopicColor = (topic) => {
  if (!topic) return topicColors.default
  const normalizedTopic = topic.toLowerCase().trim()
  return topicColors[normalizedTopic] || topicColors.default
}

// GitHub Analysis Card
import GithubAnalysisCard from './dashboard/GithubAnalysisCard'
import JobAnalytics from './jobTracker/JobAnalytics'

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

  // State for Show More/Less functionality
  const [showAllInterviews, setShowAllInterviews] = useState(false)
  const [showAllQuizzes, setShowAllQuizzes] = useState(false)

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
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Dashboard
          </h1>
          <p className="text-slate-500 text-base">
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
              <div className="flex items-center flex-col text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Interview Readiness Score
                </h3>
                <p className="text-sm text-slate-500 mb-5">
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
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow"
              onClick={() => navigate('/analyseResume')}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Analyse Your Resume
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                Get AI-powered feedback to improve your chances of getting hired
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Start Resume Analysis
              </Button>
            </div>
          </div>

          {/* COMPLETED INTERVIEWS */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Completed Interviews
            </h3>

            <div className="space-y-3 overflow-y-auto">
              {data.filter(d => d.isCompleted).length > 0 ? (
                (() => {
                  const completedInterviews = data.filter(d => d.isCompleted)
                  const displayedInterviews = showAllInterviews 
                    ? completedInterviews 
                    : completedInterviews.slice(0, 5)
                  return (
                    <>
                      {displayedInterviews.map(item => (
                        <div
                          key={item._id}
                          onClick={() =>
                            navigate('/postInterview', {
                              state: { interviewId: item._id },
                            })
                          }
                          className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors hover:shadow-sm"
                        >
                          <div className={`h-12 w-12 flex items-center justify-center rounded-lg ${getTopicColor(item.topic).bg} ${getTopicColor(item.topic).text} font-semibold`}>
                            <span className="text-lg">{item.topic?.[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate group-hover:text-blue-700 transition-colors">{item.topic}</p>
                              {item.score !== undefined && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  item.score >= 80 ? 'bg-green-100 text-green-700' :
                                  item.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {item.score}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {item.skills.slice(0, 3).map((skill, idx) => {
                                const color = getSkillColor(skill)
                                return (
                                  <span
                                    key={idx}
                                    className={`px-2 py-0.5 text-xs rounded-md ${color.bg} ${color.text} border ${color.border}`}
                                  >
                                    {skill}
                                  </span>
                                )
                              })}
                            </div>
                            {item.completedAt && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {getRelativeTime(item.completedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {completedInterviews.length > 5 && (
                        <button
                          onClick={() => setShowAllInterviews(!showAllInterviews)}
                          className="w-full mt-2 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {showAllInterviews ? 'Show Less' : `Show More (${completedInterviews.length - 5} more)`}
                        </button>
                      )}
                    </>
                  )
                })()
              ) : (
                <p className="text-gray-400 text-center mt-8">
                  No completed interviews yet
                </p>
              )}
            </div>
          </div>

          {/* COMPLETED QUIZZES */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Completed Quizzes
            </h3>

            <div className="space-y-3 overflow-y-auto">
              {quiz.filter(q => q.isCompleted).length > 0 ? (
                (() => {
                  const completedQuizzes = quiz.filter(q => q.isCompleted)
                  const displayedQuizzes = showAllQuizzes 
                    ? completedQuizzes 
                    : completedQuizzes.slice(0, 5)
                  return (
                    <>
                      {(displayedQuizzes.map(item => {
                        const topicColor = getTopicColor(item.topic)
                        return (
                        <div
                          key={item._id}
                          onClick={() => getQuizResult(item._id, item.noOfQuestions)}
                          className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors hover:shadow-sm"
                        >
                          <div className={`h-12 w-12 flex items-center justify-center rounded-lg ${topicColor.bg} ${topicColor.text} font-semibold`}>
                            <span className="text-lg">{item.topic?.[0]?.toUpperCase() || 'Q'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold group-hover:text-indigo-700 transition-colors">{item.topic}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-500">
                                {item.noOfQuestions} Questions
                              </p>
                              {item.score !== undefined && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  item.score >= 80 ? 'bg-green-100 text-green-700' :
                                  item.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {item.score}%
                                </span>
                              )}
                            </div>
                            {item.completedAt && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {getRelativeTime(item.completedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}))}
                      {completedQuizzes.length > 5 && (
                        <button
                          onClick={() => setShowAllQuizzes(!showAllQuizzes)}
                          className="w-full mt-2 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {showAllQuizzes ? 'Show Less' : `Show More (${completedQuizzes.length - 5} more)`}
                        </button>
                      )}
                    </>
                  )
                })()
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
