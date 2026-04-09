import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
import { PhoneOff, Mic, Zap } from "lucide-react"
import LoadingWave from "./ui/LoadingWave"
import BodyLanguageMonitor from "./BodyLanguageMonitor"
import Vapi from "@vapi-ai/web"

const messages = [
  "Generating Results...",
  "Evaluating...",
  "Almost done..."
]
const RAW_API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "")
const VAPI_PUBLIC_KEY = (import.meta.env.VITE_VAPI_PUBLIC_KEY || "").split("#")[0].trim()

const getInterviewWsUrl = () => {
  const parsed = new URL(API)
  const protocol = parsed.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${parsed.host}/ws/interview`
}

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
  const [sessionError, setSessionError] = useState("")
  const [transcriptHistory, setTranscriptHistory] = useState([])
  const [currentTranscript, setCurrentTranscript] = useState("")

  const navigate = useNavigate()
  const interviewId = state?.interviewId
  const hangUpRef = useRef(null)
  const vapiRef = useRef(null)
  const wsRef = useRef(null)
  const listenersAttachedRef = useRef(false)
  const parsedQuestionsRef = useRef([])

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          hangUpRef.current?.()
          return 0
        }
        return previous - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isActive, timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const firebaseId = localStorage.getItem("userUid")
        const res = await axios.get(`${API}/user/me`, { params: { firebaseId } })
        setUser(res.data.data)
      } catch (err) {
        console.error("Failed to fetch user:", err)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!isCompleted || msgIndex >= messages.length - 1) return
    const timer = setTimeout(() => setMsgIndex((i) => i + 1), 3000)
    return () => clearTimeout(timer)
  }, [isCompleted, msgIndex])

  useEffect(() => {
    if (!questions.length) return
    parsedQuestionsRef.current = questions.slice(0, noOfQuestions).map((q) => q.text)
  }, [questions, noOfQuestions])

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(`${API}/questions/${interviewId}`)
        setQuestions(response.data.data || [])
      } catch (error) {
        console.error(error)
      }
    }
    if (interviewId) fetchQuestions()
  }, [interviewId])

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await axios.get(`${API}/interview/getById/${interviewId}`)
        setInterview(response.data.data || {})
      } catch (error) {
        console.error(error)
      }
    }
    if (interviewId) fetchInterview()
  }, [interviewId])

  const stopVapi = () => {
    try {
      vapiRef.current?.stop?.()
    } catch (error) {
      console.warn("Vapi stop warning:", error)
    }
  }

  const closeInterviewSocket = () => {
    if (!wsRef.current) return
    try {
      wsRef.current.close()
    } catch {
      // ignore close failures
    } finally {
      wsRef.current = null
    }
  }

  const sendSocketEvent = (type, payload = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type, payload }))
  }

  const handleVapiMessage = (message) => {
    const role = message?.role || message?.speaker || message?.from
    const text = message?.transcript || message?.text || message?.content || ""
    const isFinal = message?.isFinal ?? message?.final ?? message?.transcriptType === "final"

    if (!text) return

    if (role === "user") {
      if (isFinal) {
        setTranscriptHistory((previous) => [...previous, text])
        setCurrentTranscript("")
        setCurrentQuestionIndex((previous) => previous + 1)
        setUserSpeaking(false)
        sendSocketEvent("transcript_user", { text })
      } else {
        setCurrentTranscript(text)
        setUserSpeaking(true)
      }
      return
    }

    if (role === "assistant") {
      setAiSpeaking(!isFinal)
    }
  }

  const attachVapiListeners = () => {
    if (!vapiRef.current || listenersAttachedRef.current) return
    listenersAttachedRef.current = true

    vapiRef.current.on("call-start", () => {
      setSessionError("")
      setIsActive(true)
      setLoading(false)
    })

    vapiRef.current.on("call-end", () => {
      setAiSpeaking(false)
      setUserSpeaking(false)
      setIsActive(false)
    })

    vapiRef.current.on("speech-start", () => setAiSpeaking(true))
    vapiRef.current.on("speech-end", () => setAiSpeaking(false))
    vapiRef.current.on("message", handleVapiMessage)

    vapiRef.current.on("error", (error) => {
      console.error("Vapi runtime error:", error)
      setSessionError(error?.message || "Interview voice session failed.")
      setLoading(false)
      setIsActive(false)
    })
  }

  const hangUpInterview = async () => {
    try {
      setIsCompleted(true)
      setIsActive(false)
      stopVapi()
      sendSocketEvent("session_end", { interviewId })
      closeInterviewSocket()

      const finalAnswers = currentTranscript.trim()
        ? [...transcriptHistory, currentTranscript.trim()]
        : transcriptHistory

      await axios.put(`${API}/interview/update/${interviewId}`)
      await axios.post(`${API}/answers/add`, {
        interviewId,
        answers: finalAnswers
      })

      navigate("/postinterview", { state: { interviewId } })
    } catch (error) {
      console.error(error)
      navigate("/dashboard")
    }
  }

  useEffect(() => {
    hangUpRef.current = hangUpInterview
  })

  useEffect(() => {
    return () => {
      stopVapi()
      closeInterviewSocket()
    }
  }, [])

  const initializeSessionOverSocket = async () => {
    return new Promise((resolve, reject) => {
      closeInterviewSocket()

      const socket = new WebSocket(getInterviewWsUrl())
      wsRef.current = socket

      const onSocketError = () => {
        reject(new Error("WebSocket connection failed."))
      }

      socket.addEventListener("open", () => {
        socket.send(
          JSON.stringify({
            type: "session_init",
            payload: {
              interviewId,
              topic: interview.topic,
              noOfQuestions,
              experience: interview.experience,
              candidateName: user?.name || "Candidate",
              questions: parsedQuestionsRef.current
            }
          })
        )
      })

      socket.addEventListener("message", (event) => {
        const parsed = JSON.parse(event.data || "{}")
        if (parsed?.type === "session_ready") {
          socket.removeEventListener("error", onSocketError)
          resolve(parsed.payload?.assistantId)
          return
        }

        if (parsed?.type === "session_error") {
          socket.removeEventListener("error", onSocketError)
          reject(new Error(parsed.payload?.message || "Session initialization failed."))
        }
      })

      socket.addEventListener("error", onSocketError)
    })
  }

  const startInterview = async () => {
    if (!VAPI_PUBLIC_KEY) {
      setSessionError("Vapi public key is missing. Please configure VITE_VAPI_PUBLIC_KEY.")
      return
    }

    setLoading(true)
    setSessionError("")

    try {
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(VAPI_PUBLIC_KEY)
      }
      attachVapiListeners()

      const runtimeAssistantId = await initializeSessionOverSocket()
      if (!runtimeAssistantId) {
        throw new Error("Assistant id was not provided by session gateway.")
      }

      await vapiRef.current.start(runtimeAssistantId, {
        metadata: {
          interviewId,
          topic: interview.topic,
          noOfQuestions
        },
        variableValues: {
          candidateName: user?.name || "Candidate",
          topic: interview.topic || "General interview",
          questions: parsedQuestionsRef.current
        }
      })
    } catch (error) {
      console.error("Failed to start Vapi:", error)
      setSessionError(error?.message || "Unable to start interview voice session.")
      setLoading(false)
      setIsActive(false)
      closeInterviewSocket()
    }
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <LoadingWave />
        <p className="text-muted-foreground text-sm">{messages[msgIndex]}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <LoadingWave />
      </div>
    )
  }

  if (!isActive) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="bg-card border border-border rounded-2xl p-10 shadow-sm text-center max-w-md w-full">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 mx-auto mb-6">
            <Mic className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">AI Interview Session</h1>

          <p className="text-muted-foreground mb-6">
            Interview Topic:{" "}
            <span className="font-medium text-foreground">{interview.topic}</span>
          </p>

          {sessionError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {sessionError}
            </div>
          )}

          <Button
            onClick={startInterview}
            className="w-full bg-primary cursor-pointer hover:brightness-90 text-primary-foreground py-3 text-base"
          >
            Start Interview
          </Button>

          <p className="text-muted-foreground text-sm mt-4">
            Click the button above to begin your interview session.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 h-screen w-screen bg-background flex flex-col font-['Inter',sans-serif] overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">AI Interview Session</h1>
            <p className="text-xs text-muted-foreground">{interview.topic}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-xl">
            Question: {currentQuestionIndex}/{noOfQuestions}
          </div>
          <div
            className={`px-4 py-2 text-sm font-semibold rounded-xl ${
              timeLeft < 60
                ? "bg-red-500/15 text-red-500"
                : timeLeft < 180
                  ? "bg-orange-500/15 text-orange-500"
                  : "bg-muted text-foreground"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/30 overflow-hidden">
        <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              AI status:{" "}
              <span className={aiSpeaking ? "text-primary" : "text-muted-foreground"}>
                {aiSpeaking ? "Speaking" : "Listening"}
              </span>
            </div>
            <div className="text-sm font-medium text-foreground">
              Candidate:{" "}
              <span className={userSpeaking ? "text-primary" : "text-muted-foreground"}>
                {userSpeaking ? "Speaking" : "Idle"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 min-h-28">
            <p className="text-xs text-muted-foreground mb-2">Live transcript preview</p>
            <p className="text-sm text-foreground">
              {currentTranscript || "Waiting for transcript..."}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-20 right-6 w-96 h-80 rounded-xl overflow-hidden shadow-2xl border-2 border-white/50 z-50 bg-black">
        <BodyLanguageMonitor isActive={isActive} showLandmarks={false} />
      </div>

      <div className="flex flex-col items-center gap-2 py-3 bg-card border-t border-border flex-shrink-0">
        <button
          onClick={hangUpInterview}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <PhoneOff className="h-7 w-7" />
        </button>

        <p className="text-muted-foreground text-sm font-medium">Interview in progress...</p>
      </div>
    </div>
  )
}
