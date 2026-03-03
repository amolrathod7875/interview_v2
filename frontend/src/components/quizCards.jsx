import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen } from "lucide-react"
import EmptyState from "./ui/EmptyState"
import Skeleton from "./ui/Skeleton"

const API = import.meta.env.VITE_API_BASE_URL

const QuizCards = () => {
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(
          `${API}/quiz/findByIsCompleted/${localStorage.getItem("userUid")}`
        )
        setQuiz(res.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [])

  if (loading) {
    return (
      <div className="h-full bg-gray-100 px-4 md:px-6 py-9 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-9 w-72" />
            <Skeleton className="mx-auto h-4 w-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="mb-6 h-3.5 w-2/5" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-slate-50 px-4 md:px-6 py-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Incomplete Quizzes
          </h1>
          <p className="text-slate-500">
            Continue quizzes to test and improve your knowledge
          </p>
        </div>
        {/* Quiz Cards */}
        {quiz.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quiz.map(item => (
              <div
                key={item._id}
                onClick={() =>
                  navigate("/quiz", { state: { quizId: item._id } })
                }
                className="bg-white border border-slate-200 rounded-xl p-5
                shadow-card hover:shadow-card-hover transition-shadow cursor-pointer flex flex-col"
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-11 w-11 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold text-base">
                    {item.topic?.charAt(0).toUpperCase() || "Q"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 truncate capitalize">
                      {item.topic}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {item.noOfQuestions} Questions
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="text-sm text-slate-600 mb-6">
                  Estimated Time:{" "}
                  <span className="font-medium text-slate-900">
                    ~{Math.ceil(item.noOfQuestions * 1.5)} min
                  </span>
                </div>

                {/* Action */}
                <button
                  className="mt-auto w-full py-2 rounded-lg
                  bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
                >
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No quizzes available yet"
            description="Generate your first quiz to start tracking progress and improve your interview readiness."
            actionLabel="Create New Quiz"
            onAction={() => navigate("/quiz-form")}
          />
        )}
      </div>
    </div>
  )
}

export default QuizCards
