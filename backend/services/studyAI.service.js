import dotenv from "dotenv";
import { callCohere } from "./cohere.service.js";

// LOAD ENV
dotenv.config();

// Study Companion uses COHERE_API_KEY_STUDY_COM directly (no OpenRouter)
const STUDY_COHERE_KEY = () => process.env.COHERE_API_KEY_STUDY_COM;

// Constants for content chunking
const MAX_CHUNK_SIZE = 12000; // Leave room for prompt overhead
const CHUNK_OVERLAP = 500; // Overlap between chunks for context continuity
const QA_CHUNK_SIZE = 8000; // Smaller chunks for Q&A to improve context

// Content chunking function for large texts
const chunkContent = (text, maxSize = MAX_CHUNK_SIZE) => {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxSize;
    
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

  console.log(`[AI] Split content into ${chunks.length} chunks (maxSize: ${maxSize})`);
  return chunks;
};

// Primary caller for Study Companion — uses COHERE_API_KEY_STUDY_COM directly
const callOpenRouter = async (
  prompt,
  systemMessage = "You generate detailed, structured study material in valid JSON only.",
  maxTokens = 4096
) => {
  const cohereKey = STUDY_COHERE_KEY();
  if (!cohereKey) {
    throw new Error("COHERE_API_KEY_STUDY_COM is missing — cannot process request");
  }

  console.log("[AI] Using Cohere (COHERE_API_KEY_STUDY_COM) | prompt length:", prompt.length);
  try {
    const text = await callCohere(prompt, systemMessage, maxTokens, cohereKey);
    return text;
  } catch (coErr) {
    console.error("[AI] Cohere request failed:", coErr.message);
    throw new Error("Cohere study companion call failed: " + coErr.message);
  }
};

// Lightweight LLM caller for smaller tasks — use Cohere
const callSmallLLM = async (prompt, systemMessage = "You generate valid JSON only.") => {
  const cohereKey = STUDY_COHERE_KEY() || process.env.COHERE_API_KEY;
  if (!cohereKey) throw new Error("No Cohere API key available for small LLM calls");

  try {
    const text = await callCohere(prompt, systemMessage, 2500, cohereKey);
    return text;
  } catch (err) {
    console.error("Small LLM (Cohere) error:", err.message);
    throw err;
  }
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
    console.error("Invalid JSON from AI:\n", content);
    throw new Error("AI returned invalid JSON");
  }
};

/**
 * Strip flashcard and quiz sections that Cohere sometimes leaks into
 * the summary text field. Removes everything from any heading that
 * matches "Flashcards", "Quiz", "Key Concepts" (standalone section) etc.
 * Also removes raw "front / back" Q&A lines and MCQ-style lines.
 */
const cleanSummary = (summary) => {
  if (!summary || typeof summary !== "string") return summary;

  // Split on lines that begin a Flashcards or Quiz section (with or without ## / #)
  // e.g. "## Flashcards", "Flashcards", "# Quiz", "Quiz"
  const sectionBreakRe = /^#{0,3}\s*(flashcards?|quiz(?:zes)?)\s*$/im;
  const breakMatch = sectionBreakRe.exec(summary);
  if (breakMatch) {
    summary = summary.slice(0, breakMatch.index).trimEnd();
  }

  // Also strip individual Q&A lines that still sneak in:
  // Lines like "What is ...? **Answer**" or "A) ..." or "front: / back:"
  const lines = summary.split("\n");
  const cleanLines = [];
  for (const line of lines) {
    // Skip lines that look like flashcard Q/A pairs
    if (/^(front|back)\s*:/i.test(line.trim())) continue;
    // Skip lines that look like MCQ options: "A) ...", "B) ..."
    if (/^[A-D]\)\s+/.test(line.trim())) continue;
    cleanLines.push(line);
  }

  return cleanLines.join("\n").trimEnd();
};

export const generateStudyMaterial = async (rawText) => {
  if (!STUDY_COHERE_KEY()) {
    throw new Error("COHERE_API_KEY_STUDY_COM missing in environment variables");
  }

  console.log("[AI] Using Cohere for study material generation");
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

  console.log("[AI] Sending request to Cohere...");
  console.log("[AI] Prompt length:", prompt.length);

  const content = await callOpenRouter(prompt, "You generate detailed, structured study material in valid JSON only.", 4096);
  const parsed = parseAIResponse(content);

  // Sanitize: remove any flashcard/quiz content that leaked into summary
  if (parsed.summary) {
    parsed.summary = cleanSummary(parsed.summary);
  }

  // Debug: Log what we got
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
  if (!STUDY_COHERE_KEY()) {
    throw new Error("COHERE_API_KEY_STUDY_COM missing in environment variables");
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

/**
 * Answer a question about the uploaded study material
 * @param {string} rawText - The original study text
 * @param {string} question - The question to answer
 * @returns {Promise<string>} The answer
 */
export const answerQuestion = async (rawText, question) => {
  if (!STUDY_COHERE_KEY()) {
    throw new Error("COHERE_API_KEY_STUDY_COM missing in environment variables");
  }

  const prompt = `
You are a helpful study assistant. Based ONLY on the following study material, answer the user's question.

Study Material:
====================
${rawText}
====================

User's Question: ${question}

Instructions:
- Answer ONLY based on the study material provided
- If the answer is not in the material, say "I don't have information about that in the uploaded study material."

STRICT FORMATTING RULES (VERY IMPORTANT):
1. First line MUST be a bold heading using **Heading Text**
2. Every bullet point item MUST be on its own line starting with a dash (-)
3. NEVER use inline dashes or semicolons to connect items
4. After the bold heading, ALL content must be in bullet point format

CORRECT FORMAT EXAMPLE:
**Features Overview**
- Voice-Enabled AI Mock Interviewer
- GitHub Repository Analysis
- CodeX Sandbox
- AI Study Companion
- Resume Analyzer

INCORRECT FORMAT (DO NOT USE):
**Features Overview** - **Voice-Enabled AI Mock Interviewer** - **GitHub Repository Analysis**

Your Answer:
`;

  console.log("[AI] Answering question about study material...");
  console.log("[AI] Question:", question);
  
  const answer = await callOpenRouter(
    prompt,
    "You are a helpful study assistant that answers questions based ONLY on the provided study material. Be concise, accurate, and use proper formatting with bold for titles."
  );

  console.log("[AI] Answer generated successfully");
  
  return answer;
};

/**
 * Generate a mind map from study material
 * @param {string} rawText - The original study text
 * @returns {Promise<Object>} Mind map with nodes and edges
 */
export const generateMindMap = async (rawText) => {
  if (!STUDY_COHERE_KEY()) {
    throw new Error("COHERE_API_KEY_STUDY_COM missing in environment variables");
  }

  console.log("[AI MindMap] Generating mind map...");
  console.log("[AI MindMap] Text length:", rawText.length);

  if (rawText.length < 50) {
    throw new Error("Text too short to generate mind map");
  }
  // First try Cohere (small structured output) then OpenRouter as fallback
  try {
    const prompt = `You are an assistant that returns ONLY valid JSON describing a hierarchical mind map (nodes and edges).\n
Input:\n"""\n${rawText.slice(0, 14000)}\n"""\n\nReturn an object {"nodes": [...], "edges": [...]} where nodes have id,label,level,parentId(optional),x,y. Keep labels short.`;

    // Cohere small LLM call
    try {
      const aiContent = await callSmallLLM(prompt, "Generate mindmap JSON only");
      const parsed = parseAIResponse(aiContent);
      console.log("[AI MindMap - Cohere] Generated", parsed.nodes?.length || 0, "nodes and", parsed.edges?.length || 0, "edges");
      if (parsed && Array.isArray(parsed.nodes)) return parsed;
    } catch (coErr) {
      console.warn('[AI MindMap] Cohere small LLM failed:', coErr.message);
    }

    // Second attempt with slightly different prompt
    const promptRetry = `You are an expert AI that creates mind maps from study material. Return ONLY valid JSON with nodes and edges.\n"""\n${rawText.slice(0,14000)}\n"""`;
    const contentRetry = await callOpenRouter(promptRetry, "You generate mind maps in valid JSON only.");
    const parsedRetry = parseAIResponse(contentRetry);
    if (parsedRetry && Array.isArray(parsedRetry.nodes)) {
      console.log("[AI MindMap - Cohere retry] Generated", parsedRetry.nodes.length, "nodes");
      return parsedRetry;
    }
  } catch (err) {
    console.warn("[AI MindMap] AI generation failed, falling back to heuristic:", err.message);
  }

  // Final fallback: simple heuristic generator (keywords/headings)
  const fallback = generateFallbackMindMap(rawText);
  console.log("[AI MindMap] Fallback generated", fallback.nodes.length, "nodes");
  return fallback;
};

// Heuristic fallback mind map generator: extracts frequent terms and headings
const generateFallbackMindMap = (text) => {
  const stopwords = new Set([
    'the','and','is','in','to','of','a','for','on','with','that','by','this','as','are','from','or','an','be','it','will','which','at',
  ]);

  const clean = text.replace(/[^a-zA-Z0-9\s\n\.]/g, ' ');
  const words = clean.toLowerCase().split(/\s+/).filter(w => w.length>2 && !stopwords.has(w));

  const freq = {};
  for (const w of words) freq[w] = (freq[w]||0)+1;
  const sorted = Object.keys(freq).sort((a,b)=>freq[b]-freq[a]);

  // Choose top 5 terms as subtopics
  const top = sorted.slice(0,5);

  const nodes = [];
  const edges = [];

  // Root node: use first non-empty line as title or fallback
  const firstLine = (text.split('\n').find(l=>l.trim().length>10) || '').trim();
  const rootLabel = firstLine ? firstLine.slice(0,60) : 'Main Topic';
  nodes.push({ id: 'n0', label: rootLabel, level: 0, x: 400, y: 60 });

  // Level 1 nodes
  top.forEach((term, i) => {
    const id = `n${i+1}`;
    const x = 150 + i * 110;
    const y = 170;
    nodes.push({ id, label: term.slice(0,30), level: 1, x, y, parentId: 'n0' });
    edges.push({ from: 'n0', to: id });

    // add 2 detail nodes for each term (extract nearby sentences)
    const re = new RegExp(`([^.!?]{20,120}${term}[^.!?]{0,120}[.!?])`, 'ig');
    const matches = [];
    let m;
    while ((m = re.exec(text)) && matches.length < 2) matches.push(m[1].trim());

    if (matches.length === 0) {
      // pick some nearby words as detail
      nodes.push({ id: `${id}d1`, label: `detail about ${term}`.slice(0,30), level:2, x: x-40, y: 270, parentId: id });
      nodes.push({ id: `${id}d2`, label: `example ${term}`.slice(0,30), level:2, x: x+40, y: 270, parentId: id });
      edges.push({ from: id, to: `${id}d1` });
      edges.push({ from: id, to: `${id}d2` });
    } else {
      matches.forEach((s, j) => {
        const did = `${id}d${j+1}`;
        nodes.push({ id: did, label: s.slice(0,30), level:2, x: x + (j===0 ? -30 : 30), y: 270 + j*20, parentId: id });
        edges.push({ from: id, to: did });
      });
    }
  });

  return { nodes, edges };
};

/**
 * Generate a study report from study material
 * @param {string} rawText - The original study text
 * @returns {Promise<Object>} Report with title, summary, sections, and key points
 */
export const generateReport = async (rawText) => {
  if (!STUDY_COHERE_KEY()) {
    throw new Error("COHERE_API_KEY_STUDY_COM missing in environment variables");
  }

  console.log("[AI Report] Generating report...");
  console.log("[AI Report] Text length:", rawText.length);

  if (rawText.length < 50) {
    throw new Error("Text too short to generate report");
  }

  const prompt = `
You are an expert AI that creates comprehensive study reports.

Your task is to analyze the provided content and generate a detailed structured report.

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

Generate a report with the following structure:

{
  "title": "Report Title",
  "summary": "A brief 2-3 sentence overview of the content",
  "sections": [
    { "heading": "Section 1 Title", "content": "Detailed content for section 1..." },
    { "heading": "Section 2 Title", "content": "Detailed content for section 2..." }
  ],
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "generatedAt": "2024-01-01T00:00:00.000Z"
}

=====================
QUALITY RULES
=====================

TITLE:
- Create a clear, descriptive title for the report

SUMMARY:
- Write 2-3 sentences summarizing the main topic and key takeaways

SECTIONS:
- Create 4-6 main sections covering different aspects of the content
- Each section should have substantial content (2-4 paragraphs)
- Use clear headings that describe the section topic
- Cover: Introduction, Main Concepts, Key Details, Applications, Summary

KEY POINTS:
- Extract 5-8 most important points from the material
- Each point should be a single, clear statement
- Focus on actionable or exam-ready information

GENERATED AT:
- Use ISO 8601 format: new Date().toISOString()

=====================
STRICT RULES
=====================
- JSON ONLY (no backticks)
- No extra text outside JSON
- All fields must be present
- Content should be in plain text, not markdown

BEGIN.
`;

  const content = await callOpenRouter(
    prompt,
    "You generate study reports in valid JSON only with structured sections."
  );
  
  const parsed = parseAIResponse(content);

  console.log("[AI Report] Generated report with", parsed.sections?.length || 0, "sections");

  if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("AI did not return valid report data");
  }

  // Add generatedAt timestamp if not present
  if (!parsed.generatedAt) {
    parsed.generatedAt = new Date().toISOString();
  }

  return parsed;
};

