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
      className="flex gap-3 items-center bg-card p-4 rounded-xl border border-border shadow-sm"
    >
      <input
        className="flex-1 bg-background text-foreground px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="Company - Role (e.g. Google - SDE)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <select
        className="px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <button
        type="submit"
        className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:brightness-90 transition"
      >
        Add
      </button>
    </form>
  );
};

export default AddJobForm;
