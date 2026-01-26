import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // ✅ Import this

const TABS = ["Output", "Errors", "Analysis"];

const OutputPanel = ({ output, analysis, loading }) => {
  const [activeTab, setActiveTab] = useState("Output");

  return (
    <div className="mt-4 bg-[#1e1e1e] rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 shrink-0">
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
      <div className="p-4 text-sm flex-1 overflow-auto text-gray-200 font-mono">
        {loading && <div className="text-gray-400 italic">Running...</div>}

        {!loading && activeTab === "Output" && (
          <div className="whitespace-pre-wrap">
            {output?.stdout ? output.stdout : <span className="text-gray-500">No output</span>}
          </div>
        )}

        {!loading && activeTab === "Errors" && (
          <div className="whitespace-pre-wrap text-red-400">
            {output?.stderr ? output.stderr : <span className="text-gray-500">No errors</span>}
          </div>
        )}

        {!loading && activeTab === "Analysis" && (
          <div className="markdown-body">
            {analysis ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]} // ✅ Enable tables
                components={{
                  // Text styling
                  strong: ({ node, ...props }) => <span className="font-bold text-blue-400" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  code: ({ node, ...props }) => <code className="bg-gray-700 px-1 py-0.5 rounded text-xs text-yellow-300" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                  
                  // ✅ Table styling for Dark Mode
                  table: ({ node, ...props }) => <table className="w-full text-left border-collapse my-4" {...props} />,
                  thead: ({ node, ...props }) => <thead className="bg-[#2d2d2d] text-gray-300" {...props} />,
                  th: ({ node, ...props }) => <th className="border border-gray-600 px-3 py-2 font-semibold" {...props} />,
                  td: ({ node, ...props }) => <td className="border border-gray-600 px-3 py-2" {...props} />,
                }}
              >
                {analysis}
              </ReactMarkdown>
            ) : (
              <span className="text-gray-500">Run analysis to see feedback</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;