import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FileUploader from "../components/study/FileUploader";
import AudioPodcastPlayer from "../components/study/AudioPodcastPlayer";
import FlashcardDeck from "../components/study/FlashcardDeck";
import QuizMode from "../components/study/QuizMode";
import Loader from "../components/study/Loader";

export default function StudyPage() {
  const [studyData, setStudyData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studioMode, setStudioMode] = useState("summary");

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-800">

      {/* ================= LEFT: SOURCES ================= */}
      <div className="w-[22%] min-w-[260px] border-r bg-white p-4">
        <h2 className="text-sm font-semibold mb-4 text-gray-700">
          Sources
        </h2>

        <FileUploader
          multiple
          onStart={() => setLoading(true)}
          onSuccess={({ studyData, files }) => {
            setStudyData(studyData);
            setUploadedFiles(files);
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
              <AudioPodcastPlayer script={studyData.podcast_script} />
            </div>
          )}

          {studyData && studioMode === "flashcards" && (
            <FlashcardDeck cards={studyData.flashcards} />
          )}

          {studyData && studioMode === "quiz" && (
            <QuizMode questions={studyData.quiz} />
          )}
        </div>

        <div className="border-t bg-white p-4">
          <input
            disabled
            placeholder="Ask questions about your sources (coming soon)"
            className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-500"
          />
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
