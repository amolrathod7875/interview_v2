import fetch from "node-fetch";
import dotenv from "dotenv";

// 🔥 LOAD ENV
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_amol;
const MODEL =
  process.env.OPENROUTER_MODEL_amol ||
  "nvidia/nemotron-3-nano-30b-a3b:free";

export const generateStudyMaterial = async (rawText) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("❌ OPENROUTER_API_KEY_amol missing in environment variables");
  }

  console.log(`[AI] Received text length: ${rawText.length}`);
  console.log(`[AI] First 100 chars: ${rawText.slice(0, 100)}`);

  const prompt = `
You are an expert AI study assistant.

Your task is to deeply analyze the provided content and generate HIGH-QUALITY,
DETAILED study material.

=====================
CONTENT TO ANALYZE
=====================
"""
${rawText.slice(0, 14000)}
"""

=====================
OUTPUT REQUIREMENTS
=====================

Return ONLY valid JSON (no markdown, no explanations).

The JSON MUST strictly follow this structure:

{
  "summary": "<DETAILED markdown summary>",
  "podcast_script": [
    { "speaker": "Host", "text": "..." },
    { "speaker": "Expert", "text": "..." }
  ],
  "flashcards": [
    { "front": "...", "back": "..." }
  ],
  "quiz": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswerIndex": 0
    }
  ]
}

=====================
QUALITY RULES (VERY IMPORTANT)
=====================

SUMMARY:
- Minimum **400–600 words**
- Use clean markdown with STRICT bullet-point format:
  - Main section headings (##)
  - ALL content under each heading MUST be in bullet points (-)
  - Use nested bullets for sub-points
  - Bold key terms using **term**
  - NO paragraphs - everything must be bullet points
  - Example format:
    ## Section Name
    - Main point with **bold key term**
      - Sub-point detail
      - Another sub-point
    - Next main point
- Explain concepts clearly as if teaching a beginner
- No generic filler text

PODCAST SCRIPT:
- Minimum **6–8 turns**
- Conversational, natural, educational
- Host asks thoughtful questions
- Expert explains clearly with examples

FLASHCARDS:
- Minimum **8 flashcards**
- Each card must test a key concept from the content
- Clear and concise answers

QUIZ:
- Minimum **5 questions**
- 4 realistic options each
- Only ONE correct answer
- Questions should test understanding, not memorization

=====================
STRICT RULES
=====================
- JSON ONLY (no backticks)
- No extra text outside JSON
- No placeholders like "example" or "dummy"
- Content must reflect the uploaded document

BEGIN.
`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Interview.io Study Companion",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You generate detailed, structured study material in valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${err}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  // 🔥 Clean & parse JSON safely
  try {
    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Invalid JSON from AI:\n", content);
    throw new Error("AI returned invalid JSON");
  }
};
