import express from "express";
import { v4 as uuid } from "uuid";

const router = express.Router();

// TEMP IN-MEMORY STORE (SAFE FOR NOW)
let jobs = [];

/**
 * CREATE JOB
 */
router.post("/", (req, res) => {
  const { userId, company, role, priority } = req.body;

  if (!userId || !company) {
    return res.status(400).json({
      error: "userId and company are required",
    });
  }

  const job = {
    id: uuid(),
    userId,
    company,
    role: role || "",
    priority: priority || "Medium",
    status: "Applied",
    notes: "",
    createdAt: new Date().toISOString(),
  };

  jobs.push(job);
  res.status(201).json(job);
});

/**
 * GET JOBS BY USER
 */
router.get("/:userId", (req, res) => {
  const userJobs = jobs.filter(
    (job) => job.userId === req.params.userId
  );
  res.json(userJobs);
});

/**
 * UPDATE JOB STATUS (Drag & Drop)
 */
router.put("/:id", (req, res) => {
  const { status } = req.body;

  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  job.status = status;
  res.json(job);
});

/**
 * UPDATE JOB NOTES
 */
router.put("/:id/notes", (req, res) => {
  const { notes } = req.body;

  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  job.notes = notes || "";
  res.json(job);
});

/**
 * DELETE JOB 🗑
 */
router.delete("/:id", (req, res) => {
  const index = jobs.findIndex(
    (job) => job.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({ error: "Job not found" });
  }

  jobs.splice(index, 1);
  res.json({ success: true });
});

export default router;
