import apiClient from './client';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export const exportAPI = {
  // Export health data as JSON
  exportJSON: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    try {
      const response = await apiClient.get(`/export/json?${queryParams}`);
      
      console.log('Export JSON response:', {
        status: response.status,
        contentType: response.headers['content-type'],
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : null,
      });

      // Create a temporary file
      const uri = FileSystem.documentDirectory + `health-data-${Date.now()}.json`;
      const jsonString = JSON.stringify(response.data, null, 2);
      await FileSystem.writeAsStringAsync(uri, jsonString);

      console.log('File created at:', uri);

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        throw new Error('Sharing is not available on this device');
      }

      return { success: true };
    } catch (error) {
      console.error('Export JSON error:', error);
      throw error;
    }
  },

  // Export health data as CSV
  exportCSV: async (type = 'metrics') => {
    try {
      const response = await apiClient.get(`/export/csv?type=${type}`, {
        responseType: 'text',
      });

      console.log('Export CSV response:', {
        status: response.status,
        contentType: response.headers['content-type'],
        dataType: typeof response.data,
        dataLength: response.data?.length,
      });

      // Get the CSV data from response
      const csvData = response.data;

      if (!csvData || csvData.trim() === '') {
        throw new Error('No data to export');
      }

      // Create a temporary file
      const uri = FileSystem.documentDirectory + `${type}-export-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(uri, csvData);

      console.log('CSV file created at:', uri);

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        throw new Error('Sharing is not available on this device');
      }

      return { success: true };
    } catch (error) {
      console.error('Export CSV error:', error);
      throw error;
    }
  },

  // Export PDF (if backend supports it)
  exportPDF: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    try {
      const response = await apiClient.get(`/export/pdf?${queryParams}`, {
        responseType: 'blob',
      });

      // Create a temporary file
      const uri = FileSystem.documentDirectory + `health-report-${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(uri, response.data);

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};

