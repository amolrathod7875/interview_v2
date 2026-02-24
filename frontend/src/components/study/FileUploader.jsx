import { Upload } from "lucide-react";
import { useRef, useState } from "react";

export default function FileUploader({ onStart, onSuccess, onError, multiple = true }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const handleFiles = async (files) => {
    if (!files || files.length === 0 || uploading) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file); // MUST match backend
    });

    setUploading(true);
    onStart?.();

    try {
      const res = await fetch(`${API_BASE_URL}/api/study/process`, {
        method: "POST",
        body: formData,
      });

      // Safely read response
      const text = await res.text();
      let json;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Server did not return valid JSON");
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Processing failed");
      }

      // Debug log to check what we received
      console.log("Received study data:", {
        hasSummary: !!json.summary,
        hasFlashcards: !!json.flashcards,
        hasQuiz: !!json.quiz,
        hasMindmap: !!json.mindmap,
        hasReport: !!json.report,
      });

      // Send clean data to StudyPage. Include mindmap/report if backend provided them.
      onSuccess?.({
        studyData: {
          summary: json.summary,
          flashcards: json.flashcards,
          quiz: json.quiz,
          mindmap: json.mindmap || null,
          report: json.report || null,
        },
        files: Array.from(files).map((f) => f.name),
        sessionId: json.sessionId,
        text: json.text, // Pass original text for QnA
      });
    } catch (err) {
      console.error("Upload error:", err);
      onError?.(err);
      alert(err.message || "Failed to process files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={() => !uploading && fileInputRef.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!uploading) handleFiles(e.dataTransfer.files);
      }}
      className={`border-2 border-dashed rounded-xl p-12 text-center select-none
        transition
        ${
          uploading
            ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-70"
            : "border-cyan-400 cursor-pointer hover:bg-white/5"
        }`}
    >
      <Upload className="mx-auto mb-4" size={32} />
      <p className="text-lg font-medium">
        {uploading ? "Processing files..." : "Drag & drop your study files"}
      </p>
      <p className="text-sm opacity-60">
        or click to upload (PDF, PPT, TXT)
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept=".pdf,.ppt,.pptx,.txt"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />
    </div>
  );
}
