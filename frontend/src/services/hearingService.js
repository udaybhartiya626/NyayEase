import api from './api';

/**
 * Hearing Service
 * Handles court hearing management
 */
const hearingService = {
  /**
   * Get all hearings
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getAllHearings: async (params = {}) => {
    const response = await api.get('/hearings', { params });
    return response.data;
  },
  
  /**
   * Get user's upcoming hearings
   * @returns {Promise} - API response
   */
  getUpcomingHearings: async () => {
    const response = await api.get('/hearings/upcoming');
    return response.data;
  },
  
  /**
   * Get hearing by ID
   * @param {String} hearingId - Hearing ID
   * @returns {Promise} - API response
   */
  getHearingById: async (hearingId) => {
    const response = await api.get(`/hearings/${hearingId}`);
    return response.data;
  },
  
  /**
   * Schedule a new hearing (Advocate or Judge)
   * @param {Object} hearingData - Hearing data
   * @returns {Promise} - API response
   */
  scheduleHearing: async (hearingData) => {
    const response = await api.post('/hearings', hearingData);
    return response.data;
  },
  
  /**
   * Create a new hearing (Court Officer only)
   * @param {Object} hearingData - Hearing data
   * @returns {Promise} - API response
   */
  createHearing: async (hearingData) => {
    const response = await api.post('/hearings', hearingData);
    return response.data;
  },
  
  /**
   * Update an existing hearing (Court Officer only)
   * @param {String} hearingId - Hearing ID
   * @param {Object} hearingData - Updated hearing data
   * @returns {Promise} - API response
   */
  updateHearing: async (hearingId, hearingData) => {
    const response = await api.put(`/hearings/${hearingId}`, hearingData);
    return response.data;
  },
  
  /**
   * Allocate judge to hearing (Judge only)
   * @param {String} hearingId - Hearing ID
   * @returns {Promise} - API response
   */
  allocateJudge: async (hearingId) => {
    const response = await api.put(`/hearings/${hearingId}/allocate-judge`);
    return response.data;
  },
  
  /**
   * Delete a hearing (Court Officer only)
   * @param {String} hearingId - Hearing ID
   * @returns {Promise} - API response
   */
  deleteHearing: async (hearingId) => {
    const response = await api.delete(`/hearings/${hearingId}`);
    return response.data;
  },
  
  /**
   * Update hearing status (Court Officer only)
   * @param {String} hearingId - Hearing ID
   * @param {Object} statusData - Status update data
   * @returns {Promise} - API response
   */
  updateHearingStatus: async (hearingId, statusData) => {
    const response = await api.put(`/hearings/${hearingId}/status`, statusData);
    return response.data;
  }
};

export default hearingService; 