import resultModel from "../models/resultModel.js"
import express from "express"
import { OpenRouter } from '@openrouter/sdk';
import { questionModel } from "../models/questionModel.js";
import { answerModel } from "../models/answerModel.js";
import { getPrompt } from "./answerRoutes.js";
// import { startCountingUnrecognized } from "@openrouter/sdk/types/unrecognized.js";

const router = express.Router()

const evaluateUsingOpenRouter = async (questions, answers) => {
  const prompt = getPrompt(questions, answers);

  const openRouter = new OpenRouter({
    apiKey: process.env.OPEN_ROUTER_API_KEY
  });

  const stream = await openRouter.chat.send({
    model: "allenai/molmo-2-8b:free",
    messages: [
      {
        "role": "user",
        "content": prompt
      }
    ],
    stream: true
  });
  let finalText = "";

  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content;
    if (token) finalText += token;
  }

  let parsed;

  try {
    const cleaned = finalText
      .trim()
      .replace(/^```json/, "")
      .replace(/```$/, "");

    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("AI returned invalid JSON: " + finalText);
  }
  return parsed;
}
export const addResult = async (interviewId, evaluation) => {
  if (!interviewId) throw new Error("Missing interviewId")

  const payload = {
    interviewId,
    score: evaluation.score,
    feedback: evaluation.feedback,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    overallAssessment: evaluation.overallAssessment
  }

  return await resultModel.create(payload)
}

router.get("/getByInterviewId/:interviewId", async (req, res) => {
  try {
    const result = await resultModel.findOne({ interviewId: req.params.interviewId })

    if (!result) {
      return res.status(404).json({ success: false, message: "Result not found" })
    }

    res.json({ success: true, data: result })

  } catch (e) {
    console.error(e)
    res.status(500).json({ success: false, message: e.message })
  }
})

router.get('/generateAfterFailure/:interviewId', async (req, resp) => {
  try {
    const questions = await questionModel.find({ interviewId: req.params.interviewId })
    if (!questions) {
      resp.status(404).json({ success: false, message: "something not found" });
    }
    const answers = await answerModel.find({ interviewId: req.params.interviewId })

    if (!answers) {
      resp.status(404).json({ success: false, message: "something not found" });
    }

    const res = await evaluateUsingOpenRouter(questions, answers);
    console.log(res)
    const resultResponse = await resultModel.create({
      interviewId: req.params.interviewId,
      score: res.score,

      improvements: res.improvements,
      overallAssessment: res.overallAssessment
    })

    resp.json({ success: true, data: resultResponse });
  }
  catch (e) {
    resp.json({ success: false, message: e.message });
  }
})

export default router
