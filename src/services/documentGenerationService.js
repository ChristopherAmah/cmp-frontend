import api from "./api";

/**
 * Document Generation Service
 * Frontend API client for generating and retrieving invoice/receipt PDFs
 */
export const documentGenerationService = {
  // ============================================================================
  // INVOICE DOCUMENTS
  // ============================================================================

  /**
   * Generate PDF for an invoice
   */
  generateInvoicePdf: async (invoiceId, reason = "initial") => {
    const response = await api.post(
      `/v3/documents/invoices/${invoiceId}/generate`,
      { reason },
      {
        timeout: 60000, // 60 second timeout for PDF generation (longer than default)
      }
    );
    return response.data;
  },

  /**
   * Get invoice as HTML (for preview)
   */
  getInvoiceHtml: async (invoiceId) => {
    const response = await api.get(`/v3/documents/invoices/${invoiceId}/html`, {
      responseType: "text",
    });
    return response.data;
  },

  /**
   * Get all versions of invoice documents
   */
  getInvoiceVersions: async (invoiceId) => {
    const response = await api.get(`/v3/documents/invoices/${invoiceId}/versions`);
    return response.data;
  },

  /**
   * Get latest invoice document
   */
  getLatestInvoiceDocument: async (invoiceId, format = "pdf") => {
    const response = await api.get(`/v3/documents/invoices/${invoiceId}/latest`, {
      params: { format },
    });
    return response.data;
  },

  // ============================================================================
  // RECEIPT DOCUMENTS
  // ============================================================================

  /**
   * Generate PDF for a receipt
   */
  generateReceiptPdf: async (receiptId, reason = "initial") => {
    const response = await api.post(`/v3/documents/receipts/${receiptId}/generate`, {
      reason,
    });
    return response.data;
  },

  /**
   * Get receipt as HTML (for preview)
   */
  getReceiptHtml: async (receiptId) => {
    const response = await api.get(`/v3/documents/receipts/${receiptId}/html`, {
      responseType: "text",
    });
    return response.data;
  },

  /**
   * Get all versions of receipt documents
   */
  getReceiptVersions: async (receiptId) => {
    const response = await api.get(`/v3/documents/receipts/${receiptId}/versions`);
    return response.data;
  },

  /**
   * Get latest receipt document
   */
  getLatestReceiptDocument: async (receiptId, format = "pdf") => {
    const response = await api.get(`/v3/documents/receipts/${receiptId}/latest`, {
      params: { format },
    });
    return response.data;
  },

  // ============================================================================
  // GENERAL
  // ============================================================================

  /**
   * Get a specific generated document by ID
   */
  getDocument: async (documentId) => {
    const response = await api.get(`/v3/documents/${documentId}`);
    return response.data;
  },

  /**
   * Open document in new tab
   */
  openDocument: (url) => {
    window.open(url, "_blank");
  },

  /**
   * Download document (fetches as blob to ensure proper download)
   */
  downloadDocument: async (url, filename) => {
    try {
      // Fetch the file as a blob to ensure proper download
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after download starts
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Error downloading document:", error);
      // Fallback to direct link if blob fetch fails
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "download";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      throw error;
    }
  },
};
