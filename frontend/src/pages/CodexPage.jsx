import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProblemPanel from "../components/ProblemPanel";
import EditorPanel from "../components/EditorPanel";
import OutputPanel from "../components/OutputPanel";
import ActivityHeatmap from "../components/codex/ActivityHeatmap";
import useUserStatsStore from "../store/useUserStatsStore";
import {
  analyzeCode,
  executeCode,
  fetchCoreProblems,
  fetchSandboxProblems,
  fetchTopics,
  generateNewSandboxProblem,
  submitCoreSolution,
  validateWithAiTestcases
} from "../components/api";

const FALLBACK_CODE = {
  python: `# Write your solution here\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  javascript: `// Write your solution here\nfunction main() {\n\n}\nmain();\n`
};

const getCodexErrorMessage = (err, fallback) => {
  const status = err?.response?.status;
  if (status === 401) {
    return "Authentication failed for Codex. Please log out and log in again.";
  }
  if (status === 402) {
    return err?.response?.data?.error || "Insufficient tokens for this action.";
  }
  return err?.response?.data?.error || err?.message || fallback;
};

const CodexPage = () => {
  const [mode, setMode] = useState("core");
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [problem, setProblem] = useState(null);

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(FALLBACK_CODE.python);

  const [output, setOutput] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiValidating, setAiValidating] = useState(false);
  const [coreEmptyForFilter, setCoreEmptyForFilter] = useState(false);
  const [topicsError, setTopicsError] = useState("");
  const [statsWarning, setStatsWarning] = useState("");
  const [questionsError, setQuestionsError] = useState("");
  const [coreSplitWidth, setCoreSplitWidth] = useState(72);
  const [isResizingCore, setIsResizingCore] = useState(false);
  const coreLayoutRef = useRef(null);

  const {
    currentStreak,
    dailyActivityMap,
    fetchStats,
    updateDailyActivity
  } = useUserStatsStore();

  const todayKey = new Date().toISOString().split("T")[0];
  const todaySolved = dailyActivityMap?.[todayKey]?.problemsSolved || 0;

  const solvedCount = useMemo(() => {
    if (mode === "core") {
      return questionList.filter((item) => item.status === "solved").length;
    }
    return questionList.filter((item) => item.solved).length;
  }, [mode, questionList]);

  const totalCount = questionList.length;
  const completionPct = totalCount ? Math.round((solvedCount / totalCount) * 100) : 0;

  const normalizedQuestionList = useMemo(
    () => questionList.map((item) => ({ ...item, solved: mode === "core" ? item.status === "solved" : !!item.solved })),
    [questionList, mode]
  );

  const emptyHint = useMemo(() => {
    if (loadingQuestions || !selectedTopic || questionList.length > 0) return "";
    if (mode === "core") {
      return "No Core questions found for this topic and difficulty yet.";
    }
    return "No Sandbox questions found for this topic and difficulty. Click Generate to create one.";
  }, [loadingQuestions, mode, questionList.length, selectedTopic]);

  useEffect(() => {
    const loadInitial = async () => {
      setTopicsError("");
      setStatsWarning("");

      try {
        const topicData = await fetchTopics();
        setTopics(topicData || []);
        if (topicData?.length) {
          setSelectedTopic(topicData[0]._id);
        }
      } catch (err) {
        console.error("Failed to load Codex topics", err);
        setTopicsError(getCodexErrorMessage(err, "Failed to load topics."));
      }

      try {
        await fetchStats();
      } catch (err) {
        console.error("Failed to load Codex stats", err);
        setStatsWarning(getCodexErrorMessage(err, "Unable to load stats right now."));
      }
    };

    loadInitial();
  }, [fetchStats]);

  useEffect(() => {
    setSelectedQuestionId(null);
    setProblem(null);
    setOutput(null);
    setAnalysis(null);
    setCoreEmptyForFilter(false);
    setQuestionsError("");
  }, [mode]);

  const loadQuestionDetail = useCallback(async (questionId, baseItem = null) => {
    if (!questionId) return;

    try {
      if (mode === "core") {
        setProblem(baseItem || null);
      } else {
        setProblem(baseItem);
      }
      setSelectedQuestionId(questionId);
      setOutput(null);
      setAnalysis(null);
    } catch (err) {
      console.error("Failed to load question detail", err);
    }
  }, [mode]);

  const loadQuestions = useCallback(async () => {
    if (!selectedTopic) return;

    setLoadingQuestions(true);
    setCoreEmptyForFilter(false);
    setQuestionsError("");
    try {
      if (mode === "core") {
        const data = await fetchCoreProblems({ topicId: selectedTopic, difficulty });
        const list = data?.problems || [];
        setQuestionList(list);

        if (!list.length) {
          setCoreEmptyForFilter(true);
          setProblem(null);
          setSelectedQuestionId(null);
          return;
        }

        const preferred = list.find((item) => item.status !== "solved") || list[0];
        await loadQuestionDetail(preferred._id, preferred);
      } else {
        const data = await fetchSandboxProblems({ topicId: selectedTopic, difficulty });
        const list = data?.problems || [];
        setQuestionList(list);

        if (!list.length) {
          setProblem(null);
          setSelectedQuestionId(null);
          return;
        }

        const preferred = list.find((item) => !item.solved) || list[0];
        await loadQuestionDetail(preferred._id, preferred);
      }
    } catch (err) {
      console.error("Failed to load questions", err);
      setQuestionsError(getCodexErrorMessage(err, "Failed to load questions."));
      setQuestionList([]);
      setProblem(null);
      setSelectedQuestionId(null);
    } finally {
      setLoadingQuestions(false);
    }
  }, [difficulty, loadQuestionDetail, mode, selectedTopic]);

  useEffect(() => {
    if (!selectedTopic) return;
    loadQuestions();
  }, [loadQuestions, selectedTopic]);

  useEffect(() => {
    if (problem?.starterCode?.[language]) {
      setCode(problem.starterCode[language]);
    } else {
      setCode(FALLBACK_CODE[language]);
    }
  }, [language, problem]);

  useEffect(() => {
    if (!isResizingCore) return;

    const handleMouseMove = (event) => {
      const container = coreLayoutRef.current;
      if (!container) return;

      const bounds = container.getBoundingClientRect();
      const relativeX = event.clientX - bounds.left;
      const percent = (relativeX / bounds.width) * 100;
      const clamped = Math.max(55, Math.min(82, percent));
      setCoreSplitWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizingCore(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingCore]);

  const handleSelectQuestion = async (questionId) => {
    if (mode === "core") {
      const selected = questionList.find((item) => item._id === questionId);
      if (selected?.sourceType === "generated") {
        navigate(`/codex/sandbox/${questionId}`);
      } else {
        navigate(`/codex/practice/${questionId}`);
      }
      return;
    }

    const selected = questionList.find((item) => item._id === questionId);
    await loadQuestionDetail(questionId, selected || null);
  };

  const handleGenerateSandbox = async () => {
    if (!selectedTopic || mode !== "sandbox") {
      await loadQuestions();
      return;
    }

    setLoadingQuestions(true);
    try {
      const created = await generateNewSandboxProblem({ topicId: selectedTopic, difficulty });
      await loadQuestions();
      if (created?._id) {
        await loadQuestionDetail(created._id, created);
      }
    } catch (err) {
      console.error("Failed to generate sandbox problem", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleRun = async () => {
    if (!problem?._id || !code.trim()) return;

    setRunning(true);
    setOutput(null);
    setAnalysis(null);

    try {
      if (mode === "core") {
        const result = await submitCoreSolution({
          problemId: problem._id,
          code,
          language
        });

        setOutput({
          success: result.success,
          output: result.testResults
            .map(
              (test) =>
                `Test ${test.testCase}: ${test.passed ? "PASSED" : "FAILED"}\nInput: ${test.input}\nOutput: ${test.output}\nExpected: ${test.expected}`
            )
            .join("\n\n"),
          error: null
        });

        if (result.success) {
          await updateDailyActivity("core", 10);
          await fetchStats();
          await loadQuestions();
        }
      } else {
        const result = await executeCode(language, code);
        setOutput(result);
      }
    } catch (err) {
      setOutput({
        success: false,
        output: "",
        error: err.response?.data?.error || err.message || "Execution failed"
      });
    } finally {
      setRunning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!problem?._id || !code.trim()) return;

    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeCode({
        problemId: problem._id,
        code
      });
      setAnalysis(result);
    } catch (err) {
      setAnalysis({ error: err.response?.data?.error || "Analysis failed" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAiValidate = async () => {
    if (!problem?._id || !code.trim()) return;

    setAiValidating(true);
    setOutput(null);
    setAnalysis(null);

    try {
      const result = await validateWithAiTestcases({
        problemType: mode,
        problemId: problem._id,
        code,
        language
      });

      setOutput({
        success: result.success,
        output: result.results
          .map(
            (test, index) =>
              `AI Test ${index + 1}: ${test.passed ? "PASSED" : "FAILED"}\nInput: ${test.input}\nOutput: ${test.output}\nExpected: ${test.expectedOutput}${test.error ? `\nError: ${test.error}` : ""}`
          )
          .join("\n\n"),
        error: result.error || null
      });

      if (result.success && mode === "core") {
        await fetchStats();
        await loadQuestions();
      }
    } catch (err) {
      setOutput({
        success: false,
        output: "",
        error: err.response?.data?.error || err.message || "AI validation failed"
      });
    } finally {
      setAiValidating(false);
    }
  };

  const rightRail = (
    <>
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Task Manager</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Solved: <span className="font-semibold text-gray-900">{solvedCount}</span> / {totalCount}</p>
          <p>Remaining: <span className="font-semibold text-gray-900">{Math.max(totalCount - solvedCount, 0)}</span></p>
          <p>Streak: <span className="font-semibold text-gray-900">{currentStreak} days</span></p>
          <p>Today: <span className="font-semibold text-gray-900">{todaySolved} solved</span></p>
        </div>
        <div className="mt-4">
          <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Progress: {completionPct}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Engagement</h2>
        <ActivityHeatmap days={365} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CodeX</h1>
          <p className="text-sm text-gray-500">
            {mode === "core"
              ? "Browse Core questions. Selecting a question opens the full practice workspace."
              : "Select topic + difficulty, solve questions, and validate with AI test cases."}
          </p>
        </div>
        <div className="inline-flex rounded-lg border bg-white p-1">
          <button
            onClick={() => setMode("core")}
            className={`px-4 py-2 text-sm rounded-md ${mode === "core" ? "bg-blue-600 text-white" : "text-gray-600"}`}
          >
            Core
          </button>
          <button
            onClick={() => setMode("sandbox")}
            className={`px-4 py-2 text-sm rounded-md ${mode === "sandbox" ? "bg-blue-600 text-white" : "text-gray-600"}`}
          >
            Sandbox
          </button>
        </div>
      </div>

      {topicsError ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {topicsError}
        </div>
      ) : null}

      {statsWarning ? (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {statsWarning}
        </div>
      ) : null}

      {questionsError ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {questionsError}
        </div>
      ) : null}

      {mode === "core" ? (
        <>
          <div ref={coreLayoutRef} className="hidden xl:flex gap-2 h-[calc(100vh-11rem)]">
            <section style={{ width: `${coreSplitWidth}%` }} className="min-w-[520px] overflow-hidden">
              <ProblemPanel
                problem={problem}
                topics={topics}
                selectedTopic={selectedTopic}
                setSelectedTopic={setSelectedTopic}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                onGenerate={loadQuestions}
                loading={loadingQuestions}
                questionList={normalizedQuestionList}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={handleSelectQuestion}
                generateLabel="Load Questions"
                emptyHint={emptyHint}
                hideDetails={true}
                largeTypography={true}
                questionListMaxHeightClass="max-h-[28rem]"
                showSourceBadge={true}
              />

              {questionList.length > 0 ? (
                <p className="mt-2 text-xs text-gray-500">
                  Click any question from the list to open full coding workspace.
                </p>
              ) : null}

              {coreEmptyForFilter ? (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <p className="mb-2">Core question bank is currently empty for this filter.</p>
                  <button
                    type="button"
                    onClick={() => setMode("sandbox")}
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Switch to Sandbox Questions
                  </button>
                </div>
              ) : null}
            </section>

            <div
              onMouseDown={() => setIsResizingCore(true)}
              className="w-1.5 rounded cursor-col-resize bg-gray-300 hover:bg-blue-400"
            />

            <aside style={{ width: `${100 - coreSplitWidth}%` }} className="min-w-[320px] max-w-[460px] flex flex-col gap-3 overflow-y-auto pr-1 sticky top-4 self-start h-[calc(100vh-11rem)]">
              {rightRail}
            </aside>
          </div>

          <div className="xl:hidden flex flex-col gap-4">
            <section className="min-h-[55vh]">
              <ProblemPanel
                problem={problem}
                topics={topics}
                selectedTopic={selectedTopic}
                setSelectedTopic={setSelectedTopic}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                onGenerate={loadQuestions}
                loading={loadingQuestions}
                questionList={normalizedQuestionList}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={handleSelectQuestion}
                generateLabel="Load Questions"
                emptyHint={emptyHint}
                hideDetails={true}
                largeTypography={true}
                questionListMaxHeightClass="max-h-[26rem]"
                showSourceBadge={true}
              />
            </section>
            <aside className="flex flex-col gap-3">{rightRail}</aside>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-4 h-[78vh]">
            <ProblemPanel
              problem={problem}
              topics={topics}
              selectedTopic={selectedTopic}
              setSelectedTopic={setSelectedTopic}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              onGenerate={handleGenerateSandbox}
              loading={loadingQuestions}
              questionList={normalizedQuestionList}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={handleSelectQuestion}
              generateLabel="Generate"
              emptyHint={emptyHint}
            />
          </section>

          <section className="xl:col-span-5 h-[78vh] flex flex-col gap-3">
            <div className="h-[58%] min-h-[320px]">
              <EditorPanel
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
                onRun={handleRun}
                onAnalyze={handleAnalyze}
                onAiValidate={handleAiValidate}
                running={running}
                analyzing={analyzing}
                aiValidating={aiValidating}
              />
            </div>
            <div className="h-[42%] min-h-[220px]">
              <OutputPanel
                output={output}
                analysis={analysis}
                running={running || aiValidating}
                analyzing={analyzing}
              />
            </div>
          </section>

          <aside className="xl:col-span-3 h-[78vh] flex flex-col gap-3">
            {rightRail}
          </aside>
        </div>
      )}
    </div>
  );
};

export default CodexPage;
