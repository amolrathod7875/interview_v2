import axios from "axios"
import { useEffect, useState, useCallback, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import LoadingWave from "./ui/LoadingWave"
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, AlertTriangle, Flag, ChevronLeft, ChevronRight } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

const Quiz = () => {
    const { state } = useLocation()
    const quizId = state?.quizId
    const timeInMinutes = state?.timeInMinutes || 10
    const totalQuestions = state?.noOfQuestions || 10
    const navigate = useNavigate()

    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    const [flaggedQuestions, setFlaggedQuestions] = useState({})
    const [error, setError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const questionRefs = useRef({})
    
    const [timeRemaining, setTimeRemaining] = useState(timeInMinutes * 60)
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

    const toggleFlag = (qIndex) => {
        setFlaggedQuestions(prev => ({
            ...prev,
            [qIndex]: !prev[qIndex]
        }))
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return
            
            // Number keys 1-9 for quick answer selection on current question
            if (e.key >= '1' && e.key <= '9') {
                const optionIndex = parseInt(e.key) - 1
                if (questions[currentQuestion]?.options && optionIndex < questions[currentQuestion].options.length) {
                    handleChange(currentQuestion, questions[currentQuestion].options[optionIndex])
                }
            }
            
            // Arrow keys for navigation
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault()
                if (currentQuestion > 0) {
                    setCurrentQuestion(prev => prev - 1)
                    scrollToQuestion(currentQuestion - 1)
                }
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault()
                if (currentQuestion < questions.length - 1) {
                    setCurrentQuestion(prev => prev + 1)
                    scrollToQuestion(currentQuestion + 1)
                }
            }
            
            // F key to flag current question
            if (e.key === 'f' || e.key === 'F') {
                toggleFlag(currentQuestion)
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentQuestion, questions])

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
        setCurrentQuestion(index)
        const element = questionRefs.current[`question-${index}`]
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
                    <div className="flex justify-between items-start">
                        <div>
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
                        
                        {/* Timer & Question Count - Top Right */}
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Questions</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {Object.keys(answers).length}/{questions.length}
                                </p>
                            </div>
                            <div className={`border-2 rounded-xl px-4 py-2 ${getTimerBgColor()}`}>
                                <div className="flex items-center gap-2">
                                    <Clock className={`h-5 w-5 ${getTimerColor()}`} />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Time Left</p>
                                        <p className={`text-xl font-bold font-mono ${getTimerColor()}`}>
                                            {formatTime(timeRemaining)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Container */}
                <div className="flex flex-col lg:flex-row items-start gap-8">
                    
                    {/* Left: Questions Column */}
                    <div className="w-full lg:flex-1 space-y-6">
                        {questions.map((q, qIndex) => (
                            <div
                                ref={el => questionRefs.current[`question-${qIndex}`] = el}
                                key={q._id}
                                id={`question-${qIndex}`}
                                className={`bg-white border-2 rounded-2xl p-6 shadow-sm scroll-mt-24 transition-all ${
                                    currentQuestion === qIndex ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex gap-4 mb-6">
                                    <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                                        {qIndex + 1}
                                    </div>
                                    <p className="text-lg text-gray-900 font-semibold flex-1">
                                        {q.text.replace(/```/g, "")}
                                    </p>
                                    <button
                                        onClick={() => toggleFlag(qIndex)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            flaggedQuestions[qIndex] 
                                                ? 'bg-amber-100 text-amber-600' 
                                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                        }`}
                                        title={flaggedQuestions[qIndex] ? 'Unflag question (F)' : 'Flag for review (F)'}
                                    >
                                        <Flag className="h-5 w-5" />
                                    </button>
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

                    {/* Right: Sticky Sidebar (Navigator) */}
                    <aside className="w-full lg:w-[350px] lg:sticky lg:top-8 space-y-4">

                        {/* Navigator Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase">Navigator</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { if (currentQuestion > 0) { scrollToQuestion(currentQuestion - 1); setCurrentQuestion(currentQuestion - 1) }}}
                                        disabled={currentQuestion === 0}
                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 rounded text-blue-600">
                                        {currentQuestion + 1}/{questions.length}
                                    </span>
                                    <button
                                        onClick={() => { if (currentQuestion < questions.length - 1) { scrollToQuestion(currentQuestion + 1); setCurrentQuestion(currentQuestion + 1) }}}
                                        disabled={currentQuestion === questions.length - 1}
                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2 mb-6">
                                {questions.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => scrollToQuestion(i)}
                                        onMouseEnter={() => setCurrentQuestion(i)}
                                        className={`h-12 rounded-lg text-sm font-bold transition-all border relative
                                            ${answers[i]
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "bg-white border-gray-200 text-gray-400 hover:border-blue-400"
                                            }
                                            ${currentQuestion === i ? 'ring-2 ring-blue-300' : ''}
                                            ${flaggedQuestions[i] ? 'ring-2 ring-amber-300' : ''}
                                        `}
                                        title={`Question ${i + 1}${flaggedQuestions[i] ? ' (Flagged)' : ''}`}
                                    >
                                        {i + 1}
                                        {flaggedQuestions[i] && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 mb-6 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-blue-600 rounded" />
                                    <span className="text-gray-500">Answered</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-white border-2 border-gray-200 rounded" />
                                    <span className="text-gray-500">Unanswered</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                                    <span className="text-gray-500">Flagged</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{Math.round(progressPercentage)}% Complete</span>
                                    <span className="text-gray-500">{questions.length - Object.keys(answers).length} remaining</span>
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