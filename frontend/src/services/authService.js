import api from './api';

/**
 * Authentication Service
 * Handles user registration, login, logout and current user retrieval
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - API response
   */
  register: async (userData) => {
    try {
      // Very verbose logging for debugging
      console.log('==== REGISTRATION DATA ====');
      console.log('Role selected:', userData.role);
      console.log('Full user data:', JSON.stringify(userData, null, 2));
      
      const response = await api.post('/auth/register', userData);
      console.log('Registration API response:', response.data);
      
      // Check the returned user
      if (response.data.user) {
        console.log('Returned user:', response.data.user);
        console.log('User ID:', response.data.user._id);
      }
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration API error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise} - API response
   */
  login: async (credentials) => {
    try {
      // Very verbose logging for debugging
      console.log('==== LOGIN DATA ====');
      console.log('Role selected:', credentials.role);
      console.log('Email:', credentials.email);
      console.log('Password provided:', credentials.password ? 'Yes' : 'No');
      
      const response = await api.post('/auth/login', credentials);
      console.log('Login API response:', response.data);
      
      // Check the returned user
      if (response.data.user) {
        console.log('Returned user:', response.data.user);
        console.log('User ID:', response.data.user._id);
      }
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login API error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Logout user - clear localStorage and cookies
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Optional: Call backend logout endpoint
    return api.get('/auth/logout');
  },
  
  /**
   * Get current logged in user
   * @returns {Promise} - API response with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      console.log('Current user API response:', response.data);
      
      if (response.data.data) {
        console.log('Current user:', response.data.data);
        console.log('Current user ID:', response.data.data._id);
      }
      
      return response.data;
    } catch (error) {
      console.error('Get current user API error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Check if user is logged in
   * @returns {Boolean}
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Get current user from localStorage
   * @returns {Object|null} - User object or null
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      console.log('User from localStorage:', parsedUser);
      console.log('User ID from localStorage:', parsedUser._id);
      return parsedUser;
    }
    return null;
  }
};

export default authService; 