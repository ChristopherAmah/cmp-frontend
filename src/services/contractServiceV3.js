import api from "./api";

/**
 * Modern Contracts Service - V3
 * Enterprise-grade contract management API client
 */
export const contractServiceV3 = {
  /**
   * Get all contracts with filters
   */
  getAll: async (params = {}) => {
    const response = await api.get("/v3/contracts", { params });
    return response.data;
  },

  /**
   * Get contract metrics
   */
  getMetrics: async (params = {}) => {
    const response = await api.get("/v3/contracts/metrics", { params });
    return response.data;
  },

  /**
   * Get single contract by ID
   */
  getById: async (id) => {
    const response = await api.get(`/v3/contracts/${id}`);
    return response.data;
  },

  /**
   * Create new contract
   */
  create: async (data) => {
    const response = await api.post("/v3/contracts", data);
    return response.data;
  },

  /**
   * Update contract
   */
  update: async (id, data) => {
    const response = await api.patch(`/v3/contracts/${id}`, data);
    return response.data;
  },

  /**
   * Update contract status
   */
  updateStatus: async (id, status, note) => {
    const response = await api.patch(`/v3/contracts/${id}/status`, {
      status,
      note,
    });
    return response.data;
  },

  /**
   * Delete (archive) contract
   */
  delete: async (id) => {
    const response = await api.delete(`/v3/contracts/${id}`);
    return response.data;
  },
};
