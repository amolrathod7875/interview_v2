import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, FileUp } from "lucide-react";
import FileUploader from "./FileUploader";
import SourceCard from "./SourceCard";

export default function SourcesPanel({
  sources = [],
  onAddSource,
  onTopicClick,
  onRemoveSource,
}) {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col p-4 bg-white">
      {/* Back to Dashboard */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#3b82f6] mb-4 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1e293b]">Sources</h2>
        <button
          onClick={onAddSource}
          className="p-1.5 bg-[#e0e7ff] hover:bg-[#c7d2fe] rounded-lg transition-colors"
          title="Add source"
        >
          <Plus className="w-4 h-4 text-[#3b82f6]" />
        </button>
      </div>

      {/* File Uploader (Collapsed style) */}
      <div className="mb-4">
        <FileUploader
          multiple
          onStart={() => {}}
          onSuccess={({ studyData, files, text }) => {
            onAddSource?.({ studyData, files, text });
          }}
          onError={() => {}}
        />
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {sources.length === 0 ? (
          <div className="text-center py-8">
            <FileUp className="w-10 h-10 text-[#e2e8f0] mx-auto mb-3" />
            <p className="text-xs text-[#64748b]">
              No sources added yet. Upload files to get started.
            </p>
          </div>
        ) : (
          sources.map((source, index) => (
            <SourceCard
              key={index}
              fileName={source.fileName}
              summary={source.summary}
              topics={source.topics}
              previewUrl={source.previewUrl}
              onTopicClick={onTopicClick}
              onRemove={() => onRemoveSource?.(index)}
            />
          ))
        )}
      </div>
    </div>
  );
}
