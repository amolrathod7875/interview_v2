import { Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { updateJobNotes, deleteJob } from "@/services/jobService";
import { Trash2 } from "lucide-react";

const priorityStyles = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const Card = ({ job, index, onNotesSave, onDelete }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(job.notes || "");
  const [saving, setSaving] = useState(false);

  // ---------------- SAVE NOTES ----------------
  const handleSave = async () => {
    try {
      setSaving(true);

      // 1️⃣ Save to backend
      await updateJobNotes(job.id, draftNotes);

      // 2️⃣ Update Board state
      if (onNotesSave) {
        onNotesSave(job.id, draftNotes);
      }

      setShowNotes(false);
    } catch (err) {
      console.error("Failed to save notes", err);
      alert("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };
  // -------------------------------------------

  // ---------------- DELETE JOB ----------------
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job?"
    );
    if (!confirmDelete) return;

    try {
      await deleteJob(job.id);

      // 🔥 Update Board state instantly
      if (onDelete) {
        onDelete(job.id);
      }
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job");
    }
  };
  // -------------------------------------------

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-lg bg-white p-4 border shadow-sm transition-all
          ${snapshot.isDragging ? "shadow-lg ring-2 ring-blue-200" : ""}`}
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-800">{job.company}</h4>
              <p className="text-sm text-gray-500">{job.role || "—"}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${priorityStyles[job.priority]}`}
              >
                {job.priority}
              </span>

              {/* 🗑 Delete */}
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-600"
                title="Delete job"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Notes Preview */}
          {job.notes && !showNotes && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              📝 {job.notes}
            </p>
          )}

          {/* Notes Editor */}
          {showNotes && (
            <textarea
              className="mt-3 w-full border rounded-md p-2 text-sm"
              rows={3}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
            />
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-3 text-sm">
            {!showNotes ? (
              <button
                onClick={() => setShowNotes(true)}
                className="text-blue-600"
              >
                Add Notes
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-green-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => {
                    setShowNotes(false);
                    setDraftNotes(job.notes || "");
                  }}
                  className="text-gray-500"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Card;
