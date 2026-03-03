import { useState } from "react";

const tabs = ["Description", "Examples", "Constraints"];

const ProblemPanel = ({
  problem,
  topics,
  selectedTopic,
  setSelectedTopic,
  difficulty,
  setDifficulty,
  onGenerate,
  loading,
  questionList = [],
  selectedQuestionId = null,
  onSelectQuestion,
  generateLabel = "Generate",
  emptyHint = "",
  hideDetails = false,
  largeTypography = false,
  questionListMaxHeightClass = "max-h-36",
  showSourceBadge = false
}) => {
  const [activeTab, setActiveTab] = useState("Description");

  /* ---------- Header Controls ---------- */
  const HeaderControls = () => (
    <div className="flex gap-2 items-center">
      {/* Topic Selector */}
      <select
        value={selectedTopic || ""}
        onChange={(e) => setSelectedTopic(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="" disabled>
          Select Topic
        </option>
        {topics.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Difficulty Selector */}
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={!selectedTopic || loading}
        className={`px-4 py-1.5 rounded text-sm text-white transition ${
          !selectedTopic || loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Generating..." : generateLabel}
      </button>
    </div>
  );

  const QuestionList = () => {
    if (!selectedTopic || questionList.length === 0) return null;

    return (
      <div className={`mb-3 border rounded p-2 ${questionListMaxHeightClass} overflow-y-auto bg-gray-50`}>
        <p className={`${largeTypography ? "text-sm" : "text-xs"} font-semibold text-gray-600 mb-2`}>Questions</p>
        <div className="space-y-1">
          {questionList.map((q, index) => {
            const isActive = selectedQuestionId === q._id;
            const number = q.questionNumber || index + 1;
            const isGenerated = q.sourceType === "generated";

            return (
              <button
                key={q._id}
                type="button"
                onClick={() => onSelectQuestion?.(q._id)}
                className={`w-full text-left ${largeTypography ? "text-sm" : "text-xs"} px-2 py-1.5 rounded border transition ${
                  isActive
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">Q{number}. {q.title || "Untitled"}</span>
                  <div className="flex items-center gap-2">
                    {showSourceBadge ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isGenerated ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                        {isGenerated ? "Generated" : "Core"}
                      </span>
                    ) : null}
                    {q.solved ? <span className="text-green-600">Solved</span> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ---------- Empty State ---------- */
  if (!problem) {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg border p-4">
        <div className="flex justify-end mb-4">
          <HeaderControls />
        </div>

        <QuestionList />

        <div className="text-gray-500 text-sm leading-relaxed">
          <p className="mb-2">
            Select a <b>topic</b> and <b>difficulty</b> to generate a problem.
          </p>
          <p>
            This helps track your progress and unlock advanced skills.
          </p>
          {emptyHint ? (
            <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              {emptyHint}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  /* ---------- Normal State ---------- */
  return (
    <div className="h-full flex flex-col bg-white rounded-lg border p-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className={`font-semibold ${largeTypography ? "text-xl" : "text-lg"} leading-tight`}>
          {problem.questionNumber ? `Q${problem.questionNumber}. ` : ""}
          {problem.title || "Untitled Problem"}
        </h2>
        <HeaderControls />
      </div>

      <QuestionList />

      {!hideDetails ? (
        <>
          {/* Tabs */}
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

          {/* Content */}
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
        </>
      ) : null}
    </div>
  );
};

export default ProblemPanel;
