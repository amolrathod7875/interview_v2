import Editor from "@monaco-editor/react";

const EditorPanel = ({
  code,
  setCode,
  language,
  setLanguage,
  onRun,
  onAnalyze,
  onAiValidate,
  running,
  analyzing,
  aiValidating
}) => {
  const busy = running || analyzing || aiValidating;

  return (
    <div className="h-full flex flex-col bg-[#14171f] rounded-xl border border-[#2a2f3a] overflow-hidden">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1f2b] border-b border-[#2a2f3a]">
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={busy}
          className="bg-[#2a3040] text-white text-sm px-3 py-1.5 rounded-md outline-none disabled:opacity-60 border border-[#394154]"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onRun}
            disabled={busy}
            className={`text-white text-sm px-4 py-1.5 rounded-md transition ${
              busy
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {running ? "Running…" : "Run"}
          </button>

          <button
            onClick={onAnalyze}
            disabled={busy}
            className={`text-white text-sm px-4 py-1.5 rounded-md transition ${
              busy
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>

          <button
            onClick={onAiValidate}
            disabled={busy || !onAiValidate}
            className={`text-white text-sm px-4 py-1.5 rounded-md transition ${
              busy || !onAiValidate
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {aiValidating ? "AI Testing…" : "AI Validate"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            lineNumbers: "on",
            readOnly: busy
          }}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
