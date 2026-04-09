import { WebSocketServer } from "ws"
import { createRuntimeAssistant } from "../services/vapiService.js"

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const sendEvent = (socket, type, payload = {}) => {
  if (socket.readyState !== socket.OPEN) return
  socket.send(JSON.stringify({ type, payload }))
}

export const setupInterviewSocket = (server) => {
  const wss = new WebSocketServer({ server, path: "/ws/interview" })
  const sessionStore = new Map()

  wss.on("connection", (socket) => {
    let activeInterviewId = null

    socket.on("message", async (rawMessage) => {
      const parsed = safeJsonParse(rawMessage.toString())
      if (!parsed?.type) return

      if (parsed.type === "session_init") {
        const payload = parsed.payload || {}
        const interviewId = payload.interviewId

        if (!interviewId) {
          sendEvent(socket, "session_error", { message: "Missing interviewId in session_init payload." })
          return
        }

        activeInterviewId = interviewId

        try {
          const assistant = await createRuntimeAssistant({
            topic: payload.topic,
            noOfQuestions: payload.noOfQuestions,
            questions: payload.questions,
            experience: payload.experience,
            candidateName: payload.candidateName
          })

          const assistantId = assistant?.id || assistant?._id
          if (!assistantId) {
            throw new Error("Vapi assistant creation succeeded but no assistant id was returned.")
          }

          sessionStore.set(interviewId, {
            assistantId,
            createdAt: Date.now(),
            transcript: []
          })

          sendEvent(socket, "session_ready", { interviewId, assistantId })
        } catch (error) {
          sendEvent(socket, "session_error", { message: error.message || "Failed to initialize interview session." })
        }
        return
      }

      if (!activeInterviewId) return

      if (parsed.type === "transcript_user") {
        const current = sessionStore.get(activeInterviewId) || { transcript: [] }
        const text = parsed.payload?.text?.trim()
        if (text) {
          current.transcript.push(text)
          sessionStore.set(activeInterviewId, current)
        }
        return
      }

      if (parsed.type === "session_end") {
        const current = sessionStore.get(activeInterviewId) || {}
        current.endedAt = Date.now()
        sessionStore.set(activeInterviewId, current)
      }
    })

    socket.on("close", () => {
      activeInterviewId = null
    })
  })
}

