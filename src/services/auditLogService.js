import api from "./api";

export const auditLogService = {
  /**
   * Get audit logs with filtering, pagination, and sorting
   */
  getAll: async (params = {}) => {
    const response = await api.get("/audit-logs", { params });
    return response.data;
  },

  /**
   * Export audit logs as CSV
   */
  exportCSV: async (params = {}) => {
    const response = await api.get("/audit-logs", { 
      params: { ...params, limit: 10000 }, // Get more records for export
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Get recent critical actions (for super admin notifications)
   */
  getRecentCritical: async (since = null) => {
    const params = since ? { since } : {};
    const response = await api.get("/audit-logs/recent-critical", { params });
    return response.data;
  },

  /**
   * Get audit log statistics
   */
  getStats: async (params = {}) => {
    const response = await api.get("/audit-logs/stats", { params });
    return response.data;
  },
};
