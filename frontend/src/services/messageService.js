import api from './api';

const messageService = {
  // Send a message to another user
  sendMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  // Get all messages for the current user
  getMessages: async () => {
    const response = await api.get('/messages');
    return response.data;
  },

  // Mark a message as read
  markAsRead: async (messageId) => {
    const response = await api.put(`/messages/${messageId}/read`, {});
    return response.data;
  }
};

export default messageService; 