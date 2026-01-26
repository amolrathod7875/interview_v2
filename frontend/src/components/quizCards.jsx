import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import LoadingWave from "./ui/LoadingWave"

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
      <div className="flex flex-col items-center justify-center h-full bg-[#f8fafc] gap-4">
        <LoadingWave />
        <p className="text-gray-600 text-sm">Loading quizzes...</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-100 px-4 md:px-6 py-9 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Incomplete Quizzes
          </h1>
          <p className="text-gray-500">
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
                className="bg-white border border-gray-200 rounded-xl p-5
                shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-11 w-11 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold text-base">
                    {item.topic?.charAt(0).toUpperCase() || "Q"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate capitalize">
                      {item.topic}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.noOfQuestions} Questions
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="text-sm text-gray-600 mb-6">
                  Estimated Time:{" "}
                  <span className="font-medium text-gray-900">
                    ~{Math.ceil(item.noOfQuestions * 1.5)} min
                  </span>
                </div>

                {/* Action */}
                <button
                  className="mt-auto w-full py-2 rounded-lg
                  bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
                >
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500 text-base mb-6 text-center">
              No quizzes available yet.
            </p>
            <button
              onClick={() => navigate("/quiz-form")}
              className="px-6 py-2.5 rounded-lg
              bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Create New Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizCards
