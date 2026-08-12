import api from "./api";

let cache = { value: null, ts: 0 };
const TTL_MS = 15_000;

export const dashboardService = {
  getStats: async () => {
    const now = Date.now();
    if (cache.value && now - cache.ts < TTL_MS) return cache.value;
    const response = await api.get("/dashboard/stats");
    cache = { value: response.data, ts: now };
    return response.data;
  },
  getRecentActivities: async () => {
    const response = await api.get("/dashboard/recent-activities");
    return response.data;
  },
};
