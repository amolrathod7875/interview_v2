import { useEffect, useState } from "react";
import axios from "axios";
import { fetchGithubRepos } from "../services/github.service";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

const GithubRepoSelector = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAnalyzeButton, setShowAnalyzeButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for session ID in URL (from OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    
    if (sessionId) {
      // Store session ID in localStorage
      localStorage.setItem('gh_session', sessionId);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    const loadRepos = async () => {
      try {
        const data = await fetchGithubRepos();
        setRepos(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Repo fetch failed:", err);
        if (err.message.includes("401") || err.message.includes("Unauthorized")) {
          setIsAuthenticated(false);
          localStorage.removeItem('gh_session'); // Clear invalid session
          setError(null);
        } else {
          setError("Failed to load GitHub repositories");
        }
      } finally {
        setLoading(false);
      }
    };

    loadRepos();
  }, []);

  const handleChange = async (e) => {
    const value = e.target.value;
    if (!value) return;

    const [owner, repo] = value.split("/");

    try {
      await axios.post(`${API}/user/github/repo`, {
        firebaseId: localStorage.getItem("userUid"),
        owner,
        repo,
      });

      setSelectedRepo({ owner, repo });
      setShowAnalyzeButton(true);
      setError(null);
    } catch (err) {
      console.error("Failed to save repo:", err);
      setError("Failed to save selected repository");
    }
  };

  const handleAnalyze = () => {
    // Navigate to analysis page
    navigate('/github-analysis');
  };

  const handleSelectAnother = () => {
    setSelectedRepo(null);
    setShowAnalyzeButton(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('gh_session');
    setIsAuthenticated(false);
    setSelectedRepo(null);
    setShowAnalyzeButton(false);
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading GitHub repositories…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center space-y-3 max-w-md">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Connect GitHub</h2>
          <p className="text-sm text-gray-600">
            Please connect your GitHub account to select a repository
          </p>
          <button
            onClick={() => w4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">GitHub Repository</h3>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Disconnect
        </button>
      </div>

      {!showAnalyzeButton ? (
        <div className="space-y-2">
          <select
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            defaultValue=""
            value={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.repo}` : ""}
          >
            <option value="">Select Repository</option>
            {repos.map((repo) => (
              <option
                key={repo.id}
                value={`${repo.owner}/${repo.name}`}
              >
                {repo.owner}/{repo.name} {repo.private ? "🔒" : ""}
              </option>
            ))}
          </select>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Selected Repository</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedRepo.owner}/{selectedRepo.repo}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? "Analyzing..." : "Analyze Repository"}
            </button>
            <button
              onClick={handleSelectAnother}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Select Another
            </button>
          </div>
        </divclassName="text-xs text-gray-500">
          Saving selected repository…
        </p>
      )}

      {selectedRepo && !saving && (
        <p className="text-sm text-green-600">
          Connected Repo: {selectedRepo.owner}/{selectedRepo.repo} ✅
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default GithubRepoSelector;
