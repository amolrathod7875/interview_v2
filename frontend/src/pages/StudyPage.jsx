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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function StudyPage() {
  // Study data state
  const [studyData, setStudyData] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  
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

  // Clear activity log
  const handleClearActivity = () => {
    setActivities([]);
  };

  // Extract topics from summary (simple implementation)
  const extractTopics = (summary) => {
    if (!summary) return [];
    // This is a placeholder - in real implementation, 
    // the backend should provide topics
    const commonTerms = [
      "Binary Arithmetic",
      "Logic Gates",
      "Data Conversion",
      "Digital Systems",
      "Boolean Algebra",
    ];
    return commonTerms.slice(0, 3);
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
            <AudioPodcastPlayer summaryText={studyData.summary} />
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
      case "datatable":
        return (
          <div className="flex items-center justify-center h-full text-[#64748b]">
            {studioMode.charAt(0).toUpperCase() + studioMode.slice(1)} feature coming soon
          </div>
        );
      
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
          />
        ) : (
          <div className="h-full flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] bg-white">
              <h2 className="text-sm font-semibold text-[#1e293b] capitalize">
                {studioMode === "audio" ? "Audio Overview" : studioMode}
              </h2>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {renderCenterContent()}
            </div>
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
