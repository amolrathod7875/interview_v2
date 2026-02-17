import { useState, useCallback } from "react";
import axios from "axios";

import ThreePaneLayout from "../components/study/ThreePaneLayout";
import SourcesPanel from "../components/study/SourcesPanel";
import ChatPanel from "../components/study/ChatPanel";
import StudioPanel from "../components/study/StudioPanel";
import AudioPodcastPlayer from "../components/study/AudioPodcastPlayer";
import FlashcardDeck from "../components/study/FlashcardDeck";
import QuizMode from "../components/study/QuizMode";
import Loader from "../components/study/Loader";
import MindMapViewer from "../components/study/MindMapViewer";
import ReportViewer from "../components/study/ReportViewer";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function StudyPage() {
  // Study data state
  const [studyData, setStudyData] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Task 1: Loading state for summary generation
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  // Task 2: Audio generation state
  const [hasAudio, setHasAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null); // Track audio URL to prevent re-generation
  
  // Chat state
  const [studyText, setStudyText] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatError, setChatError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  console.log("chatError:", chatError);
  
  // Studio state
  const [studioMode, setStudioMode] = useState("summary");
  
  // Activity log state
  const [activities, setActivities] = useState([]);

  // Add activity to log
  const addActivity = useCallback((title, description, status = "pending") => {
    const activity = {
      title,
      description,
      status,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [activity, ...prev]);
    return activity;
  }, []);

  // Update activity status
  const updateActivity = useCallback((index, status) => {
    setActivities((prev) =>
      prev.map((activity, i) =>
        i === index ? { ...activity, status } : activity
      )
    );
  }, []);

  // Handle file upload
  const handleAddSource = async ({ studyData: newStudyData, files, text }) => {
    setLoading(true);
    setIsLoadingSummary(true); // Task 1: Set loading state at start
    
    const activity = addActivity(
      `Processing ${files[0]}`,
      "Extracting content and generating summary",
      "in-progress"
    );

    try {
      // If we already have study data, merge the new content
      const existingText = studyText || "";
      const combinedText = existingText ? `${existingText}\n\n${text}` : text;
      
      setStudyData(newStudyData);
      setStudyText(combinedText);
      
      // Add source to sources list
      const newSource = {
        fileName: files[0],
        summary: newStudyData.summary,
        topics: extractTopics(newStudyData.summary),
        previewUrl: null,
      };
      
      setSources((prev) => [...prev, newSource]);
      
      // Update activity
      const activityIndex = activities.indexOf(activity);
      if (activityIndex >= 0) {
        updateActivity(activityIndex, "completed");
      }
      
      // Add new activities for background tasks
      addActivity("Generating flashcards", "Creating key concept cards", "pending");
      addActivity("Generating quiz", "Creating test questions", "pending");
      
    } catch (error) {
      console.error("Upload error:", error);
      const activityIndex = activities.indexOf(activity);
      if (activityIndex >= 0) {
        updateActivity(activityIndex, "failed");
      }
    } finally {
      setLoading(false);
      setIsLoadingSummary(false); // Task 1: Clear loading state
    }
  };

  // Handle topic click from Source Card
  const handleTopicClick = (topic) => {
    setChatQuestion(`Tell me more about ${topic}`);
    setStudioMode("chat");
  };

  // Handle suggested question click
  const handleSuggestionClick = (suggestion) => {
    setChatQuestion(suggestion);
  };

  // Handle chat submit
  const handleChatSubmit = async (e) => {
    e?.preventDefault();
    if (!chatQuestion.trim() || chatLoading || !studyText) return;

    const question = chatQuestion.trim();
    setChatQuestion("");
    setChatLoading(true);
    setChatError(null);

    // Add user message
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);

    addActivity("Getting answer", "Processing your question", "in-progress");

    try {
      const response = await axios.post(`${API_BASE}/api/study/chat`, {
        text: studyText,
        question,
      });

      if (response.data.success) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.data.answer }
        ]);
        
        // Update activity
        const lastActivity = activities[0];
        if (lastActivity) {
          const index = activities.indexOf(lastActivity);
          updateActivity(index, "completed");
        }
      } else {
        setChatError(response.data.message || "Failed to get answer");
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (error.code === "ERR_NETWORK" || error.message.includes("Network")) {
        setChatError("Cannot connect to server. Please make sure the backend is running.");
      } else if (error.response?.data?.message) {
        setChatError(error.response.data.message);
      } else {
        setChatError("Failed to get answer. Please try again.");
      }
      
      // Update activity to failed
      const lastActivity = activities[0];
      if (lastActivity) {
        const index = activities.indexOf(lastActivity);
        updateActivity(index, "failed");
      }
    } finally {
      setChatLoading(false);
    }
  };

  // Handle studio mode change
  const handleStudioModeChange = (mode) => {
    setStudioMode(mode);
    
    // Add activity for certain modes
    if (mode === "audio") {
      addActivity("Generating audio", "Creating audio overview", "pending");
    } else if (mode === "flashcards") {
      addActivity("Loading flashcards", "Preparing flashcard deck", "pending");
    } else if (mode === "quiz") {
      addActivity("Loading quiz", "Preparing quiz questions", "pending");
    }
  };

  // Task 2: Handle audio generation
  const handleGenerateAudio = async () => {
    if (!studyData?.summary) return;
    setIsGeneratingAudio(true);
    try {
      const response = await axios.post(`${API_BASE}/api/study/audio`, {
        text: studyData.summary
      });
      if (response.status === 200) {
        setHasAudio(true);
        // Create blob URL from response
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }
    } catch (error) {
      console.error("Audio generation error:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Task 4: Feature states for broken features
  const [featureData, setFeatureData] = useState({
    mindmap: null,
    reports: null,
    infographic: null,
    slides: null,
    datatable: null
  });
  
  const [featureLoading, setFeatureLoading] = useState({
    mindmap: false,
    reports: false,
    infographic: false,
    slides: false,
    datatable: false
  });

  // Handle generate feature (Task 4)
  const handleGenerateFeature = async (featureType) => {
    if (!studyData?.summary) return;
    setFeatureLoading(prev => ({ ...prev, [featureType]: true }));
    
    try {
      const response = await axios.post(`${API_BASE}/api/study/${featureType}`, {
        text: studyData.summary
      });
      if (response.data.success) {
        setFeatureData(prev => ({ ...prev, [featureType]: response.data.data }));
      }
    } catch (error) {
      console.error(`${featureType} generation error:`, error);
    } finally {
      setFeatureLoading(prev => ({ ...prev, [featureType]: false }));
    }
  };

  // Clear activity log
  const handleClearActivity = () => {
    setActivities([]);
  };

  // Extract topics from summary (simple implementation)
  const extractTopics = (summary) => {
    if (!summary) return [];
    // Placeholder: backend should provide topics.
    // Removed hardcoded sample topics to avoid misleading suggestions.
    return [];
  };

  // Render center panel content based on studio mode
  const renderCenterContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader label="Generating study companion..." />
        </div>
      );
    }

    switch (studioMode) {
      case "audio":
        return studyData?.summary ? (
          <div className="p-4">
            <AudioPodcastPlayer 
              summaryText={studyData.summary} 
              hasAudio={hasAudio || !!audioUrl}
              onGenerateAudio={handleGenerateAudio}
              isGenerating={isGeneratingAudio}
              audioUrl={audioUrl}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#64748b]">
            Upload files to generate audio
          </div>
        );
      
      case "flashcards":
        return studyData?.flashcards ? (
          <div className="p-4">
            <FlashcardDeck cards={studyData.flashcards} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#64748b]">
            No flashcards available
          </div>
        );
      
      case "quiz":
        return studyData?.quiz ? (
          <div className="p-4">
            <QuizMode questions={studyData.quiz} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#64748b]">
            No quiz available
          </div>
        );
      
      case "mindmap":
      case "reports":
      case "infographic":
      case "slides":
      case "datatable": {
        // Separate handling for mindmap and reports
        if (studioMode === "mindmap") {
          const currentMindmapData = featureData.mindmap || studyData?.mindmap;
          const isMindmapLoading = featureLoading.mindmap;
          
          return (
            <div className="flex flex-col h-full">
              {currentMindmapData ? (
                <div className="flex-1 relative">
                  <MindMapViewer mindmap={currentMindmapData} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-[#1e293b] mb-2">Mind Map</h3>
                    <p className="text-[#64748b] mb-4">
                      Visualize concepts and their relationships
                    </p>
                    {studyData?.summary ? (
                      <button
                        onClick={() => handleGenerateFeature("mindmap")}
                        disabled={isMindmapLoading}
                        className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isMindmapLoading ? "Generating..." : "Generate Mind Map"}
                      </button>
                    ) : (
                      <p className="text-[#64748b]">Upload files first to generate mind map</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        if (studioMode === "reports") {
          const currentReportData = featureData.reports || studyData?.report;
          const isReportLoading = featureLoading.reports;
          
          return (
            <div className="flex flex-col h-full">
              {currentReportData ? (
                <div className="flex-1">
                  <ReportViewer report={currentReportData} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-[#1e293b] mb-2">Reports</h3>
                    <p className="text-[#64748b] mb-4">
                      Get detailed analysis of your study materials
                    </p>
                    {studyData?.summary ? (
                      <button
                        onClick={() => handleGenerateFeature("reports")}
                        disabled={isReportLoading}
                        className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isReportLoading ? "Generating..." : "Generate Report"}
                      </button>
                    ) : (
                      <p className="text-[#64748b]">Upload files first to generate report</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        // Default handling for infographic, slides, datatable
        const currentFeatureData = featureData[studioMode];
        const isFeatureLoading = featureLoading[studioMode];
        
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            {currentFeatureData ? (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 w-full max-w-2xl">
                <pre className="text-sm text-[#334155] whitespace-pre-wrap">
                  {JSON.stringify(currentFeatureData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[#1e293b] mb-2 capitalize">
                  {studioMode.charAt(0).toUpperCase() + studioMode.slice(1)}
                </h3>
                <p className="text-[#64748b] mb-4">
                  Generate a {studioMode} from your study materials
                </p>
                {studyData?.summary ? (
                  <button
                    onClick={() => handleGenerateFeature(studioMode)}
                    disabled={isFeatureLoading}
                    className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isFeatureLoading ? "Generating..." : `Generate ${studioMode.charAt(0).toUpperCase() + studioMode.slice(1)}`}
                  </button>
                ) : (
                  <p className="text-[#64748b]">Upload files first to generate {studioMode}</p>
                )}
              </div>
            )}
          </div>
        );
      }
      
      default:
        // Summary/Chat mode - handled by ChatPanel
        return null;
    }
  };

  // For non-chat modes, we need to show a combined view
  const isChatMode = studioMode === "summary" || studioMode === "chat";

  return (
    <ThreePaneLayout
      leftPanel={
        <SourcesPanel
          sources={sources}
          onAddSource={handleAddSource}
          onTopicClick={handleTopicClick}
          onRemoveSource={(index) => {
            setSources((prev) => prev.filter((_, i) => i !== index));
          }}
        />
      }
      centerPanel={
        isChatMode ? (
          <ChatPanel
            projectName="Study Companion"
            messages={chatMessages}
            inputValue={chatQuestion}
            onInputChange={setChatQuestion}
            onSubmit={handleChatSubmit}
            onSuggestionClick={handleSuggestionClick}
            isLoading={chatLoading}
            studyData={studyData}
            isLoadingSummary={isLoadingSummary}
          />
        ) : (
          <div className="h-full flex flex-col bg-[#f8fafc] relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] bg-white">
              <div className="flex items-center gap-3">
                {/* Task 3: Return to Summary Button */}
                <button
                  onClick={() => setStudioMode("summary")}
                  className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] transition-colors text-[#64748b]"
                >
                  ← Back to Summary
                </button>
                <h2 className="text-sm font-semibold text-[#1e293b] capitalize">
                  {studioMode === "audio" ? "Audio Overview" : studioMode}
                </h2>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {renderCenterContent()}
            </div>

            {/* Summary loading overlay (shows while backend generates summary) */}
            {isLoadingSummary && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-40">
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-lg w-[min(720px,90%)]">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-2">Generating summary</h3>
                  <p className="text-sm text-[#64748b] mb-4">We're extracting key points from your document — this usually takes a few seconds.</p>
                  <div className="flex items-center justify-center">
                    <LoadingWave />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }
      rightPanel={
        <StudioPanel
          activeMode={isChatMode ? "summary" : studioMode}
          onModeChange={handleStudioModeChange}
          activities={activities}
          onClearActivity={handleClearActivity}
        />
      }
    />
  );
}
