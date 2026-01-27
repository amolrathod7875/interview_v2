import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  userId: String,
  company: String,
  role: String,
  priority: String,
  status: String,
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
