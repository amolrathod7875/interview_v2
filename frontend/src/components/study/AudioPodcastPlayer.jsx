import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import LoadingWave from '../ui/LoadingWave';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function AudioPodcastPlayer({ summaryText, hasAudio = false, onGenerateAudio, isGenerating = false, audioUrl: externalAudioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localAudioUrl, setLocalAudioUrl] = useState(null);
  
  // Use external URL if provided, otherwise use local URL
  const audioUrl = externalAudioUrl || localAudioUrl;
  const hasAudioExists = hasAudio || !!audioUrl;
  
  const audioRef = useRef(null);

  // Convert markdown to plain text
  const plainText = React.useMemo(() => {
    if (!summaryText || summaryText.trim().length === 0) {
      return "";
    }
    
    const text = summaryText
      .replace(/#{1,6}\s/g, '') // Remove markdown headings
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markers
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
      .replace(/[-*]\s/g, '') // Remove bullet points
      .replace(/\n{2,}/g, '. ') // Replace double newlines with period and space
      .replace(/\n/g, ' ') // Replace single newlines with space
      .trim();
    
    return text;
  }, [summaryText]);

  const generateAudio = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/study/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: plainText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setLocalAudioUrl(url);

    } catch (err) {
      console.error('Audio generation error:', err);
      setError('Failed to generate audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = (e.target.value / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'study-overview.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!summaryText) {
    return (
      <div className="text-center text-gray-400 py-8">
        No summary available for audio generation
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
          <Volume2 size={32} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Audio Overview</h3>
          <p className="text-sm text-gray-300">
            {(isLoading || isGenerating) ? 'Generating audio...' : hasAudioExists ? 'Ready to play' : 'Listen to a spoken version'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-sm">{error}</p>
          <button
            onClick={generateAudio}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Generate Audio Button - shown when no audio exists and not generating */}
      {!hasAudioExists && !isLoading && !isGenerating && (
        <div className="mb-4">
          <button
            onClick={onGenerateAudio || generateAudio}
            className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Volume2 size={20} />
            <span>Generate Audio</span>
          </button>
        </div>
      )}

      {/* Loading state with wave animation */}
      {(isLoading || isGenerating) ? (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingWave />
          <span className="mt-4 text-sm">Generating high-quality audio...</span>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`
              }}
              disabled={!audioUrl}
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePlayPause}
              disabled={!audioUrl || isLoading}
              className="w-12 h-12 bg-white text-indigo-900 rounded-full flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </button>

            <button
              onClick={handleDownload}
              disabled={!audioUrl || isLoading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span className="text-sm">Download MP3</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
