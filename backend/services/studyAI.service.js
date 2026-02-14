import fetch from "node-fetch";
import dotenv from "dotenv";

// 🔥 LOAD ENV
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_amol;
const MODEL =
  process.env.OPENROUTER_MODEL_amol ||
  "nvidia/nemotron-3-nano-30b-a3b:free";

// Constants for content chunking
const MAX_CHUNK_SIZE = 12000; // Leave room for prompt overhead
const CHUNK_OVERLAP = 500; // Overlap between chunks for context continuity

// Content chunking function for large texts
const chunkContent = (text) => {
  if (text.length <= MAX_CHUNK_SIZE) {
    return [text];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + MAX_CHUNK_SIZE;
    
    // Try to break at a natural boundary (paragraph or sentence)
    if (endIndex < text.length) {
      const chunk = text.slice(startIndex, endIndex);
      
      // Find last newline or sentence boundary
      const lastNewline = chunk.lastIndexOf('\n');
      const lastPeriod = chunk.lastIndexOf('.');
      
      if (lastNewline > chunk.length * 0.8) {
        endIndex = startIndex + lastNewline;
      } else if (lastPeriod > chunk.length * 0.8) {
        endIndex = startIndex + lastPeriod + 1;
      }
    }

    chunks.push(text.slice(startIndex, endIndex).trim());
    startIndex = endIndex - CHUNK_OVERLAP;
    
    // Prevent infinite loop for edge cases
    if (startIndex <= chunks[chunks.length - 1]?.length - CHUNK_OVERLAP) {
      break;
    }
  }

  console.log(`[AI] Split content into ${chunks.length} chunks`);
  return chunks;
};

// Shared helper for calling OpenRouter API
const callOpenRouter = async (prompt, systemMessage = "You generate detailed, structured study material in valid JSON only.") => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("❌ OPENROUTER_API_KEY_amol missing in environment variables");
  }

  console.log("[AI] Using model:", MODEL);
  console.log("[AI] API Key present:", OPENROUTER_API_KEY ? 'Yes' : 'No');
  console.log("[AI] Prompt length:", prompt.length);

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
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("❌ OpenRouter API error:", response.status, err);
    throw new Error(`OpenRouter error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    console.error("❌ Empty response. Full data:", JSON.stringify(data, null, 2));
    throw new Error("Empty response from OpenRouter. Check API key and model availability.");
  }

  return content;
};

// Clean and parse JSON from AI response
const parseAIResponse = (content) => {
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

export const generateStudyMaterial = async (rawText) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("❌ OPENROUTER_API_KEY_amol missing in environment variables");
  }

  console.log("[AI] Using model:", MODEL);
  console.log("[AI] API Key present:", OPENROUTER_API_KEY ? 'Yes' : 'No');
  console.log("[AI] API Key length:", OPENROUTER_API_KEY?.length);
  console.log("[AI] Received text length:", rawText.length);
  console.log("[AI] First 100 chars:", rawText.slice(0, 100));

  if (rawText.length < 50) {
    throw new Error("Text too short. Please provide at least 50 characters of content.");
  }

  // For large texts, chunk the content
  const chunks = chunkContent(rawText);
  const textToProcess = chunks.length > 1 
    ? chunks.join('\n\n---CONTINUED---\n\n') 
    : rawText.slice(0, 14000);

  const prompt = `
You are an expert AI study assistant.

Your task is to deeply analyze the provided content and generate HIGH-QUALITY,
DETAILED study material.

=====================
CONTENT TO ANALYZE
=====================
"""
${textToProcess.slice(0, 14000)}
"""

=====================
OUTPUT REQUIREMENTS
=====================

Return ONLY valid JSON (no markdown, no explanations).

The JSON MUST strictly follow this structure:

{
  "summary": "<DETAILED markdown summary>",
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

FLASHCARDS:
- Minimum **10 flashcards** (increased from 8)
- Each card must test a key concept from the content
- Generate concept-based questions, not just definitions
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

  console.log("[AI] Sending request to OpenRouter...");
  console.log("[AI] Request details:", {
    model: MODEL,
    promptLength: prompt.length,
    temperature: 0.35
  });

  const content = await callOpenRouter(prompt);
  const parsed = parseAIResponse(content);
  
  // 🔥 Debug: Log what we got
  console.log("[AI] Generated content structure:", {
    hasSummary: !!parsed.summary,
    summaryLength: parsed.summary?.length,
    hasFlashcards: !!parsed.flashcards,
    flashcardsCount: parsed.flashcards?.length,
    hasQuiz: !!parsed.quiz,
    quizCount: parsed.quiz?.length
  });

  return parsed;
};

// Generate quiz with custom question count
export const generateQuiz = async (rawText, count = 5) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("❌ OPENROUTER_API_KEY_amol missing in environment variables");
  }

  console.log("[AI Quiz] Generating quiz with", count, "questions");
  console.log("[AI Quiz] Text length:", rawText.length);

  if (rawText.length < 50) {
    throw new Error("Text too short to generate quiz");
  }

  // Validate count
  const questionCount = Math.min(Math.max(parseInt(count) || 5, 3), 20);

  const prompt = `
You are an expert AI quiz generator.

Your task is to generate a quiz based on the provided study content.

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

Generate exactly **${questionCount} questions** with the following structure:

{
  "quiz": [
    {
      "question": "A clear, specific question about the content",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0  // Index of the correct answer (0-3)
    }
  ]
}

=====================
QUALITY RULES
=====================
- Each question must test understanding, not just memorization
- All 4 options should be plausible/reasonable
- Only ONE correct answer per question
- Questions should cover different aspects of the content
- Make questions challenging but fair

=====================
STRICT RULES
=====================
- JSON ONLY (no backticks)
- No extra text outside JSON
- Generate exactly ${questionCount} questions
- Each question MUST have exactly 4 options

BEGIN.
`;

  const content = await callOpenRouter(
    prompt,
    "You generate quizzes in valid JSON only. Generate exactly the number of questions requested."
  );
  
  const parsed = parseAIResponse(content);

  console.log("[AI Quiz] Generated", parsed.quiz?.length || 0, "questions");

  if (!parsed.quiz || !Array.isArray(parsed.quiz)) {
    throw new Error("AI did not return valid quiz data");
  }

  return parsed.quiz;
};
