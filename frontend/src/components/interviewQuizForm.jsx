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
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <LoadingWave />
        <p className="text-muted-foreground text-sm">
          {messages[msgIndex]}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Quiz Generator
          </h1>
          <p className="text-muted-foreground">
            Create an AI-generated quiz based on your selected topic
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="space-y-6">

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Quiz Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Java, Python, Data Structures"
                className="w-full bg-background text-foreground px-4 py-3 rounded-lg border border-border
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                required
              />
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                value={noOfQuestions}
                onChange={(e) => setNoOfQuestions(e.target.value)}
                min="1"
                max="50"
                className="w-full bg-background text-foreground px-4 py-3 rounded-lg border border-border
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Choose between 1 and 50 questions
              </p>
            </div>

            {/* Time Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Time Duration (minutes)
              </label>
              <input
                type="number"
                value={timeInMinutes}
                onChange={(e) => setTimeInMinutes(e.target.value)}
                min="1"
                max="120"
                className="w-full bg-background text-foreground px-4 py-3 rounded-lg border border-border
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Choose between 1 and 120 minutes
              </p>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!topic || isSubmitting}
                className="w-full bg-primary hover:brightness-90 text-primary-foreground py-3 text-base"
              >
                Start Quiz
              </Button>
            </div>

          </div>

          {/* Info */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Questions are generated dynamically based on the topic you provide.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default InterviewQuizForm
