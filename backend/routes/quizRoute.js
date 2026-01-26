import e from 'express'
import { quizModel } from '../models/quizModel.js';
const router = e.Router()

import dotenv from 'dotenv'
import { quizQuestionModel } from '../models/quizQuestionModel.js';
import { GoogleGenAI } from '@google/genai';
import { quizAnswerModel } from '../models/quizAnswerModel.js';
import resultModel from '../models/resultModel.js';
import { quizResultModel } from '../models/quizResultModel.js';
dotenv.config()

const getPrompt = (topic, noOfQuestions) => {
    return `You are a quiz generator, your task is to generate questions for quiz which includes topic and noOfQuestions to generate.
    Rules: 
    1.Each question should be MCQ having 4 options out of which one should be correct, 2.Difficulty level of questions should be intermediate, 3.Output should be json object containing exact format{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string"
    }
  ]
}
    5.Important! output must be a valid json and muset be able parse using JSON.parse() , 6.DO NOT include any explanations, comments, markdown, backticks, or additional text, 7.DO NOT wrap the output in code blocks, 8.The response MUST contain JSON ONLY — no other characters before or after
    contents: topic: ${topic}, numberOfQuestions: ${noOfQuestions}`
}

export const generateQuestions = async (topic, noOfQuestions) => {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        })
        // console.log(process.env.GEMINI_API_KEY)
        const prompt = getPrompt(topic, noOfQuestions);
        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const modifiedResp = geminiResponse.candidates[0].content.parts[0].text;
        const parsedResponse = JSON.parse(modifiedResp);
        return parsedResponse;
    }
    catch (e) {
        console.log(e.message)
    }

}

router.post('/add', async (req, resp) => {
    try {
        const response = await quizModel.create({ userId: req.body.userId, topic: req.body.topic, noOfQuestions: req.body.noOfQuestions, isCompleted: false });
        const geminiResp = await generateQuestions(req.body.topic, req.body.noOfQuestions);
        for (const question of geminiResp.questions) {
            await quizQuestionModel.create({
                quizId: response._id,
                text: question.question,
                options: question.options,
                correctOption: question.correct_answer
            });
        }
        resp.json({ success: true, data: response, geminiData: geminiResp });
    }
    catch (e) {
        resp.json({ success: false, message: e.message });
    }
})

router.get('/questions/getAll/:quizId', async (req, resp) => {
    try {
        resp.json({ success: true, data: await quizQuestionModel.find({ quizId: req.params.quizId }) });
    } catch (e) {
        resp.json({ success: false, message: e.message });
    }
})

router.post('/answers/add', async (req, resp) => {
    try {
        const questionIds = req.body.answers.map(a => a.questionId);

        const questions = await quizQuestionModel.find({
            _id: { $in: questionIds }
        });

        const questionMap = {};
        for (const q of questions) {
            questionMap[q._id.toString()] = q.correctOption;
        }

        let score = 0;
        const answerDocs = [];

        for (const a of req.body.answers) {
            const correct = questionMap[a.questionId];

            const submitted = a.answer.trim().toLowerCase();
            const expected = correct.trim().toLowerCase();

            if (submitted === expected) score++;

            answerDocs.push({
                quizId: a.quizId,
                questionId: a.questionId,
                answer: a.answer,
                interviewId: req.body.interviewId
            });
        }
        await quizAnswerModel.insertMany(answerDocs);
        await quizResultModel.insertOne({ quizId: questions[0].quizId.toString(), score: score });
        resp.json({ success: true, score: score });
    } catch (e) {
        resp.json({ success: false, message: e.message });
    }
})

router.get('/results/:quizId', async (req, resp) => {
    try {
        resp.json(await quizResultModel.findOne({ quizId: req.params.quizId }))
    } catch (e) {
        resp.json({ success: false, message: e.message });
    }
})

router.get('/findByIsCompleted/:userId', async (req, resp) => {
    try {
        resp.json(await quizModel.find({ userId: req.params.userId, isCompleted: false }));
    } catch (e) {
        resp.json({ success: false, message: e.message });
    }
})

router.put('/update/:quizId', async (req, res) => {
    try {
        const updated = await quizModel.updateOne(
            { _id: req.params.quizId },
            { $set: { isCompleted: true } }
        )

        res.json({ success: true, result: updated })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})


export default router;