import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    topic: { type: String, required: true },
    experience: { type: String, required: true },
    skills: { type: [String], required: true },
    isCompleted: {type: Boolean, required: true},
    noOfQuestions: {type: Number, default: 5},
    timeInMinutes: {type: Number, default: 15}
});

export const InterviewModel = mongoose.model("Interview", interviewSchema);
