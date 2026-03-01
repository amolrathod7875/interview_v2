import { useState, useEffect } from "react";
import { fetchTopics, generateProblem } from "../api";
import useUserStatsStore from "../../store/useUserStatsStore";

const SandboxTab = ({ onNavigate }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const { tokens, fetchStats } = useUserStatsStore();

  const SANDBOX_COST = 5;

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const data = await fetchTopics();
      setTopics(data);
      if (data.length > 0) {
        setSelectedTopic(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load topics:", err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTopic) {
      setError("Please select a topic");
      return;
    }

    if (tokens < SANDBOX_COST) {
      setError(`Insufficient tokens. You need ${SANDBOX_COST} tokens but have ${tokens}`);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const problem = await generateProblem({
        topicId: selectedTopic,
        difficulty
      });
      
      // Update local token count after generation
      await fetchStats();
      
      // Navigate to the sandbox workspace
      onNavigate(problem._id);
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err.response?.data?.error || "Failed to generate problem");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {/* Token Warning */}
      {tokens < SANDBOX_COST && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ You don't have enough tokens to generate a sandbox problem. 
            Solve core problems to earn tokens!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Generator Form */}
      <div className="max-w-md">
        <h3 className="text-lg font-semibold mb-4">Generate AI Problem</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white"
              disabled={generating}
            >
              {topics.map(topic => (
                <option key={topic._id} value={topic._id}>{topic.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <div className="flex gap-2">
              {["easy", "medium", "hard"].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  disabled={generating}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    difficulty === diff
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } disabled:opacity-50`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>Cost per generation:</span>
              <span className="font-medium">{SANDBOX_COST} tokens</span>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={generating || tokens < SANDBOX_COST}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                `Generate Problem (${SANDBOX_COST} tokens)`
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">About AI Sandbox</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI generates unique problems based on your selected topic</li>
            <li>• Problems are dynamically created - no two are the same</li>
            <li>• Solving problems earns you tokens</li>
            <li>• Use sandbox to practice specific company questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SandboxTab;
