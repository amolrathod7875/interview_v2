import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, ChevronRight, Settings } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function QuizMode({ questions: initialQuestions, sessionId, studyText }) {
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [error, setError] = useState(null);

  // Reset quiz when initial questions change
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      setIndex(0);
      setScore(0);
      setAnswered(null);
      setQuizComplete(false);
    }
  }, [initialQuestions]);

  const currentQuestion = questions[index];

  const select = (i) => {
    if (answered !== null) return;
    
    setAnswered(i);
    if (i === currentQuestion.correctAnswerIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setAnswered(null);
    } else {
      setQuizComplete(true);
    }
  };

  const regenerateQuiz = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/study/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          text: studyText,
          count: questionCount,
        }),
      });

      const data = await response.json();

      if (data.success && data.quiz) {
        setQuestions(data.quiz);
        setIndex(0);
        setScore(0);
        setAnswered(null);
        setQuizComplete(false);
        setShowSettings(false);
      } else {
        throw new Error(data.message || "Failed to generate quiz");
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError(err.message || "Failed to regenerate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const restartQuiz = () => {
    setIndex(0);
    setScore(0);
    setAnswered(null);
    setQuizComplete(false);
  };

  // Handle empty questions
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="text-lg font-semibold text-yellow-400">No Quiz Available</h3>
        <p className="text-gray-400 text-sm max-w-md">
          No quiz was generated from the uploaded content. Try uploading a document with more substantial text content.
        </p>
        
        {/* Settings for regeneration */}
        <div className="mt-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Settings size={18} />
            Generate Quiz
          </button>
          
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <label className="block text-sm text-gray-300 mb-2">
                Number of questions:
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full p-2 bg-gray-700 text-white rounded mb-3"
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={15}>15 questions</option>
                <option value={20}>20 questions</option>
              </select>
              <button
                onClick={regenerateQuiz}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Generate Quiz
                  </>
                )}
              </button>
            </div>
          )}
          
        {error && (
          <p className="mt-3 text-red-400 text-sm">{error}</p>
        )}
        </div>
      </div>
    );
  }

  // Quiz complete screen
  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassing = percentage >= 70;

    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isPassing ? "bg-green-500/20" : "bg-yellow-500/20"
          }`}>
            <span className={`text-4xl ${isPassing ? "text-green-400" : "text-yellow-400"}`}>
              {isPassing ? "🎉" : "📚"}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
          
          <div className="text-6xl font-bold mb-2" style={{ color: isPassing ? "#4ade80" : "#facc15" }}>
            {percentage}%
          </div>
          
          <p className="text-gray-400">
            You scored {score} out of {questions.length}
          </p>
          
          <p className={`mt-2 text-sm ${isPassing ? "text-green-400" : "text-yellow-400"}`}>
            {isPassing ? "Great job! You passed!" : "Keep studying and try again!"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={restartQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          
          {(sessionId || studyText) && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              <Settings size={18} />
              New Quiz
            </button>
          )}
        </div>

        {showSettings && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg w-full max-w-md">
            <label className="block text-sm text-gray-300 mb-2">
              Number of questions:
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full p-2 bg-gray-700 text-white rounded mb-3"
            >
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
              <option value={20}>20 questions</option>
            </select>
            <button
              onClick={regenerateQuiz}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Generate New Quiz
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header with settings */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-400">
          Question {index + 1} of {questions.length}
        </div>
        
        {(sessionId || studyText) && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
          >
            <Settings size={16} />
            {showSettings ? "Hide Settings" : "New Quiz"}
          </button>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <label className="block text-sm text-gray-300 mb-2">
            Number of questions:
          </label>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full p-2 bg-gray-700 text-white rounded mb-3"
          >
            <option value={5}>5 questions</option>
            <option value={10}>10 questions</option>
            <option value={15}>15 questions</option>
            <option value={20}>20 questions</option>
          </select>
          <button
            onClick={regenerateQuiz}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Generate Quiz
              </>
            )}
          </button>
          {error && (
            <p className="mt-3 text-red-400 text-sm">{error}</p>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl mb-6 text-gray-900 font-medium">
        {currentQuestion?.question}
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {currentQuestion?.options?.map((opt, i) => {
          const isSelected = answered === i;
          const isCorrect = i === currentQuestion.correctAnswerIndex;
          const showCorrect = answered !== null && isCorrect;
          const showIncorrect = answered !== null && isSelected && !isCorrect;

          return (
            <button
              key={i}
              disabled={answered !== null}
              onClick={() => select(i)}
              className={`block w-full p-4 rounded-lg text-left transition flex items-center gap-3 ${
                showCorrect
                  ? "bg-green-500/20 border-2 border-green-500"
                  : showIncorrect
                  ? "bg-red-500/20 border-2 border-red-500"
                  : answered === null
                  ? "bg-white/10 hover:bg-white/20 border-2 border-transparent"
                  : "bg-white/5 border-2 border-transparent opacity-50"
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                showCorrect
                  ? "bg-green-500 text-white"
                  : showIncorrect
                  ? "bg-red-500 text-white"
                  : "bg-gray-600 text-white"
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {showCorrect && <CheckCircle className="text-green-500" size={20} />}
              {showIncorrect && <XCircle className="text-red-500" size={20} />}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      {answered !== null && (
        <button
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          onClick={handleNext}
        >
          {index < questions.length - 1 ? (
            <>
              Next Question
              <ChevronRight size={20} />
            </>
          ) : (
            <>
              See Results
            </>
          )}
        </button>
      )}

      {/* Score display */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Score: {score} / {index + (answered !== null ? 1 : 0)}
      </div>
    </div>
  );
}
