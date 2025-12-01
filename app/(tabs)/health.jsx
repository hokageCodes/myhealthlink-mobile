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
import { healthAPI } from '../../src/api/health';
import { exportAPI } from '../../src/api/export';
import useAuthStore from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import HealthMetricCard from '../../components/HealthMetricCard';
import HealthMetricForm from '../../components/HealthMetricForm';
import HealthMetricChart from '../../components/HealthMetricChart';
import HealthInsights from '../../components/HealthInsights';

const METRIC_TYPES = [
  { type: 'all', label: 'All', icon: 'grid' },
  { type: 'bloodPressure', label: 'Blood Pressure', icon: 'pulse' },
  { type: 'weight', label: 'Weight', icon: 'scale' },
  { type: 'glucose', label: 'Glucose', icon: 'flask' },
  { type: 'heartRate', label: 'Heart Rate', icon: 'heart' },
  { type: 'temperature', label: 'Temperature', icon: 'thermometer' },
  { type: 'oxygenSaturation', label: 'Oxygen', icon: 'air' },
];

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

export default function HealthScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, year

  // Fetch health metrics
  const {
    data: metricsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['healthMetrics', selectedFilter],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const params = { limit: 100 };
      if (selectedFilter !== 'all') {
        params.type = selectedFilter;
      }
      const response = await healthAPI.getMetrics(params);
      // Handle both array and object responses
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

  const allMetrics = Array.isArray(metricsResponse) ? metricsResponse : [];

  // Filter by date
  const getFilteredMetricsByDate = () => {
    if (dateFilter === 'all') return allMetrics;
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate;
    switch (dateFilter) {
      case 'today':
        startDate = startOfDay;
        break;
      case 'week':
        startDate = new Date(startOfDay);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(startOfDay);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(startOfDay);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        return allMetrics;
    }
    
    return allMetrics.filter(metric => {
      const metricDate = new Date(metric.date || metric.createdAt);
      return metricDate >= startDate;
    });
  };

  const metrics = getFilteredMetricsByDate();

  // Add metric mutation
  const addMetricMutation = useMutation({
    mutationFn: async (metricData) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await healthAPI.addMetric(metricData);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Health metric added successfully',
      });
      setShowForm(false);
      queryClient.invalidateQueries(['healthMetrics']);
      queryClient.invalidateQueries(['healthSummary']);
      queryClient.invalidateQueries(['recentMetrics']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to add health metric',
      });
    },
  });

  // Update metric mutation
  const updateMetricMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await healthAPI.updateMetric(id, data);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Health metric updated successfully',
      });
      setEditingMetric(null);
      setShowForm(false);
      queryClient.invalidateQueries(['healthMetrics']);
      queryClient.invalidateQueries(['healthSummary']);
      queryClient.invalidateQueries(['recentMetrics']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to update health metric',
      });
    },
  });

  // Delete metric mutation
  const deleteMetricMutation = useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await healthAPI.deleteMetric(id);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Health metric deleted successfully',
      });
      queryClient.invalidateQueries(['healthMetrics']);
      queryClient.invalidateQueries(['healthSummary']);
      queryClient.invalidateQueries(['recentMetrics']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to delete health metric',
      });
    },
  });

  const handleAdd = () => {
    setEditingMetric(null);
    setShowForm(true);
  };

  const handleEdit = (metric) => {
    setEditingMetric(metric);
    setShowForm(true);
  };

  const handleDelete = (metric) => {
    Alert.alert(
      'Delete Metric',
      'Are you sure you want to delete this health metric? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMetricMutation.mutate(metric._id || metric.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = (metricData) => {
    if (editingMetric) {
      updateMetricMutation.mutate({
        id: editingMetric._id || editingMetric.id,
        data: metricData,
      });
    } else {
      addMetricMutation.mutate(metricData);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFilterChange = (type) => {
    setSelectedFilter(type);
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
  };

  // Group metrics by date
  const groupMetricsByDate = (metricsData) => {
    const grouped = {};
    metricsData.forEach(metric => {
      const date = new Date(metric.date || metric.createdAt);
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(metric);
    });
    
    // Sort groups by date (most recent first)
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      return new Date(b) - new Date(a);
    });
    
    return sortedKeys.map(key => ({ date: key, metrics: grouped[key] }));
  };

  const handleExport = async () => {
    try {
      await exportAPI.exportCSV('metrics');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Health data exported successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to export health data',
      });
    }
  };

  const isLoadingData = isLoading || addMetricMutation.isLoading || updateMetricMutation.isLoading || deleteMetricMutation.isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health Metrics</Text>
        <View style={styles.headerActions}>
          {metrics.length > 0 && (
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <Ionicons name="download-outline" size={24} color="#16a34a" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {METRIC_TYPES.map((filter) => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterChip,
              selectedFilter === filter.type && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange(filter.type)}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={selectedFilter === filter.type ? '#16a34a' : '#6b7280'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.type && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date Filter Tabs */}
      <View style={styles.dateFilterContainer}>
        {['all', 'today', 'week', 'month', 'year'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.dateFilterChip,
              dateFilter === filter && styles.dateFilterChipActive,
            ]}
            onPress={() => handleDateFilterChange(filter)}
          >
            <Text
              style={[
                styles.dateFilterText,
                dateFilter === filter && styles.dateFilterTextActive,
              ]}
            >
              {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error Loading Metrics</Text>
          <Text style={styles.emptyText}>
            {error.message || 'Failed to load health metrics. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : metrics.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>No Metrics Yet</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? 'Start tracking your health by adding your first metric'
                : `No ${METRIC_TYPES.find((f) => f.type === selectedFilter)?.label.toLowerCase()} metrics yet`}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAdd}>
              <Text style={styles.primaryButtonText}>Add Your First Metric</Text>
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
          {/* Chart Section - Show when specific metric type is selected */}
          {selectedFilter !== 'all' && (
            <HealthMetricChart 
              metrics={metrics.filter(m => m.type === selectedFilter)} 
              type={selectedFilter} 
            />
          )}

          {/* Health Insights */}
          {selectedFilter !== 'all' && (
            <HealthInsights
              metrics={metrics.filter(m => m.type === selectedFilter)}
              type={selectedFilter}
            />
          )}
          
          {/* Metrics List - Grouped by Date */}
          {groupMetricsByDate(metrics).map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <Text style={styles.dateGroupTitle}>{group.date}</Text>
              <View style={styles.metricsContainer}>
                {group.metrics.map((metric) => (
                  <HealthMetricCard
                    key={metric._id || metric.id}
                    metric={metric}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            </View>
          ))}
          {isLoadingData && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#16a34a" />
            </View>
          )}
        </ScrollView>
      )}

      {/* Add/Edit Form Modal */}
      <HealthMetricForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingMetric(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingMetric}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  dateFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  dateFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  dateFilterChipActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dateFilterTextActive: {
    color: '#16a34a',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  metricsContainer: {
    paddingHorizontal: 16,
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

