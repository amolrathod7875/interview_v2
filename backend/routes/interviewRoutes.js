import e from "express";
import { InterviewModel } from '../models/interviewModel.js'
import { generateQuestions } from "./questionRoute.js";
import resultModel from "../models/resultModel.js"
import { quizModel } from "../models/quizModel.js";
const router = e.Router();

router.post('/add', async (req, resp) => {
    try {
        const response = await InterviewModel.create({
            userId: req.body.userId,
            topic: req.body.topic,
            experience: req.body.experience,
            skills: req.body.skills,
            isCompleted: false
        })
        console.log(response._id);
        const questionResp = await generateQuestions(req.body.topic, req.body.experience, req.body.skills, response._id);
        resp.json({ success: true, data: response, message: "questions saved to database" });
    }
    catch (e) {
        console.error(e);
        resp.json({ success: false, message: e });
    }
})

const getInterviewsByUserId = async (userId) => {
    try {
        const response = await InterviewModel.find({ userId: userId });
        return response;
    }
    catch (e) {
        console.error(e);
        return e.message;
    }
}
router.get('/getAll/:userId', async (req, resp) => {
    try {
        resp.json({ success: true, data: await getInterviewsByUserId(req.params.userId)});
    }
    catch (e) {
        console.error(e);
        resp.json({ success: false, message: e.message });
    }
})

router.get('/getInterviewsForDashboard/:userId', async (req, resp) => {
    try {
        const response = await getInterviewsByUserId(req.params.userId);
        // console.log(response);
        const quizResp = await quizModel.find({userId: req.params.userId})
        let score = 0;
        let count = 0;
        for(const interview of response){
            const resResp = await resultModel.findOne({interviewId: interview._id});
            if(resResp !== null){
                count++;
                score+=resResp.score;
            }
            // console.log("result: ", resResp);
        }
        resp.json({success: true, data: response, avgScore: score/count, quizResp: quizResp})
    } catch (e) {
        resp.json({success: false, message: e.message});
    }
})
router.put('/update/:interviewId', async (req, resp) => {
    try {
        const result = await InterviewModel.updateOne(
            { _id: req.params.interviewId },
            { $set: { isCompleted: true } }
        )

        if (result.matchedCount === 0) {
            return resp.status(404).json({ success: false, message: "Interview not found" })
        }

        resp.json({ success: true, data: result })

    } catch (e) {
        resp.status(500).json({ success: false, message: e.message })
    }
})


router.get('/getById/:interviewId', async (req, resp) => {
    try {
        resp.json({ success: true, data: await InterviewModel.findById(req.params.interviewId) });
    }
    catch (e) {
        resp.json({ success: false, message: e });
    }
})

export default router;

