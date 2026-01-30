import { useState } from "react";
import { Play, Pause } from "lucide-react";

export default function AudioPodcastPlayer({ script }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <button
        onClick={() => setPlaying(!playing)}
        className="flex items-center gap-2 mb-4 px-4 py-2 bg-cyan-500 text-black rounded-lg"
      >
        {playing ? <Pause /> : <Play />}
        {playing ? "Pause" : "Play"}
      </button>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {script.map((line, idx) => (
          <p
            key={idx}
            className={`p-2 rounded ${
              idx === current
                ? "bg-cyan-500/20 text-cyan-300"
                : "opacity-70"
            }`}
          >
            <strong>{line.speaker}:</strong> {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}
