import e from "express";
const router = e.Router()
import fetch from "node-fetch";
import roadmapModel from '../models/roadmapModel.js'
import { callCohere, parseCohereJSON } from '../services/cohere.service.js'
import { 
    getRoadmapFromOracle, 
    saveRoadmapToOracle, 
    isRoadmapCached,
    generateCacheKey,
    isRoadmapExpired
} from '../services/oracleRoadmapCache.js'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_amol;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL_amol || 'openai/gpt-4o-mini';
const QUIZ_QUESTION_COUNT = 5;
const QUIZ_PASS_PERCENT = 60;
const QUIZ_OPTION_COUNT = 4;

const normalizeAnswerIndex = (value) => {
    if (typeof value === 'number' && Number.isInteger(value)) {
        if (value >= 0 && value <= 3) return value;
        if (value >= 1 && value <= 4) return value - 1;
        return null;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d+$/.test(trimmed)) {
            const parsed = Number.parseInt(trimmed, 10);
            if (parsed >= 0 && parsed <= 3) return parsed;
            if (parsed >= 1 && parsed <= 4) return parsed - 1;
        }
        return null;
    }

    return null;
}

const sanitizeQuizQuestions = (questions) => {
    if (!Array.isArray(questions)) {
        throw new Error('Quiz questions must be an array');
    }

    const normalized = questions
        .map((question) => {
            const text = typeof question?.question === 'string' ? question.question.trim() : '';
            const options = Array.isArray(question?.options)
                ? question.options.map(option => typeof option === 'string' ? option.trim() : '')
                : [];
            const correctAnswer = normalizeAnswerIndex(question?.correctAnswer);

            const isValid = text.length > 0
                && options.length === QUIZ_OPTION_COUNT
                && options.every(option => option.length > 0)
                && Number.isInteger(correctAnswer)
                && correctAnswer >= 0
                && correctAnswer < QUIZ_OPTION_COUNT;

            if (!isValid) return null;

            return {
                question: text,
                options,
                correctAnswer,
            };
        })
        .filter(Boolean)
        .slice(0, QUIZ_QUESTION_COUNT);

    if (normalized.length < QUIZ_QUESTION_COUNT) {
        throw new Error(`Generated quiz must include at least ${QUIZ_QUESTION_COUNT} valid questions`);
    }

    return normalized;
}

const getRoadmapItem = async (roadmapId, level, itemId) => {
    const roadmap = await roadmapModel.findById(roadmapId);
    if (!roadmap) {
        return { error: { status: 404, message: 'Roadmap not found' } };
    }

    const levelItems = roadmap?.roadmap?.[level];
    if (!Array.isArray(levelItems)) {
        return { error: { status: 400, message: 'Invalid level in roadmap data' } };
    }

    const itemIndex = levelItems.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
        return { error: { status: 404, message: 'Item not found in the specified level' } };
    }

    return { roadmap, itemIndex };
}

const openrouterFallback = async (prompt, systemMsg) => {
    if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key missing');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-interview.app',
            'X-Title': 'AI Interview Platform',
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
                { role: 'system', content: systemMsg },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        })
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${txt}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content;
}

const getPrompt = (topic) => {
        return `Generate a learning roadmap for the topic: "${topic}".

Rules:
- Divide the roadmap into Beginner, Intermediate, and Advanced.
- Each level must contain 4–6 items.
- Each item should be an object with a 'key' (a short title or label for the stage/point) and a 'value' (a 1-2 line description about that point). The value should also contain sources of learning (like video, documentation, etc).
- if you are giving any article link or yt video link, just include 'https://' before url to make parsing easy
- Do not include explanations, comments, markdown, or text outside JSON.
- The response MUST start with { and end with }.
- If you cannot comply, return an empty JSON object {}.
- Language of output should be ENGLISH
- Output the evaluation in the following JSON format ONLY. Remove any characters eg '''json , ', etc to avoid json.PARSE() errors. It should be a valid json as it can create conflict in server while parsing.
- Do not bold any text of output.
Output format strict JSON as asked in prompt:
{
    "beginner": [
        { "key": "short desc", "value": "actual desc with sources" }
    ],
    "intermediate": [
        { "key": "short desc", "value": "actual desc with sources" }
    ],
    "advanced": [
        { "key": "short desc", "value": "actual desc with sources" }
    ]
}
`
}

const generateRoadmap = async (topic) => {
    const prompt = getPrompt(topic);
    const systemMsg = "You are an expert learning roadmap generator. Always respond with valid JSON only — no markdown, no extra text.";

    // 1️⃣ Try Cohere first (free, reliable)
    try {
        console.log("[ROADMAP] Trying Cohere...");
        const text = await callCohere(prompt, systemMsg, 2048);
        console.log(" Cohere roadmap response received");
        return text;
    } catch (cohereErr) {
        console.warn("[ROADMAP] Cohere failed, falling back to OpenRouter:", cohereErr.message);
    }

    // 2️⃣ Fallback: OpenRouter (via fetch)
    const orText = await openrouterFallback(prompt, systemMsg);
    console.log(" OpenRouter roadmap response received");
    return orText;
}

router.post('/add', async (req, resp) => {
    try {
        const topic = req.body.topic;
        
        //  Check Oracle Cloud cache first
        console.log(`[ROADMAP] Checking cache for topic: ${topic}`);
        let roadmapData = null;
        let fromCache = false;
        
        try {
            const cachedRoadmap = await getRoadmapFromOracle(topic);
            if (cachedRoadmap && !isRoadmapExpired(cachedRoadmap)) {
                console.log(`[ROADMAP]  Cache HIT for topic: ${topic}`);
                roadmapData = cachedRoadmap;
                fromCache = true;
            } else {
                console.log(`[ROADMAP] Cache MISS or EXPIRED for topic: ${topic}`);
            }
        } catch (cacheErr) {
            console.warn(`[ROADMAP] Cache check failed, will generate new: ${cacheErr.message}`);
        }
        
        // If not in cache, generate new roadmap
        if (!roadmapData || fromCache === false) {
            console.log(`[ROADMAP] Generating new roadmap for topic: ${topic}`);
            const rawText = await generateRoadmap(topic);

            // Strip any accidental markdown fences
            const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            console.log("Parsed roadmap text:", cleaned);

            roadmapData = JSON.parse(cleaned);
            
            //  Save to Oracle Cloud cache
            try {
                const savedToCache = await saveRoadmapToOracle(topic, roadmapData);
                if (savedToCache) {
                    console.log(`[ROADMAP]  Saved to Oracle cache: ${topic}`);
                }
            } catch (saveErr) {
                console.warn(`[ROADMAP] Failed to save to cache: ${saveErr.message}`);
            }
        }

        // Also save to MongoDB for user-specific tracking
        const dbResp = await roadmapModel.create({ 
            userId: req.body.userId, 
            topic: req.body.topic, 
            roadmap: roadmapData 
        });
        
        resp.json({ 
            success: true, 
            data: dbResp,
            cached: fromCache,
            source: fromCache ? 'oracle_cache' : 'generated'
        });
    } catch (e) {
        console.error(" Roadmap generation error:", e.message);
        resp.status(500).json({ success: false, message: e.message });
    }
})

// GET /roadmap/:topic - Fetch roadmap from cache or generate new
router.get('/:topic', async (req, resp) => {
    try {
        const topic = req.params.topic;
        const userId = req.query.userId;
        const level = req.query.level; // Optional: beginner, intermediate, advanced
        
        console.log(`[ROADMAP GET] Request for topic: ${topic}, level: ${level || 'all'}`);
        
        // First, try to get the MongoDB document to get the _id
        let roadmapDoc = null;
        let fromCache = false;
        let roadmapData = null;
        
        if (userId) {
            try {
                roadmapDoc = await roadmapModel.findOne({ userId, topic }).sort({ createdAt: -1 });
            } catch (err) {
                console.warn("[ROADMAP GET] MongoDB lookup error:", err.message);
            }
        }
        
        //  Try to get from Oracle Cloud cache
        try {
            const cachedRoadmap = await getRoadmapFromOracle(topic, level);
            if (cachedRoadmap) {
                console.log(`[ROADMAP GET]  Cache HIT for: ${topic}`);
                roadmapData = cachedRoadmap;
                fromCache = true;
            }
        } catch (cacheErr) {
            console.warn(`[ROADMAP GET] Cache error: ${cacheErr.message}`);
        }
        
        // If not in cache, generate new roadmap
        if (!roadmapData) {
            console.log(`[ROADMAP GET] Cache MISS - generating new roadmap for: ${topic}`);
            const rawText = await generateRoadmap(topic);
            
            const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            roadmapData = JSON.parse(cleaned);
            
            // Save to Oracle cache
            try {
                await saveRoadmapToOracle(topic, roadmapData);
                console.log(`[ROADMAP GET]  Saved new roadmap to cache`);
            } catch (saveErr) {
                console.warn(`[ROADMAP GET] Cache save failed: ${saveErr.message}`);
            }
            
            // Also save to MongoDB if userId provided
            if (userId && !roadmapDoc) {
                try {
                    roadmapDoc = await roadmapModel.create({ userId, topic, roadmap: roadmapData });
                    console.log(`[ROADMAP GET]  Saved new roadmap to MongoDB`);
                } catch (mongoErr) {
                    console.warn(`[ROADMAP GET] MongoDB save failed: ${mongoErr.message}`);
                }
            }
        }
        
        // Ensure a Mongo roadmap exists for this user even on cache hit
        if (userId && !roadmapDoc && roadmapData) {
            try {
                const cacheFreeRoadmap = { ...roadmapData };
                delete cacheFreeRoadmap._meta;
                roadmapDoc = await roadmapModel.create({ userId, topic, roadmap: cacheFreeRoadmap });
                console.log(`[ROADMAP GET] Saved cached roadmap to MongoDB for user: ${userId}`);
            } catch (mongoErr) {
                console.warn(`[ROADMAP GET] MongoDB create from cache failed: ${mongoErr.message}`);
            }
        }

        // Prefer Mongo roadmap in response to preserve item-level _id/completion state
        const responseData = roadmapDoc?.roadmap
            ? (typeof roadmapDoc.roadmap.toObject === 'function' ? roadmapDoc.roadmap.toObject() : roadmapDoc.roadmap)
            : (() => {
                const fallbackRoadmap = { ...roadmapData };
                delete fallbackRoadmap._meta;
                return fallbackRoadmap;
            })();
        
        resp.json({
            success: true,
            data: {
                _id: roadmapDoc?._id,
                ...responseData
            },
            cached: fromCache,
            source: fromCache ? 'oracle_cache' : 'generated'
        });
    } catch (e) {
        console.error(" Roadmap fetch error:", e.message);
        resp.status(500).json({ success: false, message: e.message });
    }
})

// PATCH /roadmap/update-item - Update a specific item's completion status and quiz score
router.patch('/update-item', async (req, resp) => {
    try {
        const { roadmapId, level, itemId, completed, quizScore } = req.body;
        
        if (!roadmapId || !level || !itemId) {
            return resp.status(400).json({ 
                success: false, 
                message: 'roadmapId, level, and itemId are required' 
            });
        }
        
        // Validate level
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(level)) {
            return resp.status(400).json({ 
                success: false, 
                message: 'Invalid level. Must be beginner, intermediate, or advanced' 
            });
        }
        
        const itemLookup = await getRoadmapItem(roadmapId, level, itemId);
        if (itemLookup.error) {
            return resp.status(itemLookup.error.status).json({
                success: false,
                message: itemLookup.error.message,
            });
        }

        const { roadmap, itemIndex } = itemLookup;

        if (completed === true && (typeof quizScore !== 'number' || quizScore < QUIZ_PASS_PERCENT)) {
            return resp.status(400).json({
                success: false,
                message: `Cannot mark item completed without quizScore >= ${QUIZ_PASS_PERCENT}`,
            });
        }
        
        // Update the item
        if (typeof completed === 'boolean') {
            roadmap.roadmap[level][itemIndex].completed = completed;
        }
        if (typeof quizScore === 'number') {
            roadmap.roadmap[level][itemIndex].quizScore = quizScore;
        }
        
        await roadmap.save();
        
        console.log(`[ROADMAP] Updated item ${itemId} in ${level} - completed: ${completed}, quizScore: ${quizScore}`);
        
        resp.json({
            success: true,
            message: 'Item updated successfully',
            data: {
                itemId,
                level,
                completed: roadmap.roadmap[level][itemIndex].completed,
                quizScore: roadmap.roadmap[level][itemIndex].quizScore
            }
        });
    } catch (e) {
        console.error(" Roadmap update error:", e.message);
        resp.status(500).json({ success: false, message: e.message });
    }
})

router.post('/submit-quiz', async (req, resp) => {
    try {
        const { roadmapId, level, itemId, questions, selectedAnswers } = req.body;

        if (!roadmapId || !level || !itemId) {
            return resp.status(400).json({
                success: false,
                message: 'roadmapId, level, and itemId are required',
            });
        }

        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(level)) {
            return resp.status(400).json({
                success: false,
                message: 'Invalid level. Must be beginner, intermediate, or advanced',
            });
        }

        const normalizedQuestions = sanitizeQuizQuestions(questions);

        if (!selectedAnswers || typeof selectedAnswers !== 'object') {
            return resp.status(400).json({
                success: false,
                message: 'selectedAnswers is required and must be an object',
            });
        }

        let correctCount = 0;

        for (let idx = 0; idx < normalizedQuestions.length; idx++) {
            const selectedRaw = selectedAnswers[idx] ?? selectedAnswers[String(idx)];
            const normalizedSelected = normalizeAnswerIndex(selectedRaw);

            if (normalizedSelected === null) {
                return resp.status(400).json({
                    success: false,
                    message: `Missing or invalid answer for question ${idx + 1}`,
                });
            }

            if (normalizedSelected === normalizedQuestions[idx].correctAnswer) {
                correctCount++;
            }
        }

        const scorePercent = Math.round((correctCount / normalizedQuestions.length) * 100);
        const passed = scorePercent >= QUIZ_PASS_PERCENT;

        const itemLookup = await getRoadmapItem(roadmapId, level, itemId);
        if (itemLookup.error) {
            return resp.status(itemLookup.error.status).json({
                success: false,
                message: itemLookup.error.message,
            });
        }

        const { roadmap, itemIndex } = itemLookup;
        roadmap.roadmap[level][itemIndex].quizScore = scorePercent;
        roadmap.roadmap[level][itemIndex].completed = passed;

        await roadmap.save();

        resp.json({
            success: true,
            data: {
                score: scorePercent,
                passed,
                passThreshold: QUIZ_PASS_PERCENT,
                questionCount: normalizedQuestions.length,
                correctCount,
                item: {
                    itemId,
                    level,
                    completed: roadmap.roadmap[level][itemIndex].completed,
                    quizScore: roadmap.roadmap[level][itemIndex].quizScore,
                },
            },
        });
    } catch (e) {
        console.error(' Quiz submit error:', e.message);
        resp.status(500).json({ success: false, message: e.message });
    }
})

// POST /roadmap/generate-quiz - Generate quiz questions for a roadmap item
router.post('/generate-quiz', async (req, resp) => {
    try {
        const { topic, subTopic } = req.body;
        
        if (!topic || !subTopic) {
            return resp.status(400).json({ 
                success: false, 
                message: 'topic and subTopic are required' 
            });
        }
        
        console.log(`[ROADMAP QUIZ] Generating quiz for: ${subTopic} (topic: ${topic})`);
        
        const prompt = `Generate a ${QUIZ_QUESTION_COUNT}-question multiple-choice quiz about "${subTopic}" in the context of learning ${topic}.

Rules:
1. Each question should have exactly 4 options (A, B, C, D)
    2. Include the correct answer index (0-3) for each question as an integer
3. Difficulty should be appropriate for the learning level
    4. Return exactly ${QUIZ_QUESTION_COUNT} questions
    5. Output must be strict JSON in this exact format:
{
  "questions": [
    {
      "question": "question text here",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": 0
    }
  ]
}
6. DO NOT include any explanations, markdown, or extra text
7. The response MUST be valid JSON only`;
        
        const systemMsg = "You are a quiz generator. Respond with valid JSON only — no markdown, no extra text.";
        
        // Try Cohere first
        let quizData = null;
        try {
            const raw = await callCohere(prompt, systemMsg, 1500);
            quizData = parseCohereJSON(raw);
        } catch (cohereErr) {
            console.warn("[ROADMAP QUIZ] Cohere failed, trying OpenRouter:", cohereErr.message);
            // Fallback to OpenRouter
            const raw = await openrouterFallback(prompt, systemMsg);
            const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
            quizData = JSON.parse(cleaned);
        }
        
        if (!quizData || !quizData.questions) {
            throw new Error('Failed to generate quiz questions');
        }

        const questions = sanitizeQuizQuestions(quizData.questions);
        
        console.log(`[ROADMAP QUIZ] Generated ${questions.length} questions for: ${subTopic}`);
        
        resp.json({
            success: true,
            data: {
                questions,
                passThreshold: QUIZ_PASS_PERCENT,
                questionCount: QUIZ_QUESTION_COUNT,
            }
        });
    } catch (e) {
        console.error(" Quiz generation error:", e.message);
        resp.status(500).json({ success: false, message: e.message });
    }
})

export default router
