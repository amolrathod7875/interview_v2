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
        const level = req.query.level; // Optional: beginner, intermediate, advanced
        
        console.log(`[ROADMAP GET] Request for topic: ${topic}, level: ${level || 'all'}`);
        
        //  Try to get from Oracle Cloud cache
        let roadmapData = null;
        let fromCache = false;
        
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
        }
        
        // Remove metadata from response if present
        const responseData = { ...roadmapData };
        delete responseData._meta;
        
        resp.json({
            success: true,
            data: responseData,
            cached: fromCache,
            source: fromCache ? 'oracle_cache' : 'generated'
        });
    } catch (e) {
        console.error(" Roadmap fetch error:", e.message);
        resp.status(500).json({ success: false, message: e.message });
    }
})

export default router
