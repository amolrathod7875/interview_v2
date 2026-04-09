import React, { useState, useEffect } from "react"
import axios from "axios"
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

const QuizModal = ({ item, topic, onClose, onComplete }) => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [passThreshold, setPassThreshold] = useState(60)
  const [questionCount, setQuestionCount] = useState(5)

  const normalizeAnswerIndex = value => {
    if (typeof value === "number" && Number.isInteger(value)) {
      if (value >= 0 && value <= 3) return value
      if (value >= 1 && value <= 4) return value - 1
      return null
    }

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (/^\d+$/.test(trimmed)) {
        const parsed = Number.parseInt(trimmed, 10)
        if (parsed >= 0 && parsed <= 3) return parsed
        if (parsed >= 1 && parsed <= 4) return parsed - 1
      }
      return null
    }

    return null
  }

  const computeLocalQuizResult = (quizQuestions, answers, threshold) => {
    if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
      return { scorePercent: 0, passed: false }
    }

    let correctCount = 0

    quizQuestions.forEach((question, idx) => {
      const correctRaw = question?.correctAnswer
      const selectedRaw = answers?.[idx] ?? answers?.[String(idx)]
      const normalizedCorrect = normalizeAnswerIndex(correctRaw)
      const normalizedSelected = normalizeAnswerIndex(selectedRaw)

      if (
        normalizedCorrect !== null &&
        normalizedSelected !== null &&
        normalizedCorrect === normalizedSelected
      ) {
        correctCount += 1
      }
    })

    const scorePercent = Math.round((correctCount / quizQuestions.length) * 100)
    const passed = scorePercent >= threshold

    return { scorePercent, passed }
  }

  // Fetch quiz on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.post(`${API}/roadmap/generate-quiz`, {
          topic,
          subTopic: item.key
        })
        
        if (res.data.success) {
          setQuestions(res.data.data.questions || [])
          setPassThreshold(res.data.data.passThreshold ?? 60)
          setQuestionCount(res.data.data.questionCount ?? (res.data.data.questions || []).length)
        } else {
          throw new Error(res.data.message || "Failed to generate quiz")
        }
      } catch (err) {
        console.error("Quiz fetch error:", err)
        setError(err.response?.data?.message || err.message || "Failed to generate quiz")
      } finally {
        setLoading(false)
      }
    }

    if (item?.key && topic) {
      fetchQuiz()
    }
  }, [item?.key, topic])

  // Handle option selection
  const handleSelectOption = (questionIndex, optionIndex) => {
    if (submitted) return
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }))
  }

  // Calculate and submit score
  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert("Please answer all questions before submitting")
      return
    }

    setSubmitting(true)
    
    try {
      const res = await axios.post(`${API}/roadmap/submit-quiz`, {
        roadmapId: item.roadmapId,
        level: item.level,
        itemId: item._id,
        questions,
        selectedAnswers
      })

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to submit quiz")
      }

      const scorePercent = res.data.data.score ?? 0
      const passed = !!res.data.data.passed
      const nextPassThreshold = res.data.data.passThreshold ?? passThreshold

      setScore(scorePercent)
      setPassThreshold(nextPassThreshold)
      setSubmitted(true)

      if (passed && onComplete) {
        onComplete({
          _id: item._id,
          level: item.level,
          completed: true,
          quizScore: scorePercent
        })
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn("submit-quiz endpoint missing, using fallback")

        const { scorePercent, passed } = computeLocalQuizResult(
          questions,
          selectedAnswers,
          passThreshold
        )

        setScore(scorePercent)
        setSubmitted(true)

        if (passed) {
          try {
            const patchRes = await axios.patch(`${API}/roadmap/update-item`, {
              roadmapId: item.roadmapId,
              level: item.level,
              itemId: item._id,
              completed: true,
              quizScore: scorePercent
            })

            if (!patchRes.data?.success) {
              throw new Error(patchRes.data?.message || "Failed to update roadmap item")
            }

            if (onComplete) {
              onComplete({
                _id: item._id,
                level: item.level,
                ...(patchRes.data?.data || {}),
                completed: true,
                quizScore: scorePercent
              })
            }
          } catch (patchErr) {
            alert(
              patchErr.response?.data?.message ||
              patchErr.message ||
              "Failed to update roadmap item"
            )
          }
        }

        return
      }

      console.error("Submit error:", err)
      alert("Failed to submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle retry
  const handleRetry = () => {
    setSelectedAnswers({})
    setSubmitted(false)
    setScore(0)
    // Re-fetch quiz
    const fetchQuiz = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.post(`${API}/roadmap/generate-quiz`, {
          topic,
          subTopic: item.key
        })
        
        if (res.data.success) {
          setQuestions(res.data.data.questions || [])
          setPassThreshold(res.data.data.passThreshold ?? 60)
          setQuestionCount(res.data.data.questionCount ?? (res.data.data.questions || []).length)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }

  // Render loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Generating Quiz
          </h3>
          <p className="text-muted-foreground">
            Creating questions for "{item?.key}"...
          </p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Error
          </h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-white dark:bg-card border border-gray-300 dark:border-orange-500/40 text-black dark:text-orange-400 rounded-lg hover:bg-gray-100 dark:hover:bg-orange-500/10 transition"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render submitted state with results
  if (submitted) {
    const passed = score >= passThreshold
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          {passed ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {passed ? "Congratulations!" : "Keep Learning!"}
          </h3>
          
          <p className="text-4xl font-bold mb-4" style={{ color: passed ? "#22c55e" : "#ef4444" }}>
            {score}%
          </p>
          
          <p className="text-muted-foreground mb-6">
            {passed 
              ? "You've passed! This item has been marked as complete." 
              : `You need ${passThreshold}% to pass. Don't give up - try again!`
            }
          </p>
          
          <div className="flex gap-3 justify-center">
            {!passed && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-white dark:bg-card border border-gray-300 dark:border-orange-500/40 text-black dark:text-orange-400 rounded-lg hover:bg-gray-100 dark:hover:bg-orange-500/10 transition"
              >
                Try Again
              </button>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition ${
                passed 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {passed ? "Continue" : "Close"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render quiz questions
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Quiz: {item?.key}
            </h3>
            <p className="text-sm text-muted-foreground">
              Topic: {topic} • {questionCount} questions • Pass: {passThreshold}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="space-y-3">
              <p className="font-medium text-foreground">
                {qIdx + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oIdx) => {
                  const isSelected = selectedAnswers[qIdx] === oIdx
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(qIdx, oIdx)}
                      disabled={submitted}
                      className={`
                        w-full text-left p-3 rounded-lg border transition
                        ${isSelected 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border text-foreground hover:border-primary/30 hover:bg-muted"
                        }
                      `}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {Object.keys(selectedAnswers).length} / {questions.length} answered
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-white dark:bg-card border border-gray-300 dark:border-orange-500/40 text-black dark:text-orange-400 rounded-lg hover:bg-gray-100 dark:hover:bg-orange-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizModal
