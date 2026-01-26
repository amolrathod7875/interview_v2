import { useState, useRef, useEffect } from "react";
import { executeCode, generateProblem, analyzeCode } from "./api";
import ProblemPanel from "./ProblemPanel";
import EditorPanel from "./EditorPanel";
import OutputPanel from "./OutputPanel";

/* ---------- Starter Code Templates ---------- */
const STARTER_CODE = {
  python: `# Write your solution here

def main():
    pass

if __name__ == "__main__":
    main()
`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`,

  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}
`,

  javascript: `// Write your solution here
function main() {

}
main();
`
};

const Codex = () => {
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(STARTER_CODE.python);
  const [output, setOutput] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // Resize state
  const [leftWidth, setLeftWidth] = useState(40);
  const [editorHeight, setEditorHeight] = useState(65);

  const containerRef = useRef(null);

  /* ---------- Update editor when language changes ---------- */
  useEffect(() => {
    setCode(STARTER_CODE[language]);
  }, [language]);

  /* ---------- Generate Problem ---------- */
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const p = await generateProblem();
      setProblem(p);
      setCode(STARTER_CODE[language]);
      setOutput(null);
      setAnalysis("");
    } catch (err) {
      console.error("Generate problem failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Run Code ---------- */
  const handleRun = async () => {
    setLoading(true);
    setOutput(null);

    try {
      const res = await executeCode(language, code);
      setOutput(res.run);
    } catch (err) {
      console.error("Run error:", err);
      setOutput({
        stdout: "",
        stderr: "Execution failed. Check backend or code.",
        output: ""
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Analyze Code ---------- */
  const handleAnalyze = async () => {
    if (!problem) return;

    setLoading(true);
    setAnalysis("");

    try {
      const res = await analyzeCode(problem, code);
      setAnalysis(res);
    } catch (err) {
      console.error("Analyze error:", err);
      setAnalysis("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Resize Handlers ---------- */

  const startHorizontalResize = (e) => {
    e.preventDefault();
    document.onmousemove = (ev) => {
      const percent = (ev.clientX / window.innerWidth) * 100;
      if (percent > 20 && percent < 70) {
        setLeftWidth(percent);
      }
    };
    document.onmouseup = () => {
      document.onmousemove = null;
    };
  };

  const startVerticalResize = (e) => {
    e.preventDefault();
    const containerTop =
      containerRef.current.getBoundingClientRect().top;

    document.onmousemove = (ev) => {
      const percent =
        ((ev.clientY - containerTop) /
          containerRef.current.clientHeight) *
        100;

      if (percent > 40 && percent < 85) {
        setEditorHeight(percent);
      }
    };

    document.onmouseup = () => {
      document.onmousemove = null;
    };
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex bg-[#f8fafc]"
    >
      {/* Left: Problem */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="h-full p-2"
      >
        <ProblemPanel
          problem={problem}
          onGenerate={handleGenerate}
        />
      </div>

      {/* Vertical Divider */}
      <div
        onMouseDown={startHorizontalResize}
        className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-400"
      />

      {/* Right Side */}
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full flex flex-col p-2"
      >
        {/* Editor */}
        <div style={{ height: `${editorHeight}%` }}>
          <EditorPanel
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onRun={handleRun}
            onAnalyze={handleAnalyze}
            loading={loading}
          />
        </div>

        {/* Horizontal Divider */}
        <div
          onMouseDown={startVerticalResize}
          className="h-1 cursor-row-resize bg-gray-300 hover:bg-blue-400"
        />

        {/* Output */}
        <div style={{ height: `${100 - editorHeight}%` }}>
          <OutputPanel
            output={output}
            analysis={analysis}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Codex;
