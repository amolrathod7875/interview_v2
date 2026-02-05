const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const fetchGithubRepos = async () => {
  // Get session ID from localStorage
  const sessionId = localStorage.getItem('gh_session');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add Authorization header if session exists
  if (sessionId) {
    headers['Authorization'] = `Bearer ${sessionId}`;
  }

  const res = await fetch(`${API_BASE}/api/github/repos`, {
    method: "GET",
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch GitHub repositories");
  }

  return res.json();
};
