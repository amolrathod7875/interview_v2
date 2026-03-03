import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "./ui/button"
import axios from "axios"
import { useLocation, useNavigate } from 'react-router-dom'
import { PhoneOff, Mic, ArrowLeft, Zap } from "lucide-react"
import { Spinner } from "./ui/spinner"
import LoadingWave from "./ui/LoadingWave"
import BeyondPresenceAvatar from "./BeyondPresenceAvatar"
import BodyLanguageMonitor from "./BodyLanguageMonitor"
import InterviewAvatarControls from "./InterviewAvatarControls"

const messages = [
    "Generating Results...",
    "Evaluating...",
    "Almost done..."
]
const RAW_API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "")

export default function AiInterview() {
    const [isCompleted, setIsCompleted] = useState(false)
    const [questions, setQuestions] = useState([])
    const [isActive, setIsActive] = useState(false)
    const { state } = useLocation()
    const [interview, setInterview] = useState({})
    const [aiSpeaking, setAiSpeaking] = useState(false)
    const [userSpeaking, setUserSpeaking] = useState(false)
    const [msgIndex, setMsgIndex] = useState(0)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)
    const [timeLeft, setTimeLeft] = useState(() => (state?.timeInMinutes ?? 0) * 60)
    const [noOfQuestions] = useState(() => state?.noOfQuestions ?? 5)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    // Avatar state
    const [avatarEnabled, setAvatarEnabled] = useState(true)
    const [expression, setExpression] = useState('neutral')
    const [showCaptions, setShowCaptions] = useState(false)
    const [bpSession, setBpSession] = useState(null)
    const bpSessionRef = useRef(null)

    // Transcript state — collected from LiveKit Data Channel via BeyondPresenceAvatar callbacks
    const [transcriptHistory, setTranscriptHistory] = useState([])
    const [currentTranscript, setCurrentTranscript] = useState('')


    const navigate = useNavigate()
    const interviewId = state?.interviewId

    // Stable ref to hangUpInterview so the timer effect never goes stale
    const hangUpRef = useRef(null)

    // Timer countdown
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    hangUpRef.current?.() // Auto end when time is up
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

            // Merge any in-progress transcript into history
            const finalAnswers = currentTranscript.trim()
                ? [...transcriptHistory, currentTranscript.trim()]
                : transcriptHistory

            const updateResp = await axios.put(`${API}/interview/update/${interviewId}`)
            console.log("update: ", updateResp)

            await axios.post(`${API}/answers/add`, { interviewId: interviewId, answers: finalAnswers })
                .then(() => navigate('/postinterview', { state: { interviewId: interviewId } }))
                .catch(() => navigate('/dashboard'))
        } catch (e) {
            console.log(e)
            navigate('/dashboard')
        }
    }
    // Keep ref in sync so the timer effect always calls the latest version
    useEffect(() => { hangUpRef.current = hangUpInterview })

    // Callback passed to BeyondPresenceAvatar to receive LiveKit Data Channel transcripts
    const handleTranscriptUpdate = useCallback((transcriptData) => {
        if (transcriptData.role === 'user') {
            if (transcriptData.type === 'final') {
                // User finished a sentence — save to history
                setTranscriptHistory(prev => [...prev, transcriptData.text])
                setCurrentTranscript('')
                setUserSpeaking(false)

                // Each user answer corresponds to a question, bump the counter
                setCurrentQuestionIndex(prev => prev + 1)
            } else {
                // Partial — user is still speaking
                setCurrentTranscript(transcriptData.text)
                setUserSpeaking(true)
                setTimeout(() => setUserSpeaking(false), 500)
            }
        } else if (transcriptData.role === 'assistant') {
            // Track AI speaking state for lip-sync amplitude
            setAiSpeaking(transcriptData.type !== 'speech_end')
            setLoading(false)
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
    }, [interviewId])

    useEffect(() => {
        async function func() {
            const resp = await axios.get(`${API}/interview/getById/${interviewId}`)
            setInterview(resp.data.data)
        }
        func()
    }, [interviewId])

    const startInterview = async () => {
        setLoading(true)

        // ── 1. Request microphone permission NOW (user-gesture context).
        //        We immediately stop the tracks so the hardware is free,
        //        but the browser now remembers the "allow" grant.
        //        When setMicrophoneEnabled() is called later inside the LiveKit
        //        room it reuses that grant silently — no permission dialog.
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            stream.getTracks().forEach(t => t.stop()) // release hardware immediately
            console.log('[Interview] ✅ Mic permission pre-granted')
        } catch (micErr) {
            console.warn('[Interview] ⚠️ Mic permission denied:', micErr.message)
            // Non-fatal — setMicrophoneEnabled will try again and show a prompt if needed
        }

        // ── 2. Create the BP session (agent + LiveKit room + our custom token)
        try {
            const res = await fetch(`${API}/beyondpresence/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    llm: {
                        provider: 'openai',
                        model: 'gpt-4',
                    },
                    questions: parsedQuestionsRef.current,
                    interviewConfig: {
                        topic: interview.topic,
                        noOfQuestions: noOfQuestions,
                        experience: state?.experience || 'mid',
                    },
                    greeting: `Hi ${user?.name || user?.firstName || 'there'}, how are you? Ready for your interview on ${interview.topic || 'your selected topic'}?`,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                bpSessionRef.current = data
                setBpSession(data)
                console.log('[BP] Call pre-created with full config:', data.callId)
            } else {
                console.warn('[BP] create-session returned', res.status)
            }
        } catch (e) {
            console.warn('[BP] Pre-warm failed:', e.message)
        }

        setIsActive(true)
        setLoading(false)
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

            {/* Header - Modern Clean Design */}
            <div className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1A2B4B] to-[#007BFF] flex items-center justify-center shadow-lg">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#1A2B4B] tracking-tight">
                            AI Interview Session
                        </h1>
                        <p className="text-xs text-gray-500">
                            {interview.topic}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Question Progress */}
                    <div className="px-4 py-2 bg-[#007BFF]/10 text-[#1A2B4B] text-sm font-semibold rounded-xl">
                        Question: {currentQuestionIndex}/{noOfQuestions}
                    </div>

                    {/* Timer */}
                    <div className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                        timeLeft < 60 ? 'bg-red-100 text-red-700' : 
                        timeLeft < 180 ? 'bg-orange-100 text-orange-700' : 
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {formatTime(timeLeft)}
                    </div>

                    {/* Avatar Controls */}
                    <InterviewAvatarControls
                        avatarEnabled={avatarEnabled}
                        onToggleAvatar={() => setAvatarEnabled(!avatarEnabled)}
                        expression={expression}
                        onExpressionChange={setExpression}
                        showCaptions={showCaptions}
                        onToggleCaptions={() => setShowCaptions(!showCaptions)}
                    />
                </div>
            </div>

            {/* Main Content - Avatar at Bottom Center */}
            <div className="flex-1 flex items-end justify-center pb-4 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">

                {/* Avatar - Positioned at bottom center */}
                <div className="h-[60vh] w-full flex items-end justify-center">
                    <BeyondPresenceAvatar 
                        isSpeaking={aiSpeaking}
                        showAvatar={avatarEnabled}
                        sessionData={bpSession}
                        onTranscriptUpdate={handleTranscriptUpdate}
                        onAiSpeakingChange={setAiSpeaking}
                    />
                </div>
            </div>

            {/* Candidate Video - Extra Large for full face visibility */}
            <div className="absolute top-20 right-6 w-96 h-80 rounded-xl overflow-hidden shadow-2xl border-2 border-white/50 z-50 bg-black">
                <BodyLanguageMonitor 
                    isActive={isActive}
                    showLandmarks={false}
                />
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
