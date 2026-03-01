import { create } from 'zustand';
import api from '../components/api';

const useUserStatsStore = create((set) => ({
  tokens: 100,
  currentStreak: 0,
  longestStreak: 0,
  dailyActivityMap: {},
  coreProblemsSolved: 0,
  sandboxProblemsAttempted: 0,
  isLoading: false,
  error: null,

  // Fetch stats from server
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get("/api/codex/stats");
      const data = res.data;
      set({
        tokens: data.tokens,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        dailyActivityMap: data.dailyActivityMap || {},
        coreProblemsSolved: data.coreProblemsSolved,
        sandboxProblemsAttempted: data.sandboxProblemsAttempted,
        isLoading: false
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      set({ isLoading: false, error: err.message });
    }
  },

  // Deduct tokens for sandbox generation
  deductTokens: async (amount) => {
    try {
      const res = await api.post("/api/codex/stats/deduct", { amount });
      set({ tokens: res.data.tokens });
      return res.data;
    } catch (err) {
      console.error("Failed to deduct tokens:", err);
      throw err;
    }
  },

  // Update daily activity when solving a problem
  updateDailyActivity: async (problemType = "core", tokensEarned = 10) => {
    try {
      const res = await api.post("/api/codex/stats/daily", { 
        problemType, 
        tokensEarned 
      });
      set({
        currentStreak: res.data.currentStreak,
        longestStreak: res.data.longestStreak,
        tokens: res.data.tokens
      });
      return res.data;
    } catch (err) {
      console.error("Failed to update daily activity:", err);
      throw err;
    }
  },

  // Increment core problems solved locally
  incrementSolved: () => set((state) => ({ 
    coreProblemsSolved: state.coreProblemsSolved + 1 
  })),

  // Add tokens (bonus)
  addTokens: async (amount) => {
    try {
      const res = await api.post("/api/codex/stats/add", { amount });
      set({ tokens: res.data.tokens });
      return res.data;
    } catch (err) {
      console.error("Failed to add tokens:", err);
      throw err;
    }
  }
}));

export default useUserStatsStore;
