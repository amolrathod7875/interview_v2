import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  fetchCoreProblem, 
  fetchTopics,
  submitCoreSolution,
  generateProblem,
  executeCode,
  analyzeCode
} from "../api";
import useUserStatsStore from "../../store/useUserStatsStore";
import ProblemPanel from "../ProblemPanel";
import EditorPanel from "../EditorPanel";
import OutputPanel from "../OutputPanel";
import LoadingWave from "../ui/LoadingWave";

/* ---------- Fallback Starter Code ---------- */
const FALLBACK_CODE = {
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

const CodexWorkspace = ({ type }) => {  // type: "core" | "sandbox"
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { incrementSolved, updateDailyActivity } = useUserStatsStore();
  
  /* ---------------- State ---------------- */
  const [problem, setProblem] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(FALLBACK_CODE.python);
  
  const [output, setOutput] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  /* ---------------- Layout State ---------------- */
  const [leftWidth, setLeftWidth] = useState(40);
  const [editorHeight, setEditorHeight] = useState(65);
  const containerRef = useRef(null);

  /* ---------------- Load Data ---------------- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load topics
        const topicsData = await fetchTopics();
        setTopics(topicsData);
        
        // Load problem based on type
        if (type === "core") {
          const problemData = await fetchCoreProblem(problemId);
          setProblem(problemData);
        } else {
          // For sandbox, problemId is the Problem _id
          // Need to fetch the problem differently - for now use the existing API
          const problemData = await fetchCoreProblem(problemId);
          setProblem(problemData);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (problemId) {
      loadData();
    }
  }, [problemId, type]);

  /* ---------------- Update code on language OR problem change ---------------- */
  useEffect(() => {
    if (problem?.starterCode?.[language]) {
      setCode(problem.starterCode[language]);
    } else {
      setCode(FALLBACK_CODE[language]);
    }
  }, [language, problem]);

  /* ---------------- Handle Run ---------------- */
  const handleRun = async () => {
    setRunning(true);
    setOutput(null);
    setAnalysis(null);

    try {
      if (type === "core") {
        // Submit solution for evaluation
        const result = await submitCoreSolution({
          problemId,
          code,
          language
        });
        
        setOutput({
          success: result.success,
          output: result.testResults.map(r => 
            `Test ${r.testCase}: ${r.passed ? "PASSED" : "FAILED"}\nInput: ${r.input}\nOutput: ${r.output}\nExpected: ${r.expected}`
          ).join("\n\n"),
          passed: result.passed,
          total: result.total
        });
        
        if (result.success) {
          incrementSolved();
          await updateDailyActivity("core", 10);
        }
      } else {
        // Sandbox: just execute code
        const result = await executeCode(language, code);
        setOutput(result);
      }
    } catch (err) {
      setOutput({
        success: false,
        output: "",
        error: err.message || "Execution failed"
      });
    } finally {
      setRunning(false);
    }
  };

  /* ---------------- Handle Analyze ---------------- */
  const handleAnalyze = async () => {
    if (!problem) return;

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await analyzeCode({
        problemId,
        code
      });
      setAnalysis(result);
    } catch (err) {
      setAnalysis({ error: "Analysis failed" });
    } finally {
      setAnalyzing(false);
    }
  };

  /* ---------------- Resize Handlers ---------------- */
  const startHorizontalResize = (e) => {
    e.preventDefault();
    document.onmousemove = (ev) => {
      const percent = (ev.clientX / window.innerWidth) * 100;
      if (percent > 20 && percent < 70) setLeftWidth(percent);
    };
    document.onmouseup = () => (document.onmousemove = null);
  };

  const startVerticalResize = (e) => {
    e.preventDefault();
    const top = containerRef.current.getBoundingClientRect().top;

    document.onmousemove = (ev) => {
      const percent =
        ((ev.clientY - top) / containerRef.current.clientHeight) * 100;
      if (percent > 40 && percent < 85) setEditorHeight(percent);
    };

    document.onmouseup = () => (document.onmousemove = null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingWave />
          <p className="mt-4 text-gray-500">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen w-full flex bg-[#f8fafc]">
      {/* Left: Problem Panel */}
      <div style={{ width: `${leftWidth}%` }} className="h-full p-2">
        <ProblemPanel
          problem={problem}
          topics={topics}
          readOnly={true}
        />
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startHorizontalResize}
        className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-400"
      />

      {/* Right: Editor + Output */}
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
            running={running}
            analyzing={analyzing}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={startVerticalResize}
          className="h-1 cursor-row-resize bg-gray-300 hover:bg-blue-400"
        />

        {/* Output */}
        <div style={{ height: `${100 - editorHeight}%` }}>
          <OutputPanel
            output={output}
            analysis={analysis}
            running={running}
            analyzing={analyzing}
          />
        </div>
      </div>
    </div>
  );
};

export default CodexWorkspace;
