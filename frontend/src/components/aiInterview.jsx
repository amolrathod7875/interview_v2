import { useEffect, useRef, useState } from "react"
import Vapi from "@vapi-ai/web"
import { Button } from "./ui/button"
import axios from "axios"
import { useLocation, useNavigate } from 'react-router-dom'
import { PhoneOff, Mic, ArrowLeft, Zap } from "lucide-react"
import { Spinner } from "./ui/spinner"
import { motion } from "framer-motion"
import LoadingWave from "./ui/LoadingWave"
import AIAvatarSphere from "./AIAvatarSphere"

const messages = [
    "Generating Results...",
    "Evaluating...",
    "Almost done..."
]
const API = import.meta.env.VITE_API_BASE_URL
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY)

export default function AiInterview() {
    const [isCompleted, setIsCompleted] = useState(false)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState([])
    const [isActive, setIsActive] = useState(false)
    const { state } = useLocation()
    const [currentAnswer, setCurrentAnswer] = useState("")
    const [interview, setInterview] = useState({})
    const [aiSpeaking, setAiSpeaking] = useState(false)
    const [userSpeaking, setUserSpeaking] = useState(false)
    const [msgIndex, setMsgIndex] = useState(0)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)
    const [timeLeft, setTimeLeft] = useState(0)
    const [noOfQuestions, setNoOfQuestions] = useState(5)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)


    const navigate = useNavigate()
    const interviewId = state?.interviewId

    // Initialize timer and question config
    useEffect(() => {
        if (state?.timeInMinutes) {
            setTimeLeft(state.timeInMinutes * 60) // Convert to seconds
        }
        if (state?.noOfQuestions) {
            setNoOfQuestions(state.noOfQuestions)
        }
    }, [state])

    // Timer countdown
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    hangUpInterview() // Auto end when time is up
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isActive, timeLeft])

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Fetch user profile for avatar
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const firebaseId = localStorage.getItem("userUid")
                const res = await axios.get(`${API}/user/me`, {
                    params: { firebaseId },
                })
                setUser(res.data.data)
            } catch (err) {
                console.error("Failed to fetch user:", err)
            }
        }
        fetchUser()
    }, [])

    useEffect(() => {
        if (!isCompleted) return
        if (msgIndex >= messages.length - 1) return

        const timer = setTimeout(() => {
            setMsgIndex(i => i + 1)
        }, 3000)

        return () => clearTimeout(timer)
    }, [isCompleted, msgIndex])

    useEffect(() => {
        console.log("AI speaking:", aiSpeaking, "User speaking:", userSpeaking)
    }, [aiSpeaking, userSpeaking])

    const hangUpInterview = async () => {
        try {
            setIsCompleted(true)
            setIsActive(false)
            if (currentAnswer.trim()) {
                setAnswers(prev => [...prev, currentAnswer.trim()])
                setCurrentAnswer("")
            }
            const finalAnswers = currentAnswer.trim()
                ? [...answers, currentAnswer.trim()]
                : answers

            await vapi.stop()
            const updateResp = await axios.put(`${API}/interview/update/${interviewId}`)
            console.log("update: ", updateResp)
            const answerResp = await axios.post(`${API}/answers/add`, { interviewId: interviewId, answers: finalAnswers })
                .then(res => navigate('/postinterview', { state: { interviewId: interviewId } }))
                .catch(r => navigate('/dashboard'))
        }
        catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        const handler = (msg) => {
            if (
                msg.type === "transcript" &&
                msg.transcriptType === "final" &&
                msg.role === "user"
            ) {
                console.log(msg.transcript)
                setCurrentAnswer(prev => prev + " " + msg.transcript)
            }

            if (msg.type === "transcript" && msg.role === "user") {
                setUserSpeaking(true)
                setTimeout(() => setUserSpeaking(false), 500)
            }

            if (
                msg.type === "transcript" &&
                msg.transcriptType === "final" &&
                msg.role === "assistant"
            ) {
                const text = msg.transcript?.trim() || ""

                const looksLikeQuestion =
                    text.endsWith("?") ||
                    text.toLowerCase().startsWith("describe") ||
                    text.toLowerCase().startsWith("explain") ||
                    text.toLowerCase().startsWith("how") ||
                    text.toLowerCase().startsWith("what") ||
                    text.toLowerCase().startsWith("when") ||
                    text.toLowerCase().startsWith("why")

                if (looksLikeQuestion) {
                    // Save previous answer if exists
                    if (currentAnswer.trim()) {
                        setAnswers(prev => [...prev, currentAnswer.trim()])
                        setCurrentAnswer("")
                    }
                    // Increment question counter immediately when new question is asked
                    setCurrentQuestionIndex(prev => prev + 1)
                }
            }
        }

        const onSpeechStart = () => {
            setAiSpeaking(true)
            setLoading(false) 
        }

        const onSpeechEnd = () => {
            setAiSpeaking(false)
        }

        vapi.on("message", handler)
        vapi.on("speech-start", onSpeechStart)
        vapi.on("speech-end", onSpeechEnd)

        return () => {
            vapi.off("message", handler)
            vapi.off("speech-start", onSpeechStart)
            vapi.off("speech-end", onSpeechEnd)
        }
    }, [])

    const parsedQuestionsRef = useRef([])

    useEffect(() => {
        if (questions.length) {
            // Limit to exact number of questions specified by user
            parsedQuestionsRef.current = questions.slice(0, noOfQuestions).map(q => (q.text))
        }
    }, [questions, noOfQuestions])  //uncomment to start interview

    useEffect(() => {
        const func = async () => {
            await axios.get(`${API}/questions/${interviewId}`).then(res => {
                setQuestions(res.data.data)
                console.log(res)
            }).catch(e => console.error(e))
        }
        func()
    }, [])

    useEffect(() => {
        async function func() {
            const resp = await axios.get(`${API}/interview/getById/${interviewId}`)
            setInterview(resp.data.data)
        }
        func()
    }, [])

    const startInterview = async () => {
        setLoading(true)
        const assistantOptions = {
            name: "AI Recruiter",
            firstMessage: `Hi ${localStorage.getItem("user") || 'John Doe'}, how are you? Ready for your interview on ${interview.topic || 'for your selected topic'}?`,

            transcriber: {
                provider: "deepgram",
                model: "nova-2",
                language: "en-US",
            },

            voice: {
                provider: "11labs",
                voiceId: "burt",
            },

            model: {
                provider: "openai",
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.

🚨 CRITICAL RULE: Ask EXACTLY ${noOfQuestions} questions. NOT ${noOfQuestions + 1}, NOT ${noOfQuestions - 1}. EXACTLY ${noOfQuestions}. Count each question you ask and STOP at ${noOfQuestions}.

You have EXACTLY ${noOfQuestions} questions available. DO NOT create new questions. ONLY use the provided questions below.

Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below are the ONLY questions you must ask:
Questions: ${parsedQuestionsRef.current}  

If the candidate struggles, offer hints or rephrase the question without giving away the direct answer. Example:
"Need a hint? Think about how React tracks component updates!"

Provide brief 1-2 lined (30-40 worded), encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"

Keep the conversation natural and engaging — use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"

After EXACTLY ${noOfQuestions} questions (count them: 1, 2, 3... up to ${noOfQuestions}), IMMEDIATELY wrap up the interview. Do NOT ask any more questions after reaching ${noOfQuestions}. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"

After ending with questions, provide feedback based upon user's answers, communication skills, and completeness of answers also, rate user's overall performance out of 100 and let user know that.

End on a positive note:
"Thankyou so much for appearing for this mock interview, hope you loved this.

Key Guidelines:
• Be friendly, engaging, and witty
• Keep responses short and natural, like a real conversation
• Adapt based on the candidate's confidence level
• Take questions from interview from provided questions only
• Dont invent your own questions (most imp guideline) again, never ever invent your own questions just choose random question from list of questions provided. location for questions is "Questions: ${parsedQuestionsRef.current}" this.

`,
                    },
                ],
            },
        }
        try {
            await vapi.start(assistantOptions)
            setIsActive(true)
        } catch (e) {
            console.error("Failed to start VAPI:", e)
            setLoading(false)
            alert("Failed to start voice interview. Please check your VAPI configuration or try again.")
        }
    }

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
                <LoadingWave />
                <p className="text-gray-600 text-sm">
                    {messages[msgIndex]}
                </p>
            </div>
        )
    }

    if(loading){
         return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
                <LoadingWave />
            </div>
        )   
    }

    if (!isActive) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
                <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center max-w-md w-full">
                    <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-100 mx-auto mb-6">
                        <Mic className="h-7 w-7 text-blue-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        AI Interview Session
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Interview Topic:{" "}
                        <span className="font-medium text-gray-900">
                            {interview.topic}
                        </span>
                    </p>

                    <Button
                        onClick={startInterview}
                        className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white py-3 text-base"
                    >
                        Start Interview
                    </Button>

                    <p className="text-gray-500 text-sm mt-4">
                        Click the button above to begin your interview session.
                    </p>
                </div>
            </div>
        )
    }


    return (
        <div className="fixed inset-0 h-screen w-screen bg-white flex flex-col font-['Inter',sans-serif] overflow-hidden">

            {/* Header - Professional Clean Design */}
            <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#1A2B4B] to-[#007BFF] flex items-center justify-center shadow-md">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-xl font-semibold text-[#1A2B4B] tracking-tight">
                        AI Interview Session
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Question Progress */}
                    <div className="px-4 py-2 bg-[#007BFF]/10 text-[#1A2B4B] text-sm font-medium rounded-lg">
                        Question: {currentQuestionIndex}/{noOfQuestions}
                    </div>

                    {/* Timer */}
                    <div className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        timeLeft < 60 ? 'bg-red-100 text-red-700' : 
                        timeLeft < 180 ? 'bg-orange-100 text-orange-700' : 
                        'bg-gray-100 text-gray-700'
                    }`}>
                        Time: {formatTime(timeLeft)}
                    </div>

                    {/* Topic Badge */}
                    <div className="px-4 py-2 bg-[#007BFF] text-white text-sm font-medium rounded-full shadow-sm">
                        Topic: {interview.topic}
                    </div>
                </div>
            </div>

            {/* Main Content - Clean Professional Layout */}
            <div className="flex-1 grid grid-cols-2 gap-4 p-4 bg-[#F8F9FA] overflow-hidden">

                {/* AI Agent Card - Professional White Design */}
                <div className="bg-white rounded-2xl flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-lg border border-gray-100">
                    
                    {/* Subtle Blue Accent Background */}
                    <div className="absolute inset-0">
                        {aiSpeaking && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-[#007BFF]/5 to-transparent"
                                animate={{
                                    opacity: [0.3, 0.5, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        )}
                    </div>


                    


                    {/* AI Avatar Sphere */}
                    <div className="relative z-10 h-[350px] w-[350px]">
                        <AIAvatarSphere status={aiSpeaking ? 'active' : 'idle'} type="ai" />
                    </div>

                    {/* Voice Waveform Visualizer - Professional Blue */}
                    {aiSpeaking && (
                        <div className="flex gap-2 items-center h-16 relative z-10">
                            {[...Array(9)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 rounded-full shadow-sm"
                                    style={{
                                        background: `linear-gradient(to top, #007BFF, #1A2B4B)`,
                                    }}
                                    animate={{
                                        height: ["20px", "64px", "32px", "64px", "20px"],
                                        opacity: [0.5, 1, 0.7, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.12,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Status Text - Professional */}
                    <motion.div
                        className="relative z-10 text-center"
                        animate={{
                            opacity: [1, 0.8, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: aiSpeaking ? Infinity : 0,
                        }}
                    >
                        <p className="text-lg font-semibold text-[#1A2B4B] mb-2">
                            {aiSpeaking ? "AI is Speaking" : "AI is Listening"}
                        </p>
                        {aiSpeaking && (
                            <motion.div
                                className="flex gap-1.5 justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2.5 h-2.5 rounded-full bg-[#007BFF]"
                                        animate={{
                                            scale: [1, 1.8, 1],
                                            opacity: [0.4, 1, 0.4],
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* User Card - Professional White Design */}
                <div className="bg-white rounded-2xl flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-lg border border-gray-100">
                    
                    {/* Subtle Blue Accent Background */}
                    <div className="absolute inset-0">
                        {userSpeaking && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-[#007BFF]/5 to-transparent"
                                animate={{
                                    opacity: [0.3, 0.5, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        )}
                    </div>


                    


                    {/* User Avatar Sphere */}
                    <div className="relative z-10 h-[350px] w-[350px]">
                        <AIAvatarSphere status={userSpeaking ? 'active' : 'idle'} type="user" />
                    </div>

                    {/* Voice Waveform Visualizer - Professional Blue */}
                    {userSpeaking && (
                        <div className="flex gap-2 items-center h-16 relative z-10">
                            {[...Array(9)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 rounded-full shadow-sm"
                                    style={{
                                        background: `linear-gradient(to top, #007BFF, #1A2B4B)`,
                                    }}
                                    animate={{
                                        height: ["20px", "64px", "32px", "64px", "20px"],
                                        opacity: [0.5, 1, 0.7, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.12,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Status Text - Professional */}
                    <motion.div
                        className="relative z-10 text-center"
                        animate={{
                            opacity: [1, 0.8, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: userSpeaking ? Infinity : 0,
                        }}
                    >
                        <p className="text-lg font-semibold text-[#1A2B4B] mb-2">
                            {userSpeaking ? "You are Speaking" : "You are Listening"}
                        </p>
                        {userSpeaking && (
                            <motion.div
                                className="flex gap-1.5 justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2.5 h-2.5 rounded-full bg-[#007BFF]"
                                        animate={{
                                            scale: [1, 1.8, 1],
                                            opacity: [0.4, 1, 0.4],
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Live Transcript Section */}
            <div className="px-4 pb-2 flex-shrink-0">
                <div className="bg-gradient-to-r from-[#007BFF]/5 to-[#1A2B4B]/5 rounded-xl p-4 max-h-32 overflow-y-auto border border-[#007BFF]/10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#007BFF] animate-pulse" />
                        <p className="text-xs font-semibold text-[#1A2B4B] uppercase tracking-wide">Live Transcript</p>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                        {currentAnswer || "Waiting for conversation..."}
                    </div>
                </div>
            </div>

            {/* Professional Footer Controls */}
            <div className="flex flex-col items-center gap-2 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                <button
                    onClick={hangUpInterview}
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    <PhoneOff className="h-7 w-7" />
                </button>

                <p className="text-gray-500 text-sm font-medium">
                    Interview in progress...
                </p>
            </div>

        </div>
    )

}
