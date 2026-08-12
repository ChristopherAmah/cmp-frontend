import api from "./api";

/**
 * Invoice Service V3
 * Production-grade invoice API client
 */
export const invoiceServiceV3 = {
  /**
   * Get all invoices with filters
   */
  getAll: async (params = {}) => {
    const response = await api.get("/v3/invoices", { params });
    return response.data;
  },

  /**
   * Get single invoice with ledger
   */
  getById: async (id) => {
    const response = await api.get(`/v3/invoices/${id}`);
    return response.data;
  },

  /**
   * Create new invoice
   */
  create: async (data) => {
    const response = await api.post("/v3/invoices", data);
    return response.data;
  },

  /**
   * Update invoice (only draft invoices)
   */
  update: async (id, data) => {
    const response = await api.put(`/v3/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Issue an invoice
   */
  issue: async (id) => {
    const response = await api.post(`/v3/invoices/${id}/issue`);
    return response.data;
  },

  /**
   * Void an invoice
   */
  void: async (id, reason) => {
    const response = await api.post(`/v3/invoices/${id}/void`, { reason });
    return response.data;
  },

  /**
   * Record payment (auto-generates receipt)
   */
  recordPayment: async (id, data) => {
    const response = await api.post(`/v3/invoices/${id}/pay`, data);
    return response.data;
  },
};
