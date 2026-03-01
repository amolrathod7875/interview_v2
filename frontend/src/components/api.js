import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
});

/* ---------------- TOPICS ---------------- */

export const fetchTopics = async () => {
  const res = await api.get("/codex/ai/topics");
  return res.data;
};

/* ---------------- CORE PROBLEMS ---------------- */

export const fetchCoreProblems = async (params = {}) => {
  const res = await api.get("/api/codex/core", { params });
  return res.data;
};

export const fetchCoreProblem = async (id) => {
  const res = await api.get(`/api/codex/core/${id}`);
  return res.data;
};

export const submitCoreSolution = async ({ problemId, code, language }) => {
  const res = await api.post("/api/codex/core/submit", {
    problemId, code, language
  });
  return res.data;
};

/* ---------------- USER STATS ---------------- */

export const fetchUserStats = async () => {
  const res = await api.get("/api/codex/stats");
  return res.data;
};

export const updateDailyActivity = async (problemType, tokensEarned) => {
  const res = await api.post("/api/codex/stats/daily", {
    problemType,
    tokensEarned
  });
  return res.data;
};

export const deductTokens = async (amount) => {
  const res = await api.post("/api/codex/stats/deduct", { amount });
  return res.data;
};

/* ---------------- SANDBOX (AI PROBLEMS) ---------------- */

export const generateProblem = async ({ topicId, difficulty }) => {
  // Now includes token deduction
  const res = await api.post("/codex/ai/generate", {
    topicId, difficulty
  });
  return res.data;
};

/* ---------------- CODE EXECUTION ---------------- */

export const executeCode = async (language, code) => {
  const res = await api.post("/codex/code/execute", {
    language,
    code
  });
  return res.data;
};

/* ---------------- CODE ANALYSIS ---------------- */

export const analyzeCode = async ({ problemId, code }) => {
  const res = await api.post("/codex/ai/analyze", {
    problemId,
    code
  });
  return res.data; // structured analysis JSON
};

export default api;
