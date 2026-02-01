import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import LoadingWave from "./ui/LoadingWave"

const API = import.meta.env.VITE_API_BASE_URL

const messages = [
  "Analyzing quiz parameters...",
  "Generating quiz questions...",
  "Preparing quiz..."
]

const InterviewQuizForm = () => {
  const [topic, setTopic] = useState("")
  const [noOfQuestions, setNoOfQuestions] = useState(10)
  const [timeInMinutes, setTimeInMinutes] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)

  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const resp = await axios.post(`${API}/quiz/add`, {
        topic,
        noOfQuestions,
        userId: localStorage.getItem("userUid")
      })

      if (resp.data.success) {
        navigate("/quiz", { 
          state: { 
            quizId: resp.data.data._id,
            timeInMinutes: parseInt(timeInMinutes),
            noOfQuestions: parseInt(noOfQuestions)
          } 
        })
      }
    } catch (e) {
      console.error(e)
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isSubmitting) return
    if (msgIndex >= messages.length - 1) return

    const timer = setTimeout(() => {
      setMsgIndex(i => i + 1)
    }, 2500)

    return () => clearTimeout(timer)
  }, [isSubmitting, msgIndex])

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
        <LoadingWave />
        <p className="text-gray-600 text-sm">
          {messages[msgIndex]}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Quiz Generator
          </h1>
          <p className="text-gray-500">
            Create an AI-generated quiz based on your selected topic
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="space-y-6">

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Java, Python, Data Structures"
                className="w-full px-4 py-3 rounded-lg border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                value={noOfQuestions}
                onChange={(e) => setNoOfQuestions(e.target.value)}
                min="1"
                max="50"
                className="w-full px-4 py-3 rounded-lg border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose between 1 and 50 questions
              </p>
            </div>

            {/* Time Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Duration (minutes)
              </label>
              <input
                type="number"
                value={timeInMinutes}
                onChange={(e) => setTimeInMinutes(e.target.value)}
                min="1"
                max="120"
                className="w-full px-4 py-3 rounded-lg border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose between 1 and 120 minutes
              </p>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!topic || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base"
              >
                Start Quiz
              </Button>
            </div>

          </div>

          {/* Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions are generated dynamically based on the topic you provide.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default InterviewQuizForm
