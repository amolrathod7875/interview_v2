import { useEffect, useRef, useState } from "react"
import Vapi from "@vapi-ai/web"
import { Button } from "./ui/button"
import axios from "axios"
import { useLocation, useNavigate } from 'react-router-dom'
import { PhoneOff, Mic, ArrowLeft, Zap } from "lucide-react"
import { Spinner } from "./ui/spinner"
import { motion } from "framer-motion"
import LoadingWave from "./ui/LoadingWave"

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


    const navigate = useNavigate()
    const interviewId = state?.interviewId

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

                if (looksLikeQuestion && currentAnswer.trim()) {
                    setAnswers(prev => [...prev, currentAnswer.trim()])
                    setCurrentAnswer("")
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
            parsedQuestionsRef.current = questions.map(q => (q.text))
        }
    }, [questions])  //uncomment to start interview

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

Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below are the questions which you need to ask one by one to the candidate:
Questions: ${parsedQuestionsRef.current}  

If the candidate struggles, offer hints or rephrase the question without giving away the direct answer. Example:
"Need a hint? Think about how React tracks component updates!"

Provide brief 1-2 lined (30-40 worded), encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"

Keep the conversation natural and engaging — use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"

After 8-9 questions, wrap up the interview smoothly by summarizing their performance. Example:
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
            console.log(e.message)
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
        <div className="h-screen w-screen bg-[#f8fafc] flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        AI Interview Session
                    </h1>
                </div>

                <div className="text-sm text-gray-600">
                    Topic: <span className="font-medium">{interview.topic}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-2 gap-6 p-8">

                {/* AI */}
                <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <div
                        className={`h-24 w-24 rounded-full flex items-center justify-center text-xl font-semibold
          ${aiSpeaking ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                    >
                        AI
                    </div>

                    <p className="text-gray-600 text-sm">
                        {aiSpeaking ? "AI is speaking" : "AI is listening"}
                    </p>
                </div>

                {/* User */}
                <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <div
                        className={`h-24 w-24 rounded-full flex items-center justify-center text-xl font-semibold
          ${userSpeaking ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
                    >
                        {localStorage.getItem("name")?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <p className="text-gray-600 text-sm">
                        {userSpeaking ? "You are speaking" : "You are listening"}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 pb-8">
                <button
                    onClick={hangUpInterview}
                    className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition"
                >
                    <PhoneOff className="h-6 w-6" />
                </button>

                <p className="text-gray-500 text-sm">
                    Interview in progress
                </p>
            </div>

        </div>
    )

}
