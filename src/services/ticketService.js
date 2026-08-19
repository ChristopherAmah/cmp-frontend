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
};
