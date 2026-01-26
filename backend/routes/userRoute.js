import e from "express";
import { userModel } from "../models/userModel.js";
const router = e.Router()

router.post('/add', async (req, resp) => {
    try {
        const response = await userModel.insertOne({ name: req.body.name, email: req.body.email, firebaseId: req.body.firebaseId });
        resp.json({ success: true, data: response });
    } catch (e) {
        resp.json({ success: false, Message: e.message });
    }
})
router.get('/get/:uid', async (req, resp) => {
    try {
        const response = await userModel.findOne({ firebaseId: req.params.uid });
        // console.log(resp)
        if (response == null) {
            return resp.status(404).json({ success: false, message: "user not found" })
        }
        resp.json({ success: true, data: response });
    } catch (e) {
        resp.json({ success: false, message: e.message });
    }
})

router.put('/update', async (req, resp) => {
    try {
        const response = await userModel.updateOne({ firebaseId: req.body.userId }, {
             name: req.body.name ,
             dob: req.body.dob,
             linkedin: req.body.linkedin,
             github: req.body.github,
             leetcode: req.body.leetcode,     
            });

        if (response.matchedCount === 0) {
            return resp.status(404).json({ success: false, message: "User not found" })
        }

        resp.json({ success: true, data: response });
    } catch (e) {
        return resp.status(500).json({ success: false, message: "user not found" })
    }
})

export default router;