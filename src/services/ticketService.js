import api from './api';

export const ticketService = {
  getTickets: async () => {
    const response = await api.get('/tickets');
    return response.data?.data || [];
  },
  updateTicket: async (ticketId, updates) => {
    const response = await api.patch(`/tickets/${ticketId}`, updates);
    return response.data?.data;
  },
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data?.data;
  },
  getComments: async (ticketId) => (await api.get(`/tickets/${ticketId}/comments`)).data?.data || [],
  createComment: async (ticketId, body) => (await api.post(`/tickets/${ticketId}/comments`, { body })).data?.data,
  getTasks: async (ticketId) => (await api.get(`/tickets/${ticketId}/tasks`)).data?.data || [],
  createTask: async (ticketId, task) => (await api.post(`/tickets/${ticketId}/tasks`, task)).data?.data,
  updateTask: async (ticketId, taskId, updates) => (await api.patch(`/tickets/${ticketId}/tasks/${taskId}`, updates)).data?.data,
  getAttachments: async (ticketId) => (await api.get(`/tickets/${ticketId}/attachments`)).data?.data || [],
  uploadAttachment: async (ticketId, formData) => (await api.post(`/tickets/${ticketId}/attachments/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } })).data?.data,
  downloadAttachment: async (ticketId, attachmentId) => (await api.get(`/tickets/${ticketId}/attachments/${attachmentId}/download`, { responseType: "blob" })).data,
};
