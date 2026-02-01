import { useState, useEffect, useRef, useMemo } from "react";
import { Play, Pause, Square, Volume2, Download } from "lucide-react";

export default function AudioPodcastPlayer({ summaryText }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const currentCharIndexRef = useRef(0);
  const isPausedRef = useRef(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a good English voice
      const englishVoice = availableVoices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium'))
      ) || availableVoices.find(v => v.lang.startsWith('en'));
      
      setSelectedVoice(englishVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Check if summary exists
  if (!summaryText || summaryText.trim().length === 0) {
    console.log("No summary text provided to AudioPodcastPlayer");
    return (
      <div className="text-center p-8 text-gray-500">
        <Volume2 className="mx-auto mb-3 opacity-30" size={48} />
        <p>No summary available for audio playback.</p>
      </div>
    );
  }

  // Convert markdown to plain text for speech - memoized to prevent recalculation
  const plainText = useMemo(() => {
    const text = summaryText
      .replace(/#{1,6}\s/g, '') // Remove markdown headings
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markers
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
      .replace(/[-*]\s/g, '') // Remove bullet points
      .replace(/\n{2,}/g, '. ') // Replace double newlines with period and space
      .replace(/\n/g, ' ') // Replace single newlines with space
      .trim();
    
    console.log("Plain text generated, length:", text.length);
    return text;
  }, [summaryText]);

  const handlePlay = () => {
    console.log("Play button clicked. Playing:", playing, "Paused:", isPausedRef.current);
    
    if (playing) {
      // Pause the audio
      window.speechSynthesis.pause();
      setPlaying(false);
      isPausedRef.current = true;
      console.log("⏸️ Paused audio at position:", currentCharIndexRef.current);
      return;
    }

    if (isPausedRef.current && window.speechSynthesis.paused) {
      // Resume from pause
      window.speechSynthesis.resume();
      setPlaying(true);
      isPausedRef.current = false;
      console.log("▶️ Resumed audio from position:", currentCharIndexRef.current);
      return;
    }

    // Start new playback
    console.log("Creating new utterance with text length:", plainText.length);
    
    const textToSpeak = plainText.substring(currentCharIndexRef.current);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log("Using voice:", selectedVoice.name);
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log("✅ Audio started successfully");
      setPlaying(true);
      isPausedRef.current = false;
    };
    
    utterance.onend = () => {
      console.log("✅ Audio ended");
      setPlaying(false);
      setProgress(100);
      currentCharIndexRef.current = 0;
      isPausedRef.current = false;
    };
    
    utterance.onerror = (event) => {
      console.error("❌ Audio error:", event.error, event);
      setPlaying(false);
      alert(`Audio playback failed: ${event.error}. Please try again.`);
    };

    utterance.onboundary = (event) => {
      currentCharIndexRef.current = event.charIndex;
      const percent = ((currentCharIndexRef.current + (plainText.length - textToSpeak.length)) / plainText.length) * 100;
      setProgress(percent);
    };

    console.log("🔊 Starting speech synthesis...");
    
    setTimeout(() => {
    currentCharIndexRef.current = 0;
    isPausedRef.current = false;
    console.log("⏹️ Stopped audio and reset position");
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setProgress(0);
    currentCharIndexRef.current = 0;
    isPausedRef.current = false;
    console.log("⏹️ Stopped audio and reset position");
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    console.log("🎙️ Starting audio generation for download...");
    
    try {
      // Stop any currently playing audio
      window.speechSynthesis.cancel();
      
      // Use MediaRecorder with audio capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log("📦 Audio chunk received, size:", event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("✅ Recording stopped, total chunks:", audioChunks.length);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log("💾 Creating blob, size:", audioBlob.size);
        
        if (audioBlob.size === 0) {
          alert("No audio was recorded. Please ensure microphone permission is granted.");
          setIsGenerating(false);
          return;
        }
        
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `summary-audio-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsGenerating(false);
        console.log("✅ Download complete!");
      };

      // Start recording
      console.log("🔴 Starting recording...");
      mediaRecorder.start();

      // Create and speak utterance
      const utterance = new SpeechSynthesisUtterance(plainText);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        console.log("🔊 Speech started for recording");
      };

      utterance.onend = () => {
        console.log("⏹️ Speech ended, stopping recording...");
        setTimeout(() => {
          mediaRecorder.stop();
        }, 500);
      };

      utterance.onerror = (event) => {
        console.error("❌ Speech error:", event);
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        setIsGenerating(false);
        alert("Failed to generate audio. Please try again.");
      };

      // Speak the text
      console.log("🔊 Starting speech for recording...");
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error("❌ Download error:", error);
      setIsGenerating(false);
      
      if (error.name === 'NotAllowedError') {
        alert("Microphone permission is required to record audio. Please allow microphone access and try again.");
      } else {
        alert("Audio download failed: " + error.message);
      }
      console.error("Download error:", error);
      setIsGenerating(false);
      alert("Audio download is not supported in this browser. Please use Chrome or Edge.");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
          {playing ? "Pause" : "Play"}
        </button>

        <button
          onClick={handleStop}
          disabled={!playing && progress === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square size={20} />
          Stop
        </button>

        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} />
          {isGenerating ? "Generating..." : "Download Audio"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Text being read */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <p className="text-sm text-gray-600 mb-2 font-semibold">Reading:</p>
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {plainText.substring(0, 300)}...
        </p>
      </div>

      {playing && (
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
          <Volume2 size={16} className="animate-pulse" />
          <span>Playing audio...</span>
        </div>
      )}
    </div>
  );
}
