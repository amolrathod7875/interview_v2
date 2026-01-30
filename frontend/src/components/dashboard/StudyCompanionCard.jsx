import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudyCompanionCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
          <BookOpen className="text-cyan-600" />
        </div>

        <h3 className="text-lg font-semibold mb-1">
          Study Companion
        </h3>

        <p className="text-sm text-gray-500">
          Upload PDFs, PPTs, or notes and get summaries, flashcards,
          podcasts, and quizzes instantly.
        </p>
      </div>

      <button
        onClick={() => navigate("/study")}
        className="mt-6 bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
      >
        Start Studying
      </button>
    </div>
  );
}
