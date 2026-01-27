import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    firebaseId: {
      type: String,
      required: true,
      unique: true,        // 🔥 IMPORTANT
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,        // 🔥 IMPORTANT
      lowercase: true,
      index: true,
    },

    photoURL: {
      type: String,
      default: "",
    },

    dob: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    github: {
      type: String,
      default: "",
    },

    leetcode: {
      type: String,
      default: "",
    },

    kaggle: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,     // 🔥 createdAt, updatedAt
  }
);

export default mongoose.model("User", userSchema);
