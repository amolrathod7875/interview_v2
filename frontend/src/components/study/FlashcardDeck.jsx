import { useState } from "react";

export default function FlashcardDeck({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        onClick={() => setFlipped(!flipped)}
        className="w-96 h-56 bg-white/10 rounded-xl flex items-center justify-center text-center text-xl cursor-pointer transition-transform duration-500"
        style={{
          transform: `rotateY(${flipped ? 180 : 0}deg)`
        }}
      >
        {flipped ? card.back : card.front}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => {
            setIndex((i) => Math.max(i - 1, 0));
            setFlipped(false);
          }}
        >
          Previous
        </button>
        <button
          onClick={() => {
            setIndex((i) => Math.min(i + 1, cards.length - 1));
            setFlipped(false);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
