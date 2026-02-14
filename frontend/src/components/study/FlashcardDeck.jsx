import { useState, useCallback } from "react";
import { Shuffle, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";

// Fisher-Yates shuffle algorithm (pure function)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function FlashcardDeck({ cards = [] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState([]);

  const currentCards = isShuffled ? shuffledCards : cards;

  // Memoize callbacks with useCallback
  const handleShuffle = useCallback(() => {
    const shuffled = shuffleArray(cards);
    setShuffledCards(shuffled);
    setIsShuffled(true);
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const handleReset = useCallback(() => {
    setIndex(0);
    setFlipped(false);
    setIsShuffled(false);
    setShuffledCards([]);
  }, []);

  const safeIndex = Math.min(index, currentCards.length - 1);

  const goToPrevious = useCallback(() => {
    if (safeIndex > 0) {
      setIndex(safeIndex - 1);
      setFlipped(false);
    }
  }, [safeIndex]);

  const goToNext = useCallback(() => {
    if (safeIndex < currentCards.length - 1) {
      setIndex(safeIndex + 1);
      setFlipped(false);
    }
  }, [safeIndex, currentCards.length]);

  // Handle empty or undefined cards
  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="text-lg font-semibold text-yellow-400">No Flashcards Available</h3>
        <p className="text-gray-400 text-sm max-w-md">
          No flashcards were generated from the uploaded content. Try uploading a document with more substantial text content.
        </p>
      </div>
    );
  }

  // Handle case where index is out of bounds
  const card = currentCards[safeIndex];

  // Validate card structure
  if (!card || !card.front || !card.back) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-400">Invalid Flashcard Data</h3>
        <p className="text-gray-400 text-sm">Some flashcards have missing content. Please regenerate the study material.</p>
      </div>
    );
  }

  const progress = ((safeIndex + 1) / currentCards.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress indicator */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Card {safeIndex + 1} of {currentCards.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="w-full max-w-md min-h-56 cursor-pointer relative"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s'
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-center p-6 hover:shadow-lg hover:shadow-blue-500/20 border border-gray-700"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(${flipped ? 180 : 0}deg)`,
            transition: 'transform 0.5s'
          }}
        >
          <div className="w-full">
            <p className="text-xs uppercase tracking-wider text-blue-400 mb-2">Question</p>
            <p className="text-xl text-white font-medium">{card.front}</p>
          </div>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-center p-6 hover:shadow-lg hover:shadow-green-500/20 border border-gray-700"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(${flipped ? 0 : -180}deg)`,
            transition: 'transform 0.5s'
          }}
        >
          <div className="w-full">
            <p className="text-xs uppercase tracking-wider text-green-400 mb-2">Answer</p>
            <p className="text-lg text-green-300">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-gray-500">Click card to flip</p>
        
        <div className="flex gap-3 flex-wrap justify-center">
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            disabled={safeIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          {/* Shuffle button */}
          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            title="Shuffle cards"
          >
            <Shuffle size={18} />
            Shuffle
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            title="Reset to original order"
          >
            <RefreshCcw size={18} />
            Reset
          </button>

          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={safeIndex >= currentCards.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
