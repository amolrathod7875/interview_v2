import mongoose from "mongoose";

const quizAnswerSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'quiz_questions',
        required: true
    },
    answer: {
        type: String,
        required: false
    }
});

export const quizAnswerModel = mongoose.model("quiz_answers", quizAnswerSchema);
