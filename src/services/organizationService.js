import api from "./api";

export const organizationService = {
  getAll: async (params) => {
    const response = await api.get("/organizations", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/organizations", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/organizations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },
};

