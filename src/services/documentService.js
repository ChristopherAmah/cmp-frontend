import api from "./api";

export const documentService = {
  getAll: async (organizationIdOrOptions, maybeOptions) => {
    const organizationId =
      typeof organizationIdOrOptions === "string"
        ? organizationIdOrOptions
        : undefined;
    const options =
      typeof organizationIdOrOptions === "object" &&
      organizationIdOrOptions !== null
        ? organizationIdOrOptions
        : maybeOptions || {};

    const params = {
      ...(organizationId ? { organizationId } : {}),
      ...(options || {}),
    };
    const response = await api.get("/documents", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  upload: async (organizationId, formData) => {
    // If organizationId is a FormData, it means old call pattern
    if (organizationId instanceof FormData) {
      formData = organizationId;
    } else if (organizationId && formData) {
      formData.append("organizationId", organizationId);
    }
    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  download: async (id) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  preview: async (id) => {
    try {
      const response = await api.get(`/documents/${id}/view`, {
        responseType: "blob",
        timeout: 60000, // 60 second timeout for PDF streaming
      });
      
      // Verify the blob is a PDF
      if (response.data && response.data.type) {
        if (!response.data.type.includes("pdf") && !response.data.type.includes("octet-stream")) {
          console.warn("Received non-PDF content type:", response.data.type);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("Error previewing document:", error);
      if (error.response) {
        // Server responded with error
        throw new Error(error.response.data?.message || `Failed to load document: ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response
        throw new Error("Network error: Could not connect to server. Please check your connection.");
      } else {
        // Error setting up request
        throw new Error(error.message || "Failed to preview document");
      }
    }
  },

  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

