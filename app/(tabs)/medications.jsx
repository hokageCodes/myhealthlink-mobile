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
import { medicationsAPI } from '../../src/api/medications';
import useAuthStore from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import MedicationCard from '../../components/MedicationCard';
import MedicationForm from '../../components/MedicationForm';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

export default function MedicationsScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('active');
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);

  // Fetch medications
  const {
    data: medicationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['medications', selectedFilter],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = selectedFilter === 'active' 
        ? await medicationsAPI.getActiveMedications()
        : await medicationsAPI.getMedications();
      
      if (Array.isArray(response)) return response;
      if (response?.data) return Array.isArray(response.data) ? response.data : [];
      return [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const medications = Array.isArray(medicationsResponse) ? medicationsResponse : [];

  // Add medication mutation
  const addMedicationMutation = useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await medicationsAPI.addMedication(data);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Medication added successfully',
      });
      queryClient.invalidateQueries(['medications']);
      setShowForm(false);
      setEditingMedication(null);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to add medication',
      });
    },
  });

  // Delete medication mutation
  const deleteMedicationMutation = useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await medicationsAPI.deleteMedication(id);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Medication deleted successfully',
      });
      queryClient.invalidateQueries(['medications']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to delete medication',
      });
    },
  });

  const handleAdd = () => {
    setEditingMedication(null);
    setShowForm(true);
  };

  const handleEdit = (medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleSubmit = (data) => {
    if (editingMedication) {
      // TODO: Implement update medication
      Toast.show({
        type: 'info',
        text1: 'Update',
        text2: 'Update medication functionality coming soon',
      });
    } else {
      addMedicationMutation.mutate(data);
    }
  };

  const handleDelete = (medication) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete "${medication.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMedicationMutation.mutate(medication._id || medication.id),
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filters = [
    { value: 'active', label: 'Active', icon: 'checkmark-circle' },
    { value: 'all', label: 'All', icon: 'list' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Medications</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              selectedFilter === filter.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.value)}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={selectedFilter === filter.value ? '#16a34a' : '#6b7280'}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error Loading Medications</Text>
          <Text style={styles.emptyText}>{error.message}</Text>
        </View>
      ) : medications.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyScrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>No Medications Yet</Text>
            <Text style={styles.emptyText}>Start tracking your medications for better health management</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          {medications.map((medication) => (
            <MedicationCard
              key={medication._id || medication.id}
              medication={medication}
              onDelete={handleDelete}
            />
          ))}
        </ScrollView>
      )}

      {/* Add/Edit Form Modal */}
      <MedicationForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingMedication(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingMedication}
      />
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
      ios: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
      android: { elevation: 2, backgroundColor: '#ffffff' },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#16a34a',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  },
});

