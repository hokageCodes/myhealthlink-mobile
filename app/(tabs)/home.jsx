import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../src/store/authStore';
import { healthAPI } from '../../src/api/health';
import { documentsAPI } from '../../src/api/documents';
import { appointmentsAPI } from '../../src/api/appointments';
import { profileAPI } from '../../src/api/profile';
import ShareLinkModal from '../../components/ShareLinkModal';
import * as SecureStore from 'expo-secure-store';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [healthScore, setHealthScore] = useState(85);
  const [healthScoreLabel, setHealthScoreLabel] = useState('Excellent');
  const [showShareModal, setShowShareModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate health score from metrics
  const calculateHealthScore = (metrics) => {
    if (!metrics || metrics.length === 0) return { score: 85, label: 'Good' };
    
    let score = 100;
    const recentMetrics = metrics.slice(0, 10);
    
    recentMetrics.forEach(metric => {
      if (metric.type === 'blood-pressure' && metric.value) {
        const [systolic, diastolic] = metric.value.split('/').map(Number);
        if (systolic > 140 || diastolic > 90) score -= 15;
        else if (systolic > 130 || diastolic > 85) score -= 8;
      } else if (metric.type === 'weight' || metric.type === 'glucose') {
        // Add more scoring logic as needed
      }
    });
    
    score = Math.max(0, Math.min(100, score));
    let label = 'Excellent';
    if (score < 60) label = 'Needs Attention';
    else if (score < 75) label = 'Fair';
    else if (score < 90) label = 'Good';
    
    return { score, label };
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get access token
  const getToken = async () => {
    return await SecureStore.getItemAsync('accessToken');
  };

  // Fetch profile data
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await profileAPI.getProfile();
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });

  // Fetch health summary
  const { data: healthSummary, isLoading: healthLoading } = useQuery({
    queryKey: ['healthSummary'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await healthAPI.getSummary(30);
    },
    enabled: !!user,
  });

  // Fetch recent health metrics
  const { data: recentMetrics } = useQuery({
    queryKey: ['recentMetrics'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = await healthAPI.getMetrics({ limit: 5 });
      // Handle different response structures
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user,
  });

  // Fetch documents
  const { data: documentsResponse } = useQuery({
    queryKey: ['documentsCount'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = await documentsAPI.getDocuments({ limit: 100 });
      // Handle response structure
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user,
  });

  // Fetch appointments
  const { data: appointmentsResponse } = useQuery({
    queryKey: ['appointmentsCount'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = await appointmentsAPI.getUpcomingAppointments(10);
      // Handle response structure
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user,
  });

  // Update health score when metrics change
  useEffect(() => {
    if (recentMetrics) {
      const { score, label } = calculateHealthScore(Array.isArray(recentMetrics) ? recentMetrics : []);
      setHealthScore(score);
      setHealthScoreLabel(label);
    }
  }, [recentMetrics]);

  // Build activity feed from recent data
  const activities = [];
  const metricsArray = Array.isArray(recentMetrics) ? recentMetrics : [];
  const documentsArray = Array.isArray(documentsResponse) ? documentsResponse : [];
  const appointmentsArray = Array.isArray(appointmentsResponse) ? appointmentsResponse : [];
  
  if (metricsArray.length > 0) {
    metricsArray.slice(0, 2).forEach(metric => {
      activities.push({
        id: metric._id || metric.id,
        type: 'metric',
        title: `${metric.type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Recorded`,
        time: formatTimeAgo(metric.date || metric.createdAt),
        icon: 'heart',
        color: '#ef4444',
      });
    });
  }
  
  if (documentsArray.length > 0) {
    const latestDoc = documentsArray[0];
    activities.push({
      id: latestDoc._id || latestDoc.id,
      type: 'document',
      title: `${latestDoc.title || 'Document'} Added`,
      time: formatTimeAgo(latestDoc.uploadedAt || latestDoc.createdAt),
      icon: 'document-text',
      color: '#3b82f6',
    });
  }

  const documentsCount = documentsArray.length;
  const appointmentsCount = appointmentsArray.length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries([
      'userProfile',
      'healthSummary',
      'recentMetrics',
      'documentsCount',
      'appointmentsCount'
    ]);
    setRefreshing(false);
  };

  const quickActions = [
    {
      id: 1,
      title: 'Add Health Metric',
      icon: 'heart',
      color: '#ef4444',
      route: '/health',
      action: 'navigate',
    },
    {
      id: 2,
      title: 'Upload Document',
      icon: 'document-text',
      color: '#3b82f6',
      route: '/documents',
      action: 'navigate',
    },
    {
      id: 3,
      title: 'Share Profile',
      icon: 'share-social',
      color: '#16a34a',
      route: null,
      action: 'share',
    },
    {
      id: 4,
      title: 'Emergency Info',
      icon: 'alert-circle',
      color: '#f59e0b',
      route: '/profile',
      action: 'navigate',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              {(profileData?.data?.profilePicture || profileData?.profilePicture || user?.profilePicture) ? (
                <Image 
                  source={{ uri: profileData?.data?.profilePicture || profileData?.profilePicture || user?.profilePicture }} 
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Ionicons name="person" size={24} color="#16a34a" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => setShowShareModal(true)}
            >
              <Ionicons name="share-outline" size={24} color="#16a34a" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="notifications-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Score Card */}
        <View style={styles.healthScoreCard}>
          <View style={styles.healthScoreHeader}>
            <Ionicons name="heart" size={24} color="#ef4444" />
            <Text style={styles.healthScoreTitle}>Health Score</Text>
          </View>
          <View style={styles.healthScoreContent}>
            {healthLoading ? (
              <ActivityIndicator size="large" color="#16a34a" />
            ) : (
              <>
                <Text style={styles.healthScoreValue}>{healthScore}</Text>
                <Text style={styles.healthScoreLabel}>{healthScoreLabel}</Text>
              </>
            )}
          </View>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push('/(tabs)/health')}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => {
                  if (action.action === 'share') {
                    setShowShareModal(true);
                  } else {
                    router.push(`/(tabs)${action.route}`);
                  }
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {activities.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {activities.length > 0 ? (
            <View style={styles.activityCard}>
              {activities.slice(0, 2).map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                    <Ionicons name={activity.icon} size={20} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent activity</Text>
            </View>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="document-text" size={24} color="#3b82f6" />
            <Text style={styles.summaryValue}>{documentsCount}</Text>
            <Text style={styles.summaryLabel}>Documents</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="calendar" size={24} color="#10b981" />
            <Text style={styles.summaryValue}>{appointmentsCount}</Text>
            <Text style={styles.summaryLabel}>Appointments</Text>
          </View>
        </View>
      </ScrollView>

      {/* Share Link Modal */}
      <ShareLinkModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        username={user?.username}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    gap: 4,
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  profilePhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthScoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  healthScoreContent: {
    alignItems: 'center',
    marginVertical: 16,
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 4,
  },
  healthScoreLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginRight: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
