import { useEffect, useState } from "react";
import axios from "axios";
import { fetchGithubRepos } from "../services/github.service";

const API = import.meta.env.VITE_API_BASE_URL;

const GithubRepoSelector = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRepos = async () => {
      try {
        const data = await fetchGithubRepos();
        setRepos(data);
      } catch (err) {
        console.error("Repo fetch failed:", err);
        setError("Failed to load GitHub repositories");
      } finally {
        setLoading(false);
      }
    };

    loadRepos();
  }, []);

  const handleChange = async (e) => {
    const value = e.target.value;
    if (!value || saving) return;

    const [owner, repo] = value.split("/");

    setSaving(true);
    setError(null);

    try {
      await axios.post(`${API}/user/github/repo`, {
        firebaseId: localStorage.getItem("userUid"),
        owner,
        repo,
      });

      setSelectedRepo({ owner, repo });
    } catch (err) {
      console.error("Failed to save repo:", err);
      setError("Failed to save selected repository");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading GitHub repositories…
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <select
        onChange={handleChange}
        className="border border-gray-300 rounded-md p-2 w-full"
        defaultValue=""
        disabled={saving}
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

      {saving && (
        <p className="text-xs text-gray-500">
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
