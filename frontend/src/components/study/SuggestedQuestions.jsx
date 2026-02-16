import { Sparkles, ChevronRight } from "lucide-react";

export default function SuggestedQuestions({
  suggestions = [],
  onSelect,
  isLoading,
}) {
  // Default suggestions if none provided
  const defaultSuggestions = [
    "What are the key concepts in this document?",
    "Can you summarize the main points?",
    "What are the most important terms to know?",
    "Create a quiz on this material",
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[#64748b] text-sm">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>Generating suggestions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-[#64748b]">
        <Sparkles className="w-3 h-3" />
        <span>Suggested questions</span>
      </div>
      
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
        {displaySuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect?.(suggestion)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#e0e7ff] hover:bg-[#c7d2fe] text-[#3b82f6] hover:text-[#2563eb] rounded-full text-sm transition-colors whitespace-nowrap font-medium"
          >
            <span>{suggestion}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        ))}
      </div>
    </div>
  );
}
