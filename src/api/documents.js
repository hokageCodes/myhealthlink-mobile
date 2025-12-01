import apiClient from './client';

export const documentsAPI = {
  // Get all documents
  getDocuments: async (params = {}) => {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  },

  // Get single document
  getDocument: async (documentId) => {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response.data;
  },

  // Upload document
  uploadDocument: async (file, metadata) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'document.jpg',
    });
    formData.append('category', metadata.category);
    formData.append('title', metadata.title);
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.date) {
      formData.append('date', metadata.date);
    }

    const response = await apiClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update document
  updateDocument: async (documentId, data) => {
    const response = await apiClient.put(`/documents/${documentId}`, data);
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  // Get document categories
  getCategories: async () => {
    const response = await apiClient.get('/documents/categories');
    return response.data;
  },

  // Download document (returns URL or blob)
  downloadDocument: async (documentId) => {
    const response = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

