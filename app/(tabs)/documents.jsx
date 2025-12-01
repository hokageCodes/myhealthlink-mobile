import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { documentsAPI } from '../../src/api/documents';
import useAuthStore from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import DocumentCard from '../../components/DocumentCard';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

const CATEGORIES = [
  { value: 'lab-results', label: 'Lab Results', icon: 'flask' },
  { value: 'prescriptions', label: 'Prescriptions', icon: 'medical' },
  { value: 'medical-reports', label: 'Medical Reports', icon: 'document-text' },
  { value: 'imaging', label: 'Imaging', icon: 'images' },
  { value: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark' },
  { value: 'insurance', label: 'Insurance', icon: 'card' },
  { value: 'other', label: 'Other', icon: 'folder' },
];

export default function DocumentsScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch documents
  const {
    data: documentsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = await documentsAPI.getDocuments({ limit: 100 });
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const documents = Array.isArray(documentsResponse) ? documentsResponse : [];

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await documentsAPI.deleteDocument(documentId);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Document deleted successfully',
      });
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['documentsCount']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to delete document',
      });
    },
  });

  // Upload document
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Show category picker
      Alert.alert(
        'Select Category',
        'Choose a category for this document',
        CATEGORIES.map(cat => ({
          text: cat.label,
          onPress: () => uploadFile(file, cat.value),
        })).concat({
          text: 'Cancel',
          style: 'cancel',
        })
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to pick document',
      });
    }
  };

  const uploadFile = async (file, category) => {
    try {
      const metadata = {
        category,
        title: file.name || 'Untitled Document',
        description: '',
        date: new Date().toISOString(),
      };

      const response = await documentsAPI.uploadDocument(file, metadata);

      if (response.success || response.data) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Document uploaded successfully',
        });
        queryClient.invalidateQueries(['documents']);
        queryClient.invalidateQueries(['documentsCount']);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to upload document',
      });
    }
  };

  const handleDelete = (document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDocumentMutation.mutate(document._id || document.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const isLoadingData = isLoading || deleteDocumentMutation.isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleUpload}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error Loading Documents</Text>
          <Text style={styles.emptyText}>
            {error.message || 'Failed to load documents. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : documents.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>No Documents Yet</Text>
            <Text style={styles.emptyText}>
              Store and organize your medical records, lab results, and prescriptions
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleUpload}>
              <Text style={styles.primaryButtonText}>Upload Your First Document</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {documents.map((document) => (
            <DocumentCard
              key={document._id || document.id}
              document={document}
              onDelete={handleDelete}
            />
          ))}
          {isLoadingData && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#16a34a" />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      },
      android: {
        elevation: 2,
        backgroundColor: '#ffffff',
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    minHeight: 400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});
