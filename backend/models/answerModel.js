import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    interviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interview',
        required: true
    },
    answers: {
        type: [String],
        required: true
    }
});

export const answerModel = mongoose.model("answers", answerSchema);
