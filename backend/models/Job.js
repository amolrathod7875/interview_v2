import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  userId: String,
  company: String,
  role: String,
  priority: String,
  status: String,
  notes: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
