import { useEffect, useState } from "react"
import axios from "axios"
import { TabStore } from "@/store/tabStore"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import LoadingWave from "./ui/LoadingWave"

const API = import.meta.env.VITE_API_BASE_URL

const messages = [
  "Analyzing input...",
  "Generating questions...",
  "Preparing interview session..."
]

const AiInterviewForm = () => {
  const [interviewTopic, setInterviewTopic] = useState("")
  const [experience, setExperience] = useState("")
  const [skills, setSkills] = useState("")
  const [noOfQuestions, setNoOfQuestions] = useState(5)
  const [timeInMinutes, setTimeInMinutes] = useState(15)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [submitError, setSubmitError] = useState("")

  const setTrigger = TabStore(state => state.setTrigger)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) return
    if (msgIndex >= messages.length - 1) return

    const timer = setTimeout(() => {
      setMsgIndex(i => i + 1)
    }, 2500)

    return () => clearTimeout(timer)
  }, [loading, msgIndex])

  const parsedExperience = Number(experience)
  const skillsList = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)

  const isFormValid =
    interviewTopic.trim().length > 0 &&
    Number.isFinite(parsedExperience) &&
    parsedExperience > 0 &&
    skillsList.length > 0 &&
    noOfQuestions >= 3 &&
    noOfQuestions <= 15 &&
    timeInMinutes >= 5 &&
    timeInMinutes <= 60

  const handleSubmit = async () => {
    if (isSubmitting) return
    setSubmitError("")

    if (!isFormValid) {
      setSubmitError("Please fill all fields with valid values before starting the interview.")
      return
    }

    setIsSubmitting(true)
    setLoading(true)

    try {
      const resp = await axios.post(`${API}/interview/add`, {
        userId: localStorage.getItem("userUid"),
        topic: interviewTopic.trim(),
        experience: String(parsedExperience),
        skills: skillsList,
        noOfQuestions,
        timeInMinutes
      })

      const interviewId = resp?.data?.data?._id
      if (!resp?.data?.success || !interviewId) {
        throw new Error(resp?.data?.message || "Failed to create interview session.")
      }

      setTrigger()
      navigate("/ai-interview", {
        state: {
          interviewId,
          noOfQuestions,
          timeInMinutes
        }
      })
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to start interview. Please try again."
      setSubmitError(message)
      console.error("Failed to create interview:", error)
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 bg-background">
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

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Interview
          </h1>
          <p className="text-muted-foreground">
            Generate personalized interview questions based on your profile
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-card">
          <div className="space-y-6">
            {submitError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {submitError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Interview Topic / Role
              </label>
              <input
                type="text"
                value={interviewTopic}
                onChange={(e) => setInterviewTopic(e.target.value)}
                placeholder="Frontend Developer, Data Scientist"
                className="w-full bg-background text-foreground px-4 py-2.5 rounded-lg border border-border
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Experience (years)
              </label>
              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="1 - 20"
                className="w-full bg-background text-foreground px-4 py-2.5 rounded-lg border border-border
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Primary Skills
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, SQL"
                className="w-full bg-background text-foreground px-4 py-2.5 rounded-lg border border-border
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value={noOfQuestions}
                  onChange={(e) => setNoOfQuestions(Number(e.target.value))}
                  min="3"
                  max="15"
                  placeholder="5"
                  className="w-full bg-background text-foreground px-4 py-2.5 rounded-lg border border-border
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Time Duration (minutes)
                </label>
                <input
                  type="number"
                  value={timeInMinutes}
                  onChange={(e) => setTimeInMinutes(Number(e.target.value))}
                  min="5"
                  max="60"
                  placeholder="15"
                  className="w-full bg-background text-foreground px-4 py-2.5 rounded-lg border border-border
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid}
                className="w-full bg-primary hover:brightness-90 text-primary-foreground py-2.5 text-base shadow-sm"
              >
                Start Interview
              </Button>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              This information is used to generate relevant interview questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiInterviewForm
