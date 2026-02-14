import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FileUploader from "../components/study/FileUploader";
import AudioPodcastPlayer from "../components/study/AudioPodcastPlayer";
import FlashcardDeck from "../components/study/FlashcardDeck";
import QuizMode from "../components/study/QuizMode";
import Loader from "../components/study/Loader";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function StudyPage() {
  const [studyData, setStudyData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studioMode, setStudioMode] = useState("summary");
  const navigate = useNavigate();
  
  // Chat state
  const [studyText, setStudyText] = useState(""); // Store the original text for QnA
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]); // [{question, answer}]
  const [chatError, setChatError] = useState(null);

  // Handle sending chat question
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim() || chatLoading) return;

    const question = chatQuestion.trim();
    setChatQuestion("");
    setChatLoading(true);
    setChatError(null);

    try {
      // Pass the study text directly instead of sessionId
      const response = await axios.post(`${API_BASE}/api/study/chat`, {
        text: studyText,
        question,
      });

      if (response.data.success) {
        setChatMessages(prev => [
          ...prev,
          { question, answer: response.data.answer }
        ]);
      } else {
        setChatError(response.data.message || "Failed to get answer");
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Handle different error types
      if (error.code === "ERR_NETWORK" || error.message.includes("Network")) {
        setChatError("Cannot connect to server. Please make sure the backend is running on port 3000.");
      } else if (error.response?.data?.message) {
        setChatError(error.response.data.message);
      } else {
        setChatError("Failed to get answer. Please try again.");
      }
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800">

      {/* ================= LEFT: SOURCES ================= */}
      <div className="w-[22%] min-w-[260px] border-r bg-white p-4">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h2 className="text-sm font-semibold mb-4 text-gray-700">
          Sources
        </h2>

        <FileUploader
          multiple
          onStart={() => setLoading(true)}
          onSuccess={({ studyData, files, text }) => {
            setStudyData(studyData);
            setUploadedFiles(files);
            setStudyText(text || ""); // Store the original text for QnA
            setLoading(false);
            setStudioMode("summary");
          }}
          onError={() => setLoading(false)}
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">
              Uploaded study material
            </div>

            <ul className="space-y-2">
              {uploadedFiles.map((file, idx) => (
                <li
                  key={idx}
                  className="px-3 py-2 rounded-lg border text-sm bg-gray-50 truncate"
                  title={file}
                >
                  📄 {file}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ================= CENTER ================= */}
      <div className="flex-1 flex flex-col border-r bg-[#f8fafc]">

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && <Loader label="Generating study companion..." />}

          {!studyData && !loading && (
            <div className="text-gray-400 text-center mt-24">
              Upload documents to get started
            </div>
          )}

          {studyData && studioMode === "summary" && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-3 text-gray-800">
                Summary
              </h3>
              <div className="prose max-w-none prose-slate prose-headings:font-semibold prose-h2:text-xl prose-h2:mb-2 prose-h2:mt-4 prose-p:my-2 prose-ul:list-disc prose-ul:ml-6 prose-ul:my-3 prose-li:my-1 prose-strong:font-semibold prose-strong:text-gray-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {studyData.summary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {studyData && studioMode === "audio" && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4 text-gray-800">
                Audio Summary
              </h3>
              <AudioPodcastPlayer summaryText={studyData.summary} />
            </div>
          )}

          {studyData && studioMode === "flashcards" && (
            <FlashcardDeck cards={studyData.flashcards} />
          )}

          {studyData && studioMode === "quiz" && (
            <QuizMode questions={studyData.quiz} />
          )}
        </div>

        <div className="border-t bg-white p-4 space-y-3">
          {/* Error Message */}
          {chatError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {chatError}
            </div>
          )}

          {/* Chat Messages Display */}
          {chatMessages.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-3 mb-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <div className="font-medium text-gray-700">Q: {msg.question}</div>
                  <div className="text-gray-600 mt-1">A: {msg.answer}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              placeholder={studyData ? "Ask questions about your sources..." : "Upload files first to ask questions"}
              disabled={!studyData || chatLoading}
              className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={!studyData || chatLoading || !chatQuestion.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
            >
              {chatLoading ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="w-[24%] min-w-[280px] bg-white p-4 border-l">
        <h2 className="text-sm font-semibold mb-4 text-gray-700">
          Studio
        </h2>

        <StudioButton
          active={studioMode === "summary"}
          onClick={() => setStudioMode("summary")}
          title="Summary"
          description="Read the generated overview"
        />

        <StudioButton
          active={studioMode === "audio"}
          onClick={() => setStudioMode("audio")}
          title="Audio Overview"
          description="Listen to a spoken summary"
        />

        <StudioButton
          active={studioMode === "flashcards"}
          onClick={() => setStudioMode("flashcards")}
          title="Flashcards"
          description="Key concepts for quick recall"
        />

        <StudioButton
          active={studioMode === "quiz"}
          onClick={() => setStudioMode("quiz")}
          title="Quiz"
          description="Test your understanding"
        />
      </div>
    </div>
  );
}

/* ================= BUTTON ================= */

function StudioButton({ title, description, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl mb-3 border transition
        ${active
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:bg-gray-50"
        }`}
    >
      <h3 className="font-medium text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </button>
  );
}
