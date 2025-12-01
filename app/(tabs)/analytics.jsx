import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { healthAPI } from '../../src/api/health';
import useAuthStore from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import HealthMetricChart from '../../components/HealthMetricChart';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch health metrics
  const {
    data: metricsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics-health', selectedPeriod],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = await healthAPI.getMetrics({ limit: 100 });
      if (Array.isArray(response)) return response;
      if (response?.data) return Array.isArray(response.data) ? response.data : [];
      return [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const metrics = Array.isArray(metricsResponse) ? metricsResponse : [];

  // Group metrics by type
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) acc[metric.type] = [];
    acc[metric.type].push(metric);
    return acc;
  }, {});

  // Calculate stats
  const getStats = (typeMetrics) => {
    if (!typeMetrics || typeMetrics.length === 0) return null;

    const values = typeMetrics.map(m => {
      if (m.value?.systolic) return m.value.systolic;
      if (typeof m.value === 'number') return m.value;
      if (typeof m.value === 'object' && m.value.numeric !== undefined) return m.value.numeric;
      return 0;
    }).filter(v => v > 0);

    if (values.length === 0) return null;

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const recent = values.slice(-7);
    const older = values.slice(-14, -7);
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, v) => sum + v, 0) / older.length : recentAvg;
    const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100).toFixed(0) : 0;

    return { avg, min, max, change: parseFloat(change) };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const periods = [
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
    { value: 'quarter', label: '90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const metricTypes = Object.keys(metricsByType);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {/* Period Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.filterChip,
              selectedPeriod === period.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedPeriod(period.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedPeriod === period.value && styles.filterTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{error.message}</Text>
        </View>
      ) : metricTypes.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyScrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>No Analytics Data</Text>
            <Text style={styles.emptyText}>Start tracking metrics to see analytics</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          {metricTypes.map((type) => {
            const typeMetrics = metricsByType[type];
            const stats = getStats(typeMetrics);
            
            return (
              <View key={type}>
                {/* Chart */}
                <HealthMetricChart metrics={typeMetrics} type={type} />
                
                {/* Stats */}
                {stats && (
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Ionicons name="trending-up-outline" size={20} color="#16a34a" />
                      <Text style={styles.statValue}>{stats.avg.toFixed(1)}</Text>
                      <Text style={styles.statLabel}>Average</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Ionicons name="arrow-down-outline" size={20} color="#3b82f6" />
                      <Text style={styles.statValue}>{stats.min.toFixed(1)}</Text>
                      <Text style={styles.statLabel}>Min</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Ionicons name="arrow-up-outline" size={20} color="#ef4444" />
                      <Text style={styles.statValue}>{stats.max.toFixed(1)}</Text>
                      <Text style={styles.statLabel}>Max</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Ionicons 
                        name={stats.change > 0 ? 'trending-up' : stats.change < 0 ? 'trending-down' : 'remove'} 
                        size={20} 
                        color={stats.change > 0 ? '#ef4444' : stats.change < 0 ? '#16a34a' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.statValue,
                        { color: stats.change > 0 ? '#ef4444' : stats.change < 0 ? '#16a34a' : '#6b7280' }
                      ]}>
                        {stats.change > 0 ? '+' : ''}{stats.change}%
                      </Text>
                      <Text style={styles.statLabel}>Change</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
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
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
});

