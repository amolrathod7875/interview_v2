import { useState } from "react";

const TABS = ["Output", "Errors", "Analysis"];

const OutputPanel = ({ output, analysis, loading }) => {
  const [activeTab, setActiveTab] = useState("Output");

  return (
    <div className="mt-4 bg-[#1e1e1e] rounded-lg border border-gray-700">

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm transition
              ${activeTab === tab
                ? "bg-[#252526] text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 text-sm min-h-[140px] max-h-[240px] overflow-auto text-gray-200 font-mono whitespace-pre-wrap">

        {loading && "Running..."}

        {!loading && activeTab === "Output" && (
          output?.stdout
            ? output.stdout
            : "No output"
        )}

        {!loading && activeTab === "Errors" && (
          output?.stderr
            ? output.stderr
            : "No errors"
        )}

        {!loading && activeTab === "Analysis" && (
          analysis || "Run analysis to see feedback"
        )}

      </div>
    </div>
  );
};

export default OutputPanel;
