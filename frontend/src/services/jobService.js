const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/**
 * FETCH ALL JOBS FOR A USER
 */
export const fetchJobs = async (userId) => {
  const res = await fetch(`${BASE_URL}/api/jobs/${userId}`);
  return res.json();
};

/**
 * CREATE JOB
 */
export const addJob = async (job) => {
  const res = await fetch(`${BASE_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });

  return res.json();
};

/**
 * UPDATE JOB STATUS (DRAG & DROP)
 */
export const updateJobStatus = async (id, status) => {
  await fetch(`${BASE_URL}/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
};

/**
 * UPDATE JOB NOTES
 */
export const updateJobNotes = async (id, notes) => {
  await fetch(`${BASE_URL}/api/jobs/${id}/notes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
};

/**
 * DELETE JOB 🗑
 */
export const deleteJob = async (id) => {
  await fetch(`${BASE_URL}/api/jobs/${id}`, {
    method: "DELETE",
  });
};
