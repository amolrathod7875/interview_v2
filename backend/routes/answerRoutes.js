import e from "express";
import { answerModel } from "../models/answerModel.js";
import { questionModel } from "../models/questionModel.js";
import { callCohere } from '../services/cohere.service.js'
import resultModel from "../models/resultModel.js";

const router = e.Router()

export const getPrompt = (QUESTIONS, ANSWERS) =>
    `You are an expert technical interviewer and evaluator.
You will be given:
1) A list of interview questions, 2) A list of the candidate’s spoken answers (unstructured, conversational, may include filler words, partial explanations, or incomplete sentences)
Your task is to carefully match each answer to the corresponding question, interpret the candidate’s intent even if the wording is informal, and perform a full technical evaluation.

STRICT EVALUATION REQUIREMENTS:
1. Score the candidate out of 100 based on:
   • technical correctness, depth of understanding, clarity of explanation, problem-solving ability, relevance of answers to the questions, communication skills and completeness of answers.
2. Provide clear written feedback covering:
   • overall technical impression
3. Provide a concrete improvement plan:
   • what topics to revise, what concepts are missing, how the candidate can improve interview performance, weather to improve communication skills or not based on words like 'um' 'ah', etc.
5. Be fair but strict. Do not inflate the score.
6. Output the evaluation in the following JSON format ONLY also, remove any characters eg '''json to avoid json.PARSE() errors again it should be a valid json as it can create conflict in server while parsing. 
7. Dont bold any text of output:
{
  "score": number,
  "improvements": [ "item", "item", "item" ],
  "overallAssessment": "final assessment summary"
}
INPUT DATA:
Questions: ${QUESTIONS}
Answers: ${ANSWERS}
`
const getEvaluation = async (interviewId) => {
    try {
        const questionResp = await questionModel.find({ interviewId: interviewId });
        const answerResp = await answerModel.find({ interviewId: interviewId });
        const prompt = getPrompt(questionResp, answerResp);
        const system = 'You are an expert evaluator. Return JSON only in the specified schema.';
        const key = process.env.COHERE_API_KEY_GITHUB_ANALYSIS || process.env.COHERE_API_KEY;
        const cohereResp = await callCohere(prompt, system, 2500, key);
        return { candidates: [{ content: { parts: [{ text: cohereResp }] } }] };
    } catch (e) {
        console.error(e);
    }
}

// router.get('/:interviewId', async (req, resp) => {
//     const questionResp = await questionModel.find({ interviewId: req.params.interviewId });
//     const answerResp = await answerModel.find({ interviewId: req.params.interviewId });
//     const geminiResp = await getEvaluation(req.params.interviewId);
//     const modifiedResponse = JSON.parse(geminiResp.candidates[0].content.parts[0].text);
//     console.log(modifiedResponse, modifiedResponse.score);
//     const response = await resultModel.create({
//         interviewId: req.params.interviewId,
//         score: modifiedResponse.score,
//         feedback: modifiedResponse.feedback,
//         strengths: modifiedResponse.strengths,
//         improvements: modifiedResponse.improvements,
//         overallAssessment: modifiedResponse.overallAssessment
//     })
//     resp.json({ response });
// })

router.post('/add', async (req, resp) => {
    try {
        console.log(req.body);
        const response = await answerModel.create({ interviewId: req.body.interviewId, answers: req.body.answers});
        const geminiResp = await getEvaluation(req.body.interviewId);
        if(!geminiResp.candidates){
            resp.status(500).json({success: false, message: "something went wrong from external api"});
        }
        let rawText = geminiResp.candidates[0].content.parts[0].text.trim();
        // Cohere sometimes wraps JSON in ```json ... ``` fences — strip them
        rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const modifiedResponse = JSON.parse(rawText);
        // console.log(modifiedResponse, modifiedResponse.score);

        const resultResponse = await resultModel.create({
            interviewId: req.body.interviewId,
            score: modifiedResponse.score,
           
            improvements: modifiedResponse.improvements,
            overallAssessment: modifiedResponse.overallAssessment
        })
        resp.json({ success: true, data: response, resultResp: resultResponse });
    }
    catch (e) {
        console.error(e);
        resp.json({ success: false, message: e });
    }
})
export default router;
