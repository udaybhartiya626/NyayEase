import api from './api';

/**
 * Notification Service
 * Handles operations related to user notifications
 */
const notificationService = {
  /**
   * Get all notifications for the current user
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  
  /**
   * Mark a notification as read
   * @param {String} notificationId - Notification ID
   * @returns {Promise} - API response
   */
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  /**
   * Mark all notifications as read
   * @returns {Promise} - API response
   */
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  
  /**
   * Get unread notification count
   * @returns {Promise} - API response
   */
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Make a payment for a notification
   * @param {String} notificationId - Notification ID
   * @param {Number} amount - Payment amount
   * @returns {Promise} - API response
   */
  makePayment: async (notificationId) => {
    const response = await api.post('/payment', {
      notificationId: notificationId
    });
    return response.data;
  }
};

export default notificationService;