import express from "express";
import { userModel } from "../models/userModel.js";

const router = express.Router();

// 1. ADD USER
router.post('/add', async (req, resp) => {
    try {
        // FIX: Used .create() instead of .insertOne()
        const response = await userModel.create({
            name: req.body.name,
            email: req.body.email,
            firebaseId: req.body.firebaseId
        });
        resp.json({ success: true, data: response });
    } catch (e) {
        console.error("Error in /add:", e.message);
        resp.status(500).json({ success: false, Message: e.message });
    }
})

// 2. GET USER
router.get('/get/:uid', async (req, resp) => {
    try {
        const response = await userModel.findOne({ firebaseId: req.params.uid });
        
        if (response == null) {
            return resp.status(404).json({ success: false, message: "user not found" })
        }
        resp.json({ success: true, data: response });
    } catch (e) {
        console.error("Error in /get:", e.message);
        resp.status(500).json({ success: false, message: e.message });
    }
})

// 3. UPDATE USER
router.put('/update', async (req, resp) => {
    try {
        // FIX: Wrapped fields in $set to strictly update only these values
        const response = await userModel.updateOne(
            { firebaseId: req.body.userId },
            {
                $set: {
                    name: req.body.name,
                    dob: req.body.dob,
                    linkedin: req.body.linkedin,
                    github: req.body.github,
                    leetcode: req.body.leetcode,
                }
            }
        );

        if (response.matchedCount === 0) {
            return resp.status(404).json({ success: false, message: "User not found" })
        }

        resp.json({ success: true, data: response });
    } catch (e) {
        console.error("Error in /update:", e.message);
        return resp.status(500).json({ success: false, message: e.message })
    }
})

export default router;