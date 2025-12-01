import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import useAuthStore from '../../src/store/authStore';
import SOSButton from '../../components/SOSButton';
import ProfileEditForm from '../../components/ProfileEditForm';
import PrivacySettingsModal from '../../components/PrivacySettingsModal';
import EmergencyContactsModal from '../../components/EmergencyContactsModal';
import SettingsModal from '../../components/SettingsModal';
import { profileAPI } from '../../src/api/profile';
import { healthAPI } from '../../src/api/health';
import * as SecureStore from 'expo-secure-store';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

const formatTimeAgo = (date) => {
  if (!date) return '';
  try {
    const now = new Date();
    const past = new Date(date);
    
    // Check if date is valid
    if (isNaN(past.getTime())) return '';
    
    const diff = now - past;
    
    // Check if diff is valid (positive number)
    if (isNaN(diff) || diff < 0) return '';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    // Format as date if older than 7 days
    const formatted = past.toLocaleDateString();
    return isNaN(past.getTime()) ? '' : formatted;
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return '';
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch full profile data
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await profileAPI.getProfile();
    },
    enabled: !!user,
    staleTime: 300000,
  });

  // Extract actual user data from response
  const userData = profileData?.data || profileData;

  // Fetch last blood pressure reading
  const { data: bpMetrics } = useQuery({
    queryKey: ['lastBP'],
    queryFn: async () => {
      try {
        const token = await getToken();
        if (!token) return null;
        const response = await healthAPI.getMetrics({ type: 'bloodPressure', limit: 1 });
        if (Array.isArray(response)) return response[0] || null;
        if (response?.data) return Array.isArray(response.data) ? response.data[0] || null : null;
        return null;
      } catch (error) {
        console.error('Error fetching last BP:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 300000,
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries(['userProfile']);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Profile updated successfully',
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries(['userProfile', 'lastBP']);
    setRefreshing(false);
  };

  const menuItems = [
    { id: 1, icon: 'person-outline', title: 'Edit Profile', action: () => setShowEditForm(true) },
    { id: 2, icon: 'people-outline', title: 'Emergency Contacts', action: () => setShowEmergencyContacts(true) },
    { id: 3, icon: 'shield-checkmark-outline', title: 'Privacy & Sharing', action: () => setShowPrivacySettings(true) },
    { id: 4, icon: 'settings-outline', title: 'Settings', action: () => setShowSettings(true) },
    { id: 5, icon: 'notifications-outline', title: 'Notifications', action: () => router.push('/(tabs)/notifications') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {(userData?.profilePicture || user?.profilePicture) ? (
              <Image 
                source={{ uri: userData?.profilePicture || user?.profilePicture }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Health Info Quick View */}
        {(userData?.bloodType || userData?.genotype || bpMetrics || userData?.allergies || userData?.chronicConditions || userData?.emergencyContact) && (
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Quick Health Info</Text>
            <View style={styles.healthInfoGrid}>
              {userData?.bloodType && (
                <View style={[styles.healthInfoItem, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
                  <Ionicons name="heart" size={20} color="#ef4444" />
                  <View style={styles.healthInfoContent}>
                    <Text style={styles.healthInfoLabel}>Blood Type</Text>
                    <Text style={[styles.healthInfoValue, { color: '#991b1b' }]}>
                      {userData.bloodType}
                    </Text>
                  </View>
                </View>
              )}
              {userData?.genotype && (
                <View style={[styles.healthInfoItem, { backgroundColor: '#fef3c7', borderColor: '#fbbf24' }]}>
                  <Ionicons name="flask" size={20} color="#f59e0b" />
                  <View style={styles.healthInfoContent}>
                    <Text style={styles.healthInfoLabel}>Genotype</Text>
                    <Text style={[styles.healthInfoValue, { color: '#92400e' }]}>
                      {userData.genotype}
                    </Text>
                  </View>
                </View>
              )}
              {bpMetrics && (
                <View style={[styles.healthInfoItem, styles.healthInfoItemFullWidth, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                  <Ionicons name="pulse" size={20} color="#dc2626" />
                  <View style={styles.healthInfoContent}>
                    <Text style={styles.healthInfoLabel}>Last BP</Text>
                    <Text style={[styles.healthInfoValue, { color: '#991b1b' }]} numberOfLines={1}>
                      {(() => {
                        try {
                          if (!bpMetrics.value) return 'N/A';
                          if (typeof bpMetrics.value === 'object' && bpMetrics.value.systolic && bpMetrics.value.diastolic) {
                            return `${bpMetrics.value.systolic}/${bpMetrics.value.diastolic}`;
                          }
                          if (typeof bpMetrics.value === 'object' && bpMetrics.value.systolic) {
                            return `${bpMetrics.value.systolic}`;
                          }
                          return 'N/A';
                        } catch (error) {
                          console.error('Error formatting BP value:', error);
                          return 'N/A';
                        }
                      })()}
                    </Text>
                    {bpMetrics.date && (
                      <Text style={styles.healthInfoTime}>
                        {formatTimeAgo(bpMetrics.date)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
              {userData?.allergies && (
                <View style={[styles.healthInfoItem, styles.healthInfoItemFullWidth, { backgroundColor: '#fff7ed', borderColor: '#f59e0b' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#f59e0b" />
                  <View style={styles.healthInfoContent}>
                    <Text style={styles.healthInfoLabel}>Allergies</Text>
                    <Text style={[styles.healthInfoValue, { color: '#92400e' }]} numberOfLines={2}>
                      {userData.allergies}
                    </Text>
                  </View>
                </View>
              )}
              {userData?.chronicConditions && (
                <View style={[styles.healthInfoItem, { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}>
                  <Ionicons name="alert-circle" size={20} color="#3b82f6" />
                  <View style={styles.healthInfoContent}>
                    <Text style={styles.healthInfoLabel}>Conditions</Text>
                    <Text style={[styles.healthInfoValue, { color: '#1e40af' }]} numberOfLines={1}>
                      {userData.chronicConditions}
                    </Text>
                  </View>
                </View>
              )}
              {userData?.emergencyContact?.name && (
                <View style={[styles.healthInfoItem, styles.healthInfoItemFullWidth, { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }]}>
                  <Ionicons name="call" size={20} color="#16a34a" />
                  <View style={styles.healthInfoContent}>
                    <Text style={styles.healthInfoLabel}>Emergency Contact</Text>
                    <Text style={[styles.healthInfoValue, { color: '#166534' }]} numberOfLines={1}>
                      {userData.emergencyContact.name}
                    </Text>
                    {userData.emergencyContact.phone && (
                      <Text style={styles.healthInfoSubtext}>
                        {userData.emergencyContact.phone}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Emergency SOS Button */}
        <SOSButton />

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color="#111827" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Edit Modal */}
      <ProfileEditForm
        visible={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={handleEditSuccess}
        userData={userData || user}
      />

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        userData={userData || user}
      />

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal
        visible={showEmergencyContacts}
        onClose={() => setShowEmergencyContacts(false)}
        userData={userData || user}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        userData={userData || user}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  healthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  healthInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  healthInfoItem: {
    flex: 1,
    minWidth: '45%',
    margin: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthInfoItemFullWidth: {
    minWidth: '100%',
  },
  healthInfoContent: {
    marginLeft: 8,
    flex: 1,
  },
  healthInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6b7280',
    marginBottom: 2,
  },
  healthInfoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  healthInfoTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  healthInfoSubtext: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});

