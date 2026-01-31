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

/* ---------------- PROBLEM GENERATION ---------------- */

export const generateProblem = async ({ topicId, difficulty }) => {
  const res = await api.post("/codex/ai/generate", {
    topicId,
    difficulty
  });
  return res.data; // full problem object
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
