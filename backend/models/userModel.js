import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    firebaseId: {type: String, required: true},
    email: {type: String, required: true},
    dob: {type: String, required: false},
    linkedin: {type: String, required: false},
    github: {type: String, required: false},
    leetcode: {type: String, required: false},
})

export const userModel = mongoose.model("User", userSchema); 