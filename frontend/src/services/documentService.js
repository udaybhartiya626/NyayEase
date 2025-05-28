import api from './api';

/**
 * Document Service
 * Handles document uploads, retrieval and management
 */
const documentService = {
  /**
   * Get all documents for a case
   * @param {String} caseId - Case ID
   * @returns {Promise} - API response
   */
  getCaseDocuments: async (caseId) => {
    const response = await api.get(`/cases/${caseId}/documents`);
    return response.data;
  },
  
  /**
   * Get document by ID
   * @param {String} documentId - Document ID
   * @returns {Promise} - API response
   */
  getDocumentById: async (documentId) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },
  
  /**
   * Upload document for a case
   * @param {String} caseId - Case ID
   * @param {File} file - File to upload
   * @param {Object} metadata - Document metadata (name, description, etc.)
   * @returns {Promise} - API response
   */
  uploadDocument: async (caseId, file, metadata = {}) => {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('document', file);
    
    // Add metadata
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    
    // Custom config for file upload
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await api.post(`/cases/${caseId}/documents`, formData, config);
    return response.data;
  },
  
  /**
   * Download document
   * @param {String} documentId - Document ID
   * @returns {Promise} - API response as blob
   */
  downloadDocument: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Try to get filename from response headers
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'document';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  },
  
  /**
   * Delete document
   * @param {String} documentId - Document ID
   * @returns {Promise} - API response
   */
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  }
};

export default documentService; 