import { callCohere } from '../services/cohere.service.js'
import e from 'express'
import { questionModel } from '../models/questionModel.js'
import dotenv from 'dotenv'
dotenv.config()

const router = e.Router()


const getPrompt = (post, experience, skills, numQuestions = 9) => {
const questionsList = Array.from({ length: numQuestions }, (_, i) => 
  `  { "qNo": ${i + 1}, "text": "question here?" }`
).join(',\n');

return `
You are an AI interview engine.

Generate exactly ${numQuestions} high-quality technical interview questions for the role of ${post}, for a candidate with ${experience} years of experience and skills in ${skills}.

STRICT OUTPUT RULES — THESE MUST BE FOLLOWED EXACTLY:

1. Output MUST be a valid JSON array.
2. The array MUST contain exactly ${numQuestions} objects.
3. Each object MUST have ONLY these fields:
   - "qNo": number from 1 to ${numQuestions}
   - "text": a single interview question as a string
4. DO NOT include any explanations, comments, markdown, backticks, or additional text.
5. DO NOT wrap the output in code blocks.
6. The response MUST contain JSON ONLY — no other characters before or after.
7. Question should always end with a question mark ignoring grammer.

The JSON must follow this exact format:

[
${questionsList}
]
`;
};


export const generateQuestions = async (topic, experience, skills, interviewId, numQuestions = 9) => {
    try {
        const prompt = getPrompt(topic, experience, skills, numQuestions);
        const system = `You generate exactly ${numQuestions} interview questions as a JSON array. Return JSON only.`;
        const key = process.env.COHERE_API_KEY_QUZ || process.env.COHERE_API_KEY;
        const cohereResp = await callCohere(prompt, system, 1500, key);
        const parsedResponse = JSON.parse(cohereResp);

        for (const r of parsedResponse) {
            await questionModel.create({
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
    } catch (e) {
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
