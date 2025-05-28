import api from './api';

/**
 * User Service
 * Handles user profile management and user search
 */
const userService = {
  /**
   * Get current user's profile
   * @returns {Promise} - API response
   */
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Get user profile by ID
   * @param {String} userId - User ID
   * @returns {Promise} - API response
   */
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise} - API response
   */
  updateUserProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  
  /**
   * Search for advocates (filtered by specialization/experience)
   * @param {Object} filters - Query parameters
   * @returns {Promise} - API response
   */
  searchAdvocates: async (filters) => {
    const params = {};
    if (filters.searchQuery) params.searchQuery = filters.searchQuery;
    if (filters.specialization) params.specialization = filters.specialization;
    if (filters.experience) params.experience = filters.experience;
    
    const response = await api.get('/users/advocates', { params });
    return response.data;
  },
  
  /**
   * Get all users (Court Officer only)
   * @returns {Promise} - API response
   */
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  }
};

export default userService; 