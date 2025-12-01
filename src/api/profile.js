import apiClient from './client';

export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/profile', profileData);
    return response.data;
  },

  // Upload profile picture
  uploadPicture: async (imageUri, imageType = 'image/jpeg') => {
    const formData = new FormData();
    formData.append('profilePicture', {
      uri: imageUri,
      type: imageType,
      name: 'profile.jpg',
    });

    const response = await apiClient.post('/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Search users by username
  searchByUsername: async (username) => {
    const response = await apiClient.get(`/profile/search/${username}`);
    return response.data;
  },
};

