import Editor from "@monaco-editor/react";

const EditorPanel = ({
  code,
  setCode,
  language,
  setLanguage,
  onRun,
  onAnalyze
}) => {
  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] rounded-lg border">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-[#3c3c3c] text-white text-sm px-3 py-1 rounded outline-none"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRun}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1 rounded"
          >
            Run
          </button>

          <button
            onClick={onAnalyze}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded"
          >
            Analyze
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
            lineNumbers: "on"
          }}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
