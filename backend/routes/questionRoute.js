import { GoogleGenAI } from '@google/genai'
import e from 'express'
import { questionModel } from '../models/questionModel.js'
import dotenv from 'dotenv'
dotenv.config()

const router = e.Router()


const getPrompt = (post, experience, skills) => 
`
You are an AI interview engine.

Generate exactly 9 high-quality technical interview questions for the role of ${post}, for a candidate with ${experience} years of experience and skills in ${skills}.

STRICT OUTPUT RULES — THESE MUST BE FOLLOWED EXACTLY:

1. Output MUST be a valid JSON array.
2. The array MUST contain exactly 9 objects.
3. Each object MUST have ONLY these fields:
   - "qNo": number from 1 to 9
   - "text": a single interview question as a string
4. DO NOT include any explanations, comments, markdown, backticks, or additional text.
5. DO NOT wrap the output in code blocks.
6. The response MUST contain JSON ONLY — no other characters before or after.
7. Question should always end with a question mark ignoring grammer.

The JSON must follow this exact format:

[
  { "qNo": 1, "text": "question here?" },
  { "qNo": 2, "text": "question here?" },
  { "qNo": 3, "text": "question here?" },
  { "qNo": 4, "text": "question here?" },
  { "qNo": 5, "text": "question here?" },
  { "qNo": 6, "text": "question here?" },
  { "qNo": 7, "text": "question here?" },
  { "qNo": 8, "text": "question here?" },
  { "qNo": 9, "text": "question here?" }
]
`;


export const generateQuestions = async (topic, experience, skills, interviewId) => {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        })
        const prompt = getPrompt(topic, experience, skills);
        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });
        const modifiedResp = geminiResponse.candidates[0].content.parts[0].text;
        const parsedResponse = JSON.parse(modifiedResp);

        for (const r of parsedResponse) {
            questionModel.create({
                interviewId: interviewId,
                text: r.text,
                qNo: r.qNo,
                postOfInterview: topic
            })
        }
        
        return { 
            success: "true",
            message: "added to database successfully"
        }
    }
    catch (e) {
        console.log(e);
        return { message: e }
    }
}

router.get('/:interviewId/:qNo', async (req, resp) => {
    try {
        const response = await questionModel.findOne({qNo: req.params.qNo, interviewId: req.params.interviewId})
        // console.log(resp);
        resp.json({success: true, data: response})
    } catch (e) {
        console.log(e);
        resp.json({success: false, message: e})
    }
})


router.get('/:interviewId', async (req, resp) => {
    try {
        const response = await questionModel.find({interviewId: req.params.interviewId})
        console.log(response);
        resp.json({success: true, data: response}) 
    } catch (e) {
        console.log(e);
        resp.json({success: false, message: e})
    }
})

export default router 