import { useState } from "react";

const AddJobForm = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, priority);
    setTitle("");
  };

  return (
    <form
      onSubmit={submit}
      className="flex gap-3 items-center bg-white p-4 rounded-xl border shadow-sm"
    >
      <input
        className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        placeholder="Company - Role (e.g. Google - SDE)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <select
        className="px-3 py-2 border rounded-lg text-sm"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <button
        type="submit"
        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
      >
        Add
      </button>
    </form>
  );
};

export default AddJobForm;
