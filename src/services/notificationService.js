import api from "./api";

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get("/notifications");
    return response.data?.data || [];
  },
  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data?.data;
  },
  deleteNotification: async (id) => api.delete(`/notifications/${id}`),
};
