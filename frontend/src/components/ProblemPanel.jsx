import { useState } from "react";

const tabs = ["Description", "Examples", "Constraints"];

const ProblemPanel = ({ problem, onGenerate }) => {
  const [activeTab, setActiveTab] = useState("Description");

  /* ---------- Empty State ---------- */
  if (!problem) {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg border p-4">
        <button
          onClick={onGenerate}
          className="self-end mb-3 px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          New Problem
        </button>
        <div className="text-gray-500 text-sm">
          Click <b>New Problem</b> to generate a coding question.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border p-4 overflow-hidden">
      {/* ---------- Header ---------- */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg leading-tight">
          {problem.title || "Untitled Problem"}
        </h2>
        <button
          onClick={onGenerate}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          New Problem
        </button>
      </div>

      {/* ---------- Tabs ---------- */}
      <div className="flex gap-5 border-b mb-3 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 transition ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---------- Content ---------- */}
      <div className="flex-1 overflow-y-auto text-sm whitespace-pre-wrap leading-relaxed pr-1">
        {activeTab === "Description" && (
          <>
            <p className="mb-4">
              {problem.description || "No description provided."}
            </p>

            <h4 className="font-semibold mb-1">Input</h4>
            <p className="mb-4">
              {problem.input || "No input description."}
            </p>

            <h4 className="font-semibold mb-1">Output</h4>
            <p>
              {problem.output || "No output description."}
            </p>
          </>
        )}

        {activeTab === "Examples" && (
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
            {problem.examples || "No examples provided."}
          </pre>
        )}

        {activeTab === "Constraints" && (
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
            {problem.constraints || "No constraints provided."}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ProblemPanel;
