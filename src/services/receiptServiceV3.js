import api from "./api";

/**
 * Receipt Service V3
 * Production-grade receipt API client
 */
export const receiptServiceV3 = {
  /**
   * Create a receipt (record payment)
   */
  create: async (data) => {
    const response = await api.post("/v3/receipts", data);
    return response.data;
  },

  /**
   * Create a receipt with proof file upload
   */
  createWithProof: async (invoiceId, formData) => {
    const response = await api.post(`/v3/receipts/invoice/${invoiceId}/with-proof`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Get receipts for an invoice
   */
  getByInvoice: async (invoiceId) => {
    const response = await api.get(`/v3/receipts/invoice/${invoiceId}`);
    return response.data;
  },

  /**
   * Get single receipt
   */
  getById: async (id) => {
    const response = await api.get(`/v3/receipts/${id}`);
    return response.data;
  },

  /**
   * Reverse a receipt
   */
  reverse: async (id, reason) => {
    const response = await api.post(`/v3/receipts/${id}/reverse`, { reason });
    return response.data;
  },
};
