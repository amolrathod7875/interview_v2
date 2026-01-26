import { useLocation, useNavigate } from "react-router-dom"
import ScoreCircle from "./ui/scoreCircle"
import { Button } from "./ui/button"

const QuizResult = () => {
  const { state } = useLocation()
  const score = Number(state?.score ?? 0)
  const noOfQuestions = Number(state?.noOfQuestions ?? 0)
  const navigate = useNavigate()

  const percentage =
    noOfQuestions > 0 ? Math.round((score / noOfQuestions) * 100) : 0

  return (
    <div className="h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Quiz Result
          </h1>
          <p className="text-gray-500 text-sm">
            Here’s how you performed
          </p>
        </div>

        {/* Score */}
        <div className="flex justify-center">
          <ScoreCircle score={score} total={noOfQuestions} size={160} />
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <p className="text-lg font-semibold text-gray-900">
            {score} / {noOfQuestions} correct
          </p>
          <p className="text-sm text-gray-500">
            Accuracy: <span className="font-medium">{percentage}%</span>
          </p>
        </div>

        {/* Feedback */}
        <div className="text-sm text-gray-600">
          {percentage >= 80 && "Excellent work! You really know your stuff 👏"}
          {percentage >= 50 && percentage < 80 && "Good job! A little more practice will make it perfect 👍"}
          {percentage < 50 && "Keep practicing — you’ll improve fast 🚀"}
        </div>

        {/* Actions */}
        <div className="pt-4 flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>

      </div>
    </div>
  )
}

export default QuizResult
