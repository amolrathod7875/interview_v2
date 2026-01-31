import { useState } from "react";

const TABS = ["Output", "Errors", "Analysis"];

const OutputPanel = ({ output, analysis, running, analyzing }) => {
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
              ${
                activeTab === tab
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
        {/* Running state */}
        {running && activeTab !== "Analysis" && (
          <div className="text-gray-400 italic">Running code…</div>
        )}

        {analyzing && activeTab === "Analysis" && (
          <div className="text-gray-400 italic">Analyzing solution…</div>
        )}

        {/* Output */}
        {!running && activeTab === "Output" && (
          <div className="whitespace-pre-wrap">
            {output?.output ? (
              output.output
            ) : (
              <span className="text-gray-500">No output</span>
            )}
          </div>
        )}

        {/* Errors */}
        {!running && activeTab === "Errors" && (
          <div className="whitespace-pre-wrap text-red-400">
            {output?.error ? (
              output.error
            ) : (
              <span className="text-gray-500">No errors</span>
            )}
          </div>
        )}

        {/* Analysis */}
        {!analyzing && activeTab === "Analysis" && (
          <div className="space-y-3 font-sans text-sm">
            {!analysis ? (
              <span className="text-gray-500">
                Run analysis to see feedback
              </span>
            ) : analysis.error ? (
              <span className="text-red-400">{analysis.error}</span>
            ) : (
              <>
                {/* Correctness */}
                <div>
                  <span className="font-semibold text-gray-300">
                    Correctness:
                  </span>{" "}
                  <span
                    className={
                      analysis.correct
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {analysis.correct ? "Correct" : "Incorrect"}
                  </span>
                </div>

                {/* Time Complexity */}
                <div>
                  <span className="font-semibold text-gray-300">
                    Time Complexity:
                  </span>{" "}
                  <span className="text-blue-400">
                    {analysis.timeComplexity || "—"}
                  </span>
                </div>

                {/* Space Complexity */}
                <div>
                  <span className="font-semibold text-gray-300">
                    Space Complexity:
                  </span>{" "}
                  <span className="text-blue-400">
                    {analysis.spaceComplexity || "—"}
                  </span>
                </div>

                {/* Improvements */}
                <div>
                  <span className="font-semibold text-gray-300">
                    Improvements:
                  </span>
                  {analysis.improvements?.length ? (
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-300">
                      {analysis.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 mt-1">
                      No improvements suggested
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
