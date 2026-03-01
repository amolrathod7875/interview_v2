import { useState, useEffect } from "react";
import { fetchCoreProblems, fetchTopics } from "../api";

const CoreTab = ({ onNavigate }) => {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    topicId: "",
    difficulty: "",
    status: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProblems();
  }, [filters]);

  const loadData = async () => {
    try {
      const [topicsData] = await Promise.all([
        fetchTopics()
      ]);
      setTopics(topicsData);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const loadProblems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.topicId) params.topicId = filters.topicId;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.status) params.status = filters.status;
      
      const data = await fetchCoreProblems(params);
      setProblems(data.problems || []);
    } catch (err) {
      console.error("Failed to load problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filters.topicId}
          onChange={(e) => setFilters({ ...filters, topicId: e.target.value })}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">All Topics</option>
          {topics.map(topic => (
            <option key={topic._id} value={topic._id}>{topic.name}</option>
          ))}
        </select>

        <select
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">All Status</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
        </select>
      </div>

      {/* Problems Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading problems...</div>
      ) : problems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No problems found. Add core problems to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {problems.map((problem) => (
                <tr 
                  key={problem._id} 
                  onClick={() => onNavigate(problem._id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    {problem.status === "solved" ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">○</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{problem.title}</td>
                  <td className="px-4 py-3 text-gray-600">{problem.topic?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CoreTab;
