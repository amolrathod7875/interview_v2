import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUserStatsStore from "../../store/useUserStatsStore";
import CoreTab from "./CoreTab";
import SandboxTab from "./SandboxTab";
import ActivityHeatmap from "./ActivityHeatmap";

/* ---------- Icons ---------- */
const FlameIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
  </svg>
);

const TokenIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.5 9H4a1 1 0 000 2h1.063a7.962 7.962 0 011.185-2.123 1 1 0 00-.748-.877zm5.787 1.385a7.962 7.962 0 01-1.185-2.123H14a1 1 0 000-2H9.874a1 1 0 00-.748.877 7.962 7.962 0 01-1.185 2.123 1 1 0 00-.372.977A8.001 8.001 0 1012 18a8.001 8.001 0 000-5.615z" />
  </svg>
);

const CodexDashboard = () => {
  const [activeTab, setActiveTab] = useState("core");
  const navigate = useNavigate();
  const { tokens, currentStreak, fetchStats, isLoading } = useUserStatsStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Codex</h1>
          <p className="text-sm text-gray-500">Practice coding problems</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <FlameIcon />
            <span className="font-semibold">{currentStreak} day streak</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <TokenIcon />
            <span className="font-semibold">{tokens} tokens</span>
          </div>
        </div>
      </header>

      {/* Activity Heatmap */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-sm font-semibold text-gray-600 mb-2">Activity</h2>
        <ActivityHeatmap />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("core")}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              activeTab === "core"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            Core Curriculum
          </button>
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              activeTab === "sandbox"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            AI Sandbox
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "core" ? (
            <CoreTab onNavigate={(id) => navigate(`/codex/practice/${id}`)} />
          ) : (
            <SandboxTab onNavigate={(id) => navigate(`/codex/sandbox/${id}`)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodexDashboard;
