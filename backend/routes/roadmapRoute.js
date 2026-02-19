import e from "express";
const router = e.Router()
import OpenAI from "openai";
import roadmapModel from '../models/roadmapModel.js'
import { getRoadmap, saveRoadmap } from '../config/oracleStorage.js'
import { generateTopicKey } from '../utils/roadmapUtils.js'

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
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    try {
        const openaiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });
        console.log("OpenAI Response:", JSON.stringify(openaiResponse, null, 2));
        return openaiResponse
    } catch (error) {
        console.error("OpenAI API Error:", error);
        throw error;
    }
}

router.post('/add', async (req, resp) => {
    try {
        const topic = req.body.topic;
        const topicKey = generateTopicKey(topic);
        const userId = req.body.userId;
        
        // Step 1: Check Oracle bucket for global cached roadmap
        let cachedRoadmap = null;
        try {
            cachedRoadmap = await getRoadmap(topicKey);
            console.log(`[Roadmap] Cache check for '${topicKey}': ${cachedRoadmap ? 'HIT' : 'MISS'}`);
        } catch (error) {
            console.warn('[Roadmap] Oracle bucket check failed, falling back to LLM:', error.message);
        }
        
        let modifiedResponse;
        
        if (cachedRoadmap) {
            // Cache hit - use cached roadmap
            modifiedResponse = cachedRoadmap;
            console.log(`[Roadmap] Using cached roadmap for topic: ${topic}`);
        } else {
            // Cache miss - generate via LLM
            console.log(`[Roadmap] Generating new roadmap for topic: ${topic}`);
            const roadmap = await generateRoadmap(topic);
            
            console.log("Roadmap response structure:", JSON.stringify(roadmap, null, 2));
            
            if (!roadmap || !roadmap.choices || !roadmap.choices[0]) {
                console.error("Invalid roadmap response:", roadmap);
                return resp.status(500).json({ success: false, message: "something went wrong from external api" });
            }
            
            const rawText = roadmap.choices[0].message.content;
            console.log("Raw text from OpenAI:", rawText);
            
            const parsed = rawText.replace("```json", "").replace("```", "");
            console.log(parsed);
            modifiedResponse = JSON.parse(parsed);
            
            // Save to Oracle bucket for future requests
            try {
                await saveRoadmap(topicKey, modifiedResponse);
                console.log(`[Roadmap] Saved roadmap to Oracle bucket: ${topicKey}`);
            } catch (error) {
                console.warn('[Roadmap] Failed to save to Oracle bucket:', error.message);
                // Continue - don't block user response
            }
        }
        
        // Always save to MongoDB for user progress tracking
        const dbResp = await roadmapModel.create({
            userId: userId,
            topic: topic,
            roadmap: modifiedResponse
        });
        
        resp.json({ 
            success: true, 
            data: dbResp,
            cached: !!cachedRoadmap
        });
        
    } catch (e) {
        resp.status(500).json({ success: false, message: e.message });
    }
})

export default router