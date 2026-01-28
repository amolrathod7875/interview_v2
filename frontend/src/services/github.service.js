const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const fetchGithubRepos = async () => {
  const res = await fetch(`${API_BASE}/api/github/repos`, {
    method: "GET",
    credentials: "include", // 🔥 REQUIRED to send cookie
  });

  if (!res.ok) {
    throw new Error("Failed to fetch GitHub repositories");
  }

  return res.json();
};
