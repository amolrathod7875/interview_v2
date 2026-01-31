import axios from "axios"
import { useEffect, useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import LoadingWave from "./ui/LoadingWave"
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, AlertTriangle } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

const Quiz = () => {
    const { state } = useLocation()
    const quizId = state?.quizId
    const navigate = useNavigate()

    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    const [error, setError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    
    const [timeRemaining, setTimeRemaining] = useState(600)
    const [timerExpired, setTimerExpired] = useState(false)

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

    useEffect(() => {
        if (isLoading || error || timerExpired) return

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setTimerExpired(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isLoading, error, timerExpired])

    useEffect(() => {
        if (timerExpired) {
            handleSubmit(true)
        }
    }, [timerExpired])

    const handleChange = (qIndex, option) => {
        setAnswers(prev => ({ ...prev, [qIndex]: option }))
    }

    const handleSubmit = useCallback(async (autoSubmit = false) => {
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
                    noOfQuestions: questions.length,
                    autoSubmitted: autoSubmit
                }
            })
        } catch (e) {
            console.log(e.message);
            setIsLoading(false)
        }
    }, [questions, answers, quizId, navigate])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getTimerColor = () => {
        if (timeRemaining <= 60) return 'text-red-600'
        if (timeRemaining <= 180) return 'text-orange-600'
        return 'text-gray-700'
    }

    const getTimerBgColor = () => {
        if (timeRemaining <= 60) return 'bg-red-50 border-red-200'
        if (timeRemaining <= 180) return 'bg-orange-50 border-orange-200'
        return 'bg-blue-50 border-blue-200'
    }

    const scrollToQuestion = (index) => {
        const element = document.getElementById(`question-${index}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

    const progressPercentage = (Object.keys(answers).length / questions.length) * 100

    return (
        <div className="min-h-screen bg-[#f8fafc] w-full py-8">
            <div className="max-w-[1440px] mx-auto px-4 md:px-10">
                
                {/* Header Section */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-4 font-semibold"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Quiz</h1>
                    <p className="text-gray-500 text-sm">Answer all questions to submit</p>
                </div>

                {/* Grid Container */}
                <div className="flex flex-col lg:flex-row items-start gap-8">
                    
                    {/* Left: Questions Column */}
                    <div className="w-full lg:flex-1 space-y-6">
                        {questions.map((q, qIndex) => (
                            <div
                                key={q._id}
                                id={`question-${qIndex}`}
                                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm scroll-mt-24"
                            >
                                <div className="flex gap-4 mb-6">
                                    <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                                        {qIndex + 1}
                                    </div>
                                    <p className="text-lg text-gray-900 font-semibold">
                                        {q.text.replace(/```/g, "")}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {q.options.map((option, oIndex) => (
                                        <label
                                            key={oIndex}
                                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all
                                                ${answers[qIndex] === option
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-100 hover:bg-gray-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${qIndex}`}
                                                checked={answers[qIndex] === option}
                                                onChange={() => handleChange(qIndex, option)}
                                                className="mt-1 w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-gray-700 font-medium">
                                                {option}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Sticky Sidebar (Timer & Navigator) */}
                    <aside className="w-full lg:w-[350px] lg:sticky lg:top-8 space-y-4">
                        
                        {/* Timer Card */}
                        <div className={`border-2 rounded-2xl p-6 shadow-sm ${getTimerBgColor()}`}>
                            <div className="flex items-center gap-3">
                                <Clock className={`h-6 w-6 ${getTimerColor()}`} />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Remaining</p>
                                    <p className={`text-3xl font-black font-mono leading-none ${getTimerColor()}`}>
                                        {formatTime(timeRemaining)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigator Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase">Navigator</h3>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600">
                                    {Object.keys(answers).length}/{questions.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-5 gap-2 mb-8">
                                {questions.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => scrollToQuestion(i)}
                                        className={`h-10 rounded-lg text-sm font-bold transition-all border
                                            ${answers[i]
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "bg-white border-gray-200 text-gray-400 hover:border-blue-400"
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <Button
                                    onClick={() => handleSubmit(false)}
                                    disabled={Object.keys(answers).length === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-lg font-bold shadow-lg"
                                >
                                    Finish Quiz
                                </Button>
                            </div>
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    )
}

export default Quiz