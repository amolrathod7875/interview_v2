import mongoose from "mongoose";

const ProblemCounterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    seq: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("ProblemCounter", ProblemCounterSchema);
