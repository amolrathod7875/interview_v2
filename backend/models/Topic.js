import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },

    slug: {
      type: String,
      required: true,
      unique: true
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null
    },

    order: {
      type: Number,
      default: 0
    },

    description: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Topic", TopicSchema);
