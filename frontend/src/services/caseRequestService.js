import api from './api';

const caseRequestService = {
  // Get all case requests
  getCaseRequests: async () => {
    const response = await api.get('/case-requests');
    return response.data;
  },

  // Get single case request
  getCaseRequest: async (id) => {
    const response = await api.get(`/case-requests/${id}`);
    return response.data;
  },

  // Create case request
  createCaseRequest: async (data) => {
    const response = await api.post('/case-requests', data);
    return response.data;
  },

  // Respond to case request (advocate)
  respondToCaseRequest: async (id, data) => {
    const response = await api.put(`/case-requests/${id}/respond`, data);
    return response.data;
  },

  // Delete case request
  deleteCaseRequest: async (id) => {
    const response = await api.delete(`/case-requests/${id}`);
    return response.data;
  },

  // Simulate payment (litigant)
  simulatePayment: async (id, paymentDetails) => {
    try {
      const response = await api.post(`/case-requests/${id}/simulate-payment`, paymentDetails);
      return response.data;
    } catch (error) {
      console.error('Error simulating payment:', error);
      throw error; // Re-throw with enhanced error handling
    }
  }
};

export default caseRequestService;