import { useState } from "react";

export default function QuizMode({ questions }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);

  const q = questions[index];

  const select = (i) => {
    setAnswered(i);
    if (i === q.correctAnswerIndex) setScore(score + 1);
  };

  return (
    <div>
      <h2 className="text-xl mb-4">{q.question}</h2>

      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={answered !== null}
            onClick={() => select(i)}
            className={`block w-full p-3 rounded ${
              answered === null
                ? "bg-white/10"
                : i === q.correctAnswerIndex
                ? "bg-green-500"
                : i === answered
                ? "bg-red-500"
                : "bg-white/10"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {answered !== null && (
        <button
          className="mt-6"
          onClick={() => {
            setAnswered(null);
            setIndex(index + 1);
          }}
        >
          Next
        </button>
      )}
    </div>
  );
}
