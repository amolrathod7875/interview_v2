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
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
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

    // ✅ GitHub connection info
    github: {
      connected: {
        type: Boolean,
        default: false,
      },
      owner: {
        type: String,
        default: "",
      },
      repo: {
        type: String,
        default: "",
      },
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
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("User", userSchema);
