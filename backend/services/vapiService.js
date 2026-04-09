const VAPI_API_BASE_URL = "https://api.vapi.ai"

const getVapiApiKey = () => {
  const key = process.env.VAPI_API_KEY || process.env.VITE_VAPI_API_KEY
  if (!key) {
    throw new Error("Missing VAPI_API_KEY in backend environment.")
  }
  return key.trim()
}

const createAssistantBody = ({
  topic,
  noOfQuestions,
  questions,
  experience,
  candidateName
}) => {
  const limitedQuestions = (Array.isArray(questions) ? questions : [])
    .filter(Boolean)
    .slice(0, Number(noOfQuestions) || 5)

  const prompt = `You are a professional technical interviewer.
You must ask EXACTLY ${limitedQuestions.length || noOfQuestions || 5} questions and then stop.
Candidate name: ${candidateName || "Candidate"}
Topic: ${topic || "General"}
Experience: ${experience || "Not specified"}

Ask one question at a time, wait for the user response, and give concise feedback.
Only use these questions in this exact order:
${limitedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

When all questions are done, close the interview politely.`

  return {
    name: `Interview-${Date.now()}`,
    firstMessage: `Hi ${candidateName || "there"}, ready for your interview on ${topic || "your selected topic"}?`,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt
        }
      ]
    },
    voice: {
      provider: "vapi",
      voiceId: "Elliot"
    }
  }
}

const postVapi = async (path, body) => {
  const response = await fetch(`${VAPI_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getVapiApiKey()}`
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Vapi ${path} failed (${response.status}): ${errorBody}`)
  }

  return response.json()
}

export const createRuntimeAssistant = async (config) => {
  const body = createAssistantBody(config)

  // Support either /assistant or /assistants endpoint variants.
  try {
    return await postVapi("/assistant", body)
  } catch (firstError) {
    try {
      return await postVapi("/assistants", body)
    } catch {
      throw firstError
    }
  }
}

