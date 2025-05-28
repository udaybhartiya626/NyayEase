import api from './api';

/**
 * Case Service
 * Handles CRUD operations for legal cases
 */
const caseService = {
  /**
   * Get all cases (filtered by user role)
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getAllCases: async (params = {}) => {
    const response = await api.get('/cases', { params });
    return response.data;
  },
  
  /**
   * Get a specific case by ID
   * @param {string} id - Case ID
   * @returns {Promise} - API response
   */
  getCase: async (id) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  /**
   * Get a specific case by ID for court officers
   * @param {string} id - Case ID
   * @returns {Promise} - API response
   */
  getCourtCase: async (id) => {
    const response = await api.get(`/cases/court/${id}`);
    return response.data;
  },

  /**
   * Get pending cases for the current user
   * @returns {Promise} - API response
   */
  getPendingCases: async () => {
    const response = await api.get('/cases/pending');
    return response.data;
  },
  
  /**
   * Create a new case
   * @param {Object} caseData - Case data
   * @returns {Promise} - API response
   */
  createCase: async (caseData) => {
    const response = await api.post('/cases', caseData);
    return response.data;
  },
  
  /**
   * Update an existing case
   * @param {String} caseId - Case ID
   * @param {Object} caseData - Updated case data
   * @returns {Promise} - API response
   */
  updateCase: async (caseId, caseData) => {
    const response = await api.put(`/cases/${caseId}`, caseData);
    return response.data;
  },


  
  /**
   * Delete a case
   * @param {String} caseId - Case ID
   * @returns {Promise} - API response
   */
  deleteCase: async (caseId) => {
    const response = await api.delete(`/cases/${caseId}`);
    return response.data;
  },

  /**
   * Schedule a hearing for a case
   * @param {String} caseId - Case ID
   * @param {Object} hearingData - Hearing data including date, type, location, and notes
   * @returns {Promise} - API response
   */
  scheduleHearing: async (caseId, hearingData) => {
    const response = await api.post(`/cases/${caseId}/hearings`, hearingData);
    return response.data;
  },
  
  /**
   * Assign advocate to a case
   * @param {String} caseId - Case ID
   * @param {String} advocateId - Advocate ID
   * @returns {Promise} - API response
   */
  assignAdvocate: async (caseId, advocateId) => {
    const response = await api.put(`/cases/${caseId}/advocates`, { advocateId });
    return response.data;
  },
  
  /**
   * Remove advocate from a case
   * @param {String} caseId - Case ID
   * @param {String} advocateId - Advocate ID to remove
   * @returns {Promise} - API response
   */
  removeAdvocate: async (caseId, advocateId) => {
    const response = await api.delete(`/cases/${caseId}/advocates/${advocateId}`);
    return response.data;
  }
};

export default caseService; 