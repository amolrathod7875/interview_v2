import express from "express";
import { v4 as uuid } from "uuid";
import Job from "../models/Job.js";

const router = express.Router();

/**
 * CREATE JOB
 */
router.post("/", async (req, res) => {
  const { userId, company, role, priority } = req.body;

  if (!userId || !company) {
    return res.status(400).json({
      error: "userId and company are required",
    });
  }

  try {
    const job = new Job({
      userId,
      company,
      role: role || "",
      priority: priority || "Medium",
      status: "Applied",
      notes: "",
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

/**
 * GET JOBS BY USER
 */
router.get("/:userId", async (req, res) => {
  try {
    const userJobs = await Job.find({ userId: req.params.userId });
    res.json(userJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

/**
 * UPDATE JOB STATUS (Drag & Drop)
 */
router.put("/:id", async (req, res) => {
  const { status } = req.body;

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    job.status = status;
    await job.save();
    res.json(job);
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ error: "Failed to update job status" });
  }
});

/**
 * UPDATE JOB NOTES
 */
router.put("/:id/notes", async (req, res) => {
  const { notes } = req.body;

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    job.notes = notes || "";
    await job.save();
    res.json(job);
  } catch (error) {
    console.error("Error updating job notes:", error);
    res.status(500).json({ error: "Failed to update job notes" });
  }
});

/**
 * DELETE JOB 
 */
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

export default router;
