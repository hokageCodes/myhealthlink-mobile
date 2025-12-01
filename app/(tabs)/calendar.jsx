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
import { appointmentsAPI } from '../../src/api/appointments';
import useAuthStore from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import AppointmentCard from '../../components/AppointmentCard';
import AppointmentForm from '../../components/AppointmentForm';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

export default function CalendarScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch appointments
  const {
    data: appointmentsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['appointments', selectedFilter],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = await appointmentsAPI.getAppointments({ limit: 100 });
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

  const appointments = Array.isArray(appointmentsResponse) ? appointmentsResponse : [];

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'upcoming') {
      return new Date(appointment.date) > new Date() && appointment.status !== 'cancelled';
    }
    return appointment.status === selectedFilter;
  });

  // Sort by date (upcoming first)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  // Add appointment mutation
  const addAppointmentMutation = useMutation({
    mutationFn: async (appointmentData) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await appointmentsAPI.createAppointment(appointmentData);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Appointment created successfully',
      });
      setShowForm(false);
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['appointmentsCount']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to create appointment',
      });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await appointmentsAPI.updateAppointment(id, data);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Appointment updated successfully',
      });
      setEditingAppointment(null);
      setShowForm(false);
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['appointmentsCount']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to update appointment',
      });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await appointmentsAPI.deleteAppointment(id);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Appointment deleted successfully',
      });
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['appointmentsCount']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to delete appointment',
      });
    },
  });

  const handleAdd = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = (appointment) => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete "${appointment.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAppointmentMutation.mutate(appointment._id || appointment.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = (appointmentData) => {
    if (editingAppointment) {
      updateAppointmentMutation.mutate({
        id: editingAppointment._id || editingAppointment.id,
        data: appointmentData,
      });
    } else {
      addAppointmentMutation.mutate(appointmentData);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const isLoadingData = isLoading || addAppointmentMutation.isLoading || updateAppointmentMutation.isLoading || deleteAppointmentMutation.isLoading;

  const filters = [
    { value: 'upcoming', label: 'Upcoming', icon: 'calendar' },
    { value: 'all', label: 'All', icon: 'list' },
    { value: 'completed', label: 'Completed', icon: 'checkmark-circle' },
    { value: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
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
              style={{ marginRight: 6 }}
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
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error Loading Appointments</Text>
          <Text style={styles.emptyText}>
            {error.message || 'Failed to load appointments. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sortedAppointments.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>No Appointments Yet</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? 'Schedule your first medical appointment'
                : `No ${filters.find((f) => f.value === selectedFilter)?.label.toLowerCase()} appointments`}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAdd}>
              <Text style={styles.primaryButtonText}>Schedule Appointment</Text>
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
          {sortedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id || appointment.id}
              appointment={appointment}
              onEdit={handleEdit}
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

      {/* Add/Edit Form Modal */}
      <AppointmentForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAppointment(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingAppointment}
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
  filterScroll: {
    maxHeight: 60,
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
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
