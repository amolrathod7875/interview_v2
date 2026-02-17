import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User } from "lucide-react";
import SuggestedQuestions from "./SuggestedQuestions";
import LoadingWave from "../ui/LoadingWave.jsx";

export default function ChatPanel({
  projectName = "Study Companion",
  messages = [],
  inputValue,
  onInputChange,
  onSubmit,
  onSuggestionClick,
  suggestions = [],
  isLoading = false,
  studyData,
  isLoadingSummary = false,
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick?.(suggestion);
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] bg-white">
        <h2 className="text-sm font-semibold text-[#1e293b]">{projectName}</h2>
        {studyData && (
          <span className="text-xs text-[#64748b]">
            {studyData.sources?.length || 0} source{studyData.sources?.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!studyData && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-[#e2e8f0] mb-4" />
            <p className="text-[#64748b] text-sm">
              Upload documents to get started
            </p>
          </div>
        )}

        {studyData && messages.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <h3 className="font-semibold mb-2 text-[#1e293b]">Summary</h3>
            {isLoadingSummary ? (
              <LoadingWave />
            ) : (
              <div className="prose max-w-none prose-sm prose-slate">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {studyData.summary || "No summary available"}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-[#e0e7ff]" : "bg-[#3b82f6]"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-[#3b82f6]" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`max-w-[80%] p-3 rounded-xl text-sm ${
                msg.role === "user"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-white text-[#334155] border border-[#e2e8f0] shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose max-w-none prose-sm prose-slate">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-[#e2e8f0] p-3 rounded-xl shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[#e2e8f0] bg-white p-4 space-y-3">
        {/* Suggested Questions */}
        {studyData && (
          <SuggestedQuestions
            suggestions={suggestions}
            onSelect={handleSuggestionClick}
            isLoading={isLoading}
          />
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder={studyData ? "Ask questions about your sources..." : "Upload files first to ask questions"}
            disabled={!studyData || isLoading}
            className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-3 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!studyData || isLoading || !inputValue?.trim()}
            className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
