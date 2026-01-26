import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    topic: { type: String, required: true },
    noOfQuestions: {type: Number, required: true, default: 10},
    isCompleted: {type: Boolean, erquired: true}
});

export const quizModel = mongoose.model("Quiz", quizSchema);
