import axios from "axios"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import LoadingWave from "./ui/LoadingWave"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

const Quiz = () => {
    const { state } = useLocation()
    const quizId = state?.quizId
    const navigate = useNavigate()

    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    const [error, setError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!quizId) return

        const loadQuestions = async () => {
            try {
                const resp = await axios.get(
                    `${API}/quiz/questions/getAll/${quizId}`
                )

                if (!resp.data?.data?.length) {
                    setError(true)
                    return
                }

                setQuestions(resp.data.data)
            } catch (e) {
                setError(true)
            } finally {
                setIsLoading(false)
            }
        }

        loadQuestions()
    }, [quizId])

    const handleChange = (qIndex, option) => {
        setAnswers(prev => ({ ...prev, [qIndex]: option }))
    }

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const payload = {
                answers: questions.map((q, index) => ({
                    questionId: q._id,
                    quizId,
                    answer: answers[index] || ""
                }))
            }

            const res = await axios.post(
                `${API}/quiz/answers/add`,
                payload
            )

            await axios.put(`${API}/quiz/update/${quizId}`)
            setIsLoading(false)
            navigate("/quizResult", {
                state: {
                    score: res.data.score,
                    noOfQuestions: questions.length
                }
            })
        } catch (e) {
            console.log(e.message);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
                <LoadingWave />
                <p className="text-gray-600 text-sm">
                    Loading quiz questions...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center max-w-md w-full">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 mb-6">
                        Unable to generate quiz questions. Please try again.
                    </p>
                    <Button
                        onClick={() => navigate("/dashboard")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    const progressPercentage =
        (Object.keys(answers).length / questions.length) * 100

    return (
        <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

                {/* Main Content */}
                <div className="flex-1 space-y-6">

                    {/* Header */}
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                            Quiz
                        </h1>
                        <p className="text-gray-500">
                            Answer all questions to submit the quiz
                        </p>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        {questions.map((q, qIndex) => (
                            <div
                                key={q._id}
                                className="bg-white border border-gray-200 rounded-2xl p-6"
                            >
                                <div className="flex gap-3 mb-4">
                                    <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold">
                                        {qIndex + 1}
                                    </div>
                                    <p className="text-gray-900 font-medium">
                                        {q.text.replace(/```/g, "")}
                                    </p>
                                </div>

                                <div className="space-y-3 ml-11">
                                    {q.options.map((option, oIndex) => (
                                        <label
                                            key={oIndex}
                                            className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition
                        ${answers[qIndex] === option
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${qIndex}`}
                                                checked={answers[qIndex] === option}
                                                onChange={() =>
                                                    handleChange(qIndex, option)
                                                }
                                                className="accent-blue-600 mt-1"
                                            />
                                            <span className="text-sm text-gray-700 flex-1">
                                                {option}
                                            </span>
                                            {answers[qIndex] === option && (
                                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit */}
                    <Button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                        Submit Quiz
                    </Button>
                </div>

                {/* Progress Sidebar */}
                <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-2xl p-6 h-fit sticky top-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Progress
                    </h3>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Answered</span>
                            <span className="font-medium">
                                {Object.keys(answers).length} / {questions.length}
                            </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-blue-600 transition-all"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, i) => (
                            <div
                                key={i}
                                className={`h-10 flex items-center justify-center rounded-lg text-sm font-medium
                  ${answers[i]
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Quiz
