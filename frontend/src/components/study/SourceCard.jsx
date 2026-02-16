import { useState } from "react";
import { FileText, X, ChevronDown, ChevronUp, File, Image } from "lucide-react";

export default function SourceCard({
  fileName,
  summary,
  topics = [],
  previewUrl,
  onTopicClick,
  onRemove,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Get file extension for badge
  const fileExtension = fileName?.split(".").pop()?.toUpperCase() || "FILE";
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden hover:border-[#3b82f6] hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[#64748b] flex-shrink-0" />
          <span className="text-sm font-medium text-[#1e293b] truncate" title={fileName}>
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 bg-[#e0e7ff] text-[#3b82f6] rounded font-medium">
            {fileExtension}
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-[#f1f5f9] rounded transition-colors"
            >
              <X className="w-3 h-3 text-[#64748b]" />
            </button>
          )}
        </div>
      </div>

      {/* Source Guide Section */}
      <div className="p-3 border-b border-[#e2e8f0]">
        <h4 className="text-xs font-semibold text-[#64748b] mb-2 uppercase tracking-wide">
          Source Guide
        </h4>
        
        {/* Summary with line-clamp */}
        <div className={`relative ${!isExpanded ? "line-clamp-3" : ""}`}>
          <p className="text-sm text-[#334155] leading-relaxed">
            {summary || "No summary available"}
          </p>
          
          {/* Fade out effect when collapsed */}
          {!isExpanded && summary && summary.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {/* Expand/Collapse button */}
        {summary && summary.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-[#3b82f6] hover:text-[#2563eb] flex items-center gap-1 transition-colors font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Read more
              </>
            )}
          </button>
        )}

        {/* Topic Tags */}
        {topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => onTopicClick?.(topic)}
                className="px-2.5 py-1 text-xs bg-[#e0e7ff] hover:bg-[#c7d2fe] text-[#3b82f6] hover:text-[#2563eb] rounded-full transition-colors font-medium"
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Toggle */}
      {previewUrl && (
        <div className="p-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full text-xs text-[#64748b] hover:text-[#3b82f6] flex items-center justify-center gap-1 py-1 transition-colors font-medium"
          >
            {showPreview ? "Hide preview" : "Show preview"}
            {showPreview ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Preview Area */}
          {showPreview && (
            <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
              {isImage ? (
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="w-full h-auto object-contain"
                />
              ) : (
                <div className="p-4 flex items-center justify-center text-[#64748b]">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-40 rounded"
                      title={fileName}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <File className="w-8 h-8" />
                      <span className="text-xs">Preview not available</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
