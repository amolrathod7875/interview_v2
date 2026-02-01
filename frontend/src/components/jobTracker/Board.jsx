import { useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "./Column";
import AddJobForm from "./AddJobForm";
import {
  fetchJobs,
  addJob,
  updateJobStatus,
} from "../../services/jobService";
import { useAuth } from "../../contexts/AuthContext";

const COLUMNS = ["Applied", "Interview", "Offer", "Rejected"];

const Board = () => {
  const { user } = useAuth();
  const userId = user?.uid || "demo-user";

  const [data, setData] = useState({
    Applied: [],
    Interview: [],
    Offer: [],
    Rejected: [],
  });

  // ---------------- LOAD JOBS ----------------
  const loadJobs = async () => {
    const jobs = await fetchJobs(userId);

    const grouped = {
      Applied: [],
      Interview: [],
      Offer: [],
      Rejected: [],
    };

    jobs.forEach((job) => {
      // Normalize MongoDB _id to id
      const normalizedJob = {
        ...job,
        id: job.id || job._id
      };
      grouped[normalizedJob.status].push(normalizedJob);
    });

    setData(grouped);
  };

  useEffect(() => {
    loadJobs();
  }, []);
  // ------------------------------------------

  // ---------------- ADD JOB ----------------
  const handleAdd = async (title, priority) => {
    const [company, role] = title.split("-");

    await addJob({
      userId,
      company: company?.trim(),
      role: role?.trim() || "",
      priority,
    });

    loadJobs();
  };
  // ------------------------------------------

  // ---------------- UPDATE NOTES LOCALLY ----------------
  const updateNotesLocally = (jobId, notes) => {
    const updated = {};

    Object.keys(data).forEach((col) => {
      updated[col] = data[col].map((job) => {
        const currentId = String(job.id || job._id);
        return currentId === String(jobId) ? { ...job, notes } : job;
      });
    });

    setData(updated);
  };
  // -----------------------------------------------------

  // ---------------- DELETE JOB LOCALLY ----------------
  const deleteJobLocally = (jobId) => {
    const updated = {};

    Object.keys(data).forEach((col) => {
      updated[col] = data[col].filter((job) => {
        const currentId = String(job.id || job._id);
        return currentId !== String(jobId);
      });
    });

    setData(updated);
  };
  // ----------------------------------------------------

  // ---------------- DRAG & DROP ----------------
  const onDragEnd = async ({ source, destination }) => {
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    if (
      sourceCol === destCol &&
      source.index === destination.index
    ) {
      return;
    }

    const job = data[sourceCol][source.index];

    // Optimistic UI update (preserves notes)
    const newSource = Array.from(data[sourceCol]);
    newSource.splice(source.index, 1);

    const newDest = Array.from(data[destCol]);
    newDest.splice(destination.index, 0, {
      ...job,
      status: destCol,
    });

    setData({
      ...data,
      [sourceCol]: newSource,
      [destCol]: newDest,
    });

    // Persist status
    try {
      await updateJobStatus(job.id, destCol);
    } catch (err) {
      console.error("Failed to update job status", err);
    }
  };
  // -----------------------------------------------------

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-6">Job Tracker</h1>

      <AddJobForm onAdd={handleAdd} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-row gap-6 mt-6 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col}
              title={col}
              jobs={data[col]}
              onNotesSave={updateNotesLocally}
              onDelete={deleteJobLocally} // 🗑 DELETE SUPPORT
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Board;
