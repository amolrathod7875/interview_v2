import { useState, useRef, useEffect } from "react";
import {
  executeCode,
  generateNewSandboxProblem,
  analyzeCode,
  fetchTopics,
  fetchSandboxProblems
} from "./api";

import ProblemPanel from "./ProblemPanel";
import EditorPanel from "./EditorPanel";
import OutputPanel from "./OutputPanel";
import LoadingWave from "./ui/LoadingWave";

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

const Codex = () => {
  /* ---------------- Core State ---------------- */
  const [problem, setProblem] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(FALLBACK_CODE.python);

  const [output, setOutput] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  /* ---------------- Loading State ---------------- */
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  /* ---------------- Layout State ---------------- */
  const [leftWidth, setLeftWidth] = useState(40);
  const [editorHeight, setEditorHeight] = useState(65);

  const containerRef = useRef(null);

  /* ---------- Load Topics Once ---------- */
  useEffect(() => {
    fetchTopics()
      .then((data) => {
        setTopics(data);
        if (data.length > 0) {
          setSelectedTopic(data[0]._id);
        }
      })
      .catch(() => console.error("Failed to load topics"));
  }, []);

  const loadQuestionList = async (topicId, level) => {
    if (!topicId) {
      setQuestionList([]);
      setProblem(null);
      setSelectedQuestionId(null);
      return;
    }

    try {
      const data = await fetchSandboxProblems({ topicId, difficulty: level });
      const list = data?.problems || [];
      setQuestionList(list);

      if (list.length === 0) {
        setProblem(null);
        setSelectedQuestionId(null);
        return;
      }

      const selected = list.find((item) => item._id === selectedQuestionId)
        || list.find((item) => !item.solved)
        || list[0];

      setSelectedQuestionId(selected._id);
      setProblem(selected);
    } catch (err) {
      console.error("Failed to load question list:", err);
      setQuestionList([]);
      setProblem(null);
      setSelectedQuestionId(null);
    }
  };

  useEffect(() => {
    loadQuestionList(selectedTopic, difficulty);
  }, [selectedTopic, difficulty]);

  /* ---------- Update code on language OR problem change ---------- */
  useEffect(() => {
    if (problem?.starterCode?.[language]) {
      setCode(problem.starterCode[language]);
    } else {
      setCode(FALLBACK_CODE[language]);
    }
  }, [language, problem]);

  /* ---------- Generate Problem ---------- */
  const handleGenerate = async () => {
    if (!selectedTopic) return;

    setGenerating(true);
    setProblem(null);
    setAnalysis(null);
    setOutput(null);

    try {
      const p = await generateNewSandboxProblem({
        topicId: selectedTopic,
        difficulty
      });

      setProblem(p);
      setSelectedQuestionId(p._id);

      const data = await fetchSandboxProblems({ topicId: selectedTopic, difficulty });
      setQuestionList(data?.problems || []);

      if (p?.starterCode?.[language]) {
        setCode(p.starterCode[language]);
      } else {
        setCode(FALLBACK_CODE[language]);
      }
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectQuestion = (problemId) => {
    setSelectedQuestionId(problemId);
    const selected = questionList.find((item) => item._id === problemId);
    if (selected) {
      setProblem(selected);
      setAnalysis(null);
      setOutput(null);
    }
  };

  /* ---------- Run Code ---------- */
  const handleRun = async () => {
    setRunning(true);
    setOutput(null);

    try {
      const res = await executeCode(language, code);
      setOutput(res);
    } catch {
      setOutput({
        success: false,
        output: "",
        error: "Execution failed"
      });
    } finally {
      setRunning(false);
    }
  };

  /* ---------- Analyze Code ---------- */
  const handleAnalyze = async () => {
    if (!problem) return;

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await analyzeCode({
        problemId: problem._id,
        code
      });

      setAnalysis(res);

      if (res?.correct === true && selectedTopic) {
        const data = await fetchSandboxProblems({ topicId: selectedTopic, difficulty });
        setQuestionList(data?.problems || []);
      }
    } catch {
      setAnalysis({ error: "Analysis failed" });
    } finally {
      setAnalyzing(false);
    }
  };

  /* ---------- Resize Handlers ---------- */
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

  return (
    <div ref={containerRef} className="h-full w-full flex bg-[#f8fafc]">
      {/* Left: Problem / Loader */}
      <div style={{ width: `${leftWidth}%` }} className="h-full p-2">
        {generating ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-lg border">
            <LoadingWave />
            <p className="mt-4 text-sm text-gray-500">
              Generating problem… please wait
            </p>
          </div>
        ) : (
          <ProblemPanel
            problem={problem}
            topics={topics}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onGenerate={handleGenerate}
            loading={generating}
            questionList={questionList}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={handleSelectQuestion}
            generateLabel="Generate New"
          />
        )}
      </div>

      <div
        onMouseDown={startHorizontalResize}
        className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-400"
      />

      {/* Right */}
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full flex flex-col p-2"
      >
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

        <div
          onMouseDown={startVerticalResize}
          className="h-1 cursor-row-resize bg-gray-300 hover:bg-blue-400"
        />

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

export default Codex;
