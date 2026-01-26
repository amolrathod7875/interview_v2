import mongoose from "mongoose";
const quizQuestionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    text: { type: String, required: true },
    options: {type: [String], required: true},
    correctOption: {type: String, required: true}
})
export const quizQuestionModel = mongoose.model("quiz_questions", quizQuestionSchema);