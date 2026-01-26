import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/* ---------------- CODE EXECUTION ---------------- */

export const executeCode = async (language, code) => {
  const res = await api.post("/codex/code/execute", {
    language,
    code,
  });
  return res.data;
};

/* ---------------- PROBLEM GENERATION ---------------- */

export const generateProblem = async () => {
  const res = await api.post("/codex/ai/generate");
  return res.data; // MUST be the full problem object
};

/* ---------------- CODE ANALYSIS ---------------- */

export const analyzeCode = async (problem, code) => {
  const res = await api.post("/codex/ai/analyze", {
    problem,
    code,
  });
  return res.data.analysis;
};
