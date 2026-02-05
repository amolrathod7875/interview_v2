import e from "express";
const router = e.Router()
import { GoogleGenAI } from "@google/genai";
import roadmapModel from '../models/roadmapModel.js'

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
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    })

    const model = ai.models.get("gemini-2.0-flash-lite");
    const geminiResponse = await model.generateContent(prompt);
    console.log(geminiResponse);
    return geminiResponse
}

router.post('/add', async (req, resp) => {
    try {
        const topic = req.body.topic;
        const roadmap = await generateRoadmap(topic);
        if (!roadmap.candidates) {
            resp.status(500).json({ success: false, message: "something went wrong from external api" });
        }
        console.log(roadmap.candidates[0].content.parts[0].text)
        const parsed = roadmap.candidates[0].content.parts[0].text.replace("```json", "").replace("```", "")
        console.log(parsed)
        const modifiedResponse = JSON.parse(parsed);
        const dbResp = await roadmapModel.create({userId: req.body.userId, topic: req.body.topic, roadmap: modifiedResponse});
        resp.json({ success: true, data: dbResp })
    } catch (e) {
        resp.status(500).json({ success: false, message: e.message });
    }
})

export default router