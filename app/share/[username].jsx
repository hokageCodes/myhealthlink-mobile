import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { publicProfileAPI } from '../../src/api/publicProfile';

export default function SharedProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [accessType, setAccessType] = useState(null); // 'password' or 'otp'
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Get initial token from URL params if available
  useEffect(() => {
    // In React Native, we'd parse URL params if needed
    // For now, token can come from deep linking or manual entry
  }, []);

  // Fetch public profile
  const {
    data: profileResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['publicProfile', username, accessToken],
    queryFn: async () => {
      try {
        const result = await publicProfileAPI.getPublicProfile(username, accessToken || undefined);
        
        if (result.success) {
          setRequiresAuth(false);
          return result.data;
        }
        
        // Handle auth required
        if (result.requiresAuth) {
          setRequiresAuth(true);
          setAccessType(result.accessType);
          return null;
        }
        
        throw new Error(result.message || 'Failed to load profile');
      } catch (error) {
        if (error.response?.status === 401 && error.response?.data?.requiresAuth) {
          setRequiresAuth(true);
          setAccessType(error.response.data.accessType);
          return null;
        }
        throw error;
      }
    },
    enabled: !!username,
    retry: false,
  });

  const handlePasswordSubmit = async () => {
    if (!password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a password',
      });
      return;
    }

    setVerifying(true);
    try {
      const result = await publicProfileAPI.verifyPassword(username, password);
      if (result.success && result.token) {
        setAccessToken(result.token);
        setPassword('');
        Toast.show({
          type: 'success',
          text1: 'Access Granted',
          text2: 'Loading profile...',
        });
        refetch();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Incorrect password',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRequestOTP = async () => {
    setVerifying(true);
    try {
      const result = await publicProfileAPI.requestOTP(username, email || undefined);
      if (result.success) {
        setOtpRequested(true);
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: result.message || 'Check your email for the OTP',
        });
        // In development, show OTP if returned
        if (result.otp) {
          Alert.alert('Development OTP', `OTP: ${result.otp}`);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to request OTP',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otp) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the OTP',
      });
      return;
    }

    setVerifying(true);
    try {
      const result = await publicProfileAPI.verifyOTP(username, otp);
      if (result.success && result.token) {
        setAccessToken(result.token);
        setOtp('');
        setOtpRequested(false);
        Toast.show({
          type: 'success',
          text1: 'Access Granted',
          text2: 'Loading profile...',
        });
        refetch();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Invalid OTP',
      });
    } finally {
      setVerifying(false);
    }
  };

  const profile = profileResponse;

  if (isLoading && !requiresAuth) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !requiresAuth) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Profile</Text>
          <Text style={styles.errorText}>
            {error.response?.data?.message || error.message || 'Failed to load profile'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Password/OTP authentication required
  if (requiresAuth && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.authContent}>
          {/* Header */}
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          <View style={styles.authHeader}>
            <View style={styles.authIconContainer}>
              <Ionicons
                name={accessType === 'password' ? 'lock-closed' : 'key'}
                size={48}
                color="#16a34a"
              />
            </View>
            <Text style={styles.authTitle}>
              {accessType === 'password' ? 'Password Required' : 'OTP Verification Required'}
            </Text>
            <Text style={styles.authSubtitle}>
              This profile is protected. Please enter {accessType === 'password' ? 'the password' : 'your email and OTP'} to continue.
            </Text>
          </View>

          {accessType === 'password' ? (
            <View style={styles.authForm}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.submitButton, (!password || verifying) && styles.submitButtonDisabled]}
                onPress={handlePasswordSubmit}
                disabled={!password || verifying}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authForm}>
              {!otpRequested ? (
                <>
                  <Text style={styles.label}>Email (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity
                    style={[styles.submitButton, verifying && styles.submitButtonDisabled]}
                    onPress={handleRequestOTP}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Request OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Enter OTP</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleRequestOTP}
                    disabled={verifying}
                  >
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, (!otp || verifying) && styles.submitButtonDisabled]}
                    onPress={handleOTPSubmit}
                    disabled={!otp || verifying}
                  >
                    {verifying ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Profile view
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shared Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {profile?.profilePicture ? (
            <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.name || 'User'}</Text>
          {profile?.dateOfBirth && (
            <Text style={styles.detail}>
              {new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          {profile?.gender && <Text style={styles.detail}>{profile.gender}</Text>}
        </View>

        {/* Health Info */}
        {(profile?.bloodType || profile?.allergies || profile?.chronicConditions || profile?.emergencyContact) && (
          <View style={styles.healthCard}>
            <Text style={styles.sectionTitle}>Health Information</Text>

            {profile?.bloodType && (
              <View style={styles.infoItem}>
                <Ionicons name="heart" size={20} color="#ef4444" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Blood Type</Text>
                  <Text style={styles.infoValue}>{profile.bloodType}</Text>
                </View>
              </View>
            )}

            {profile?.allergies && (
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color="#f59e0b" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Allergies</Text>
                  <Text style={styles.infoValue}>{profile.allergies}</Text>
                </View>
              </View>
            )}

            {profile?.chronicConditions && (
              <View style={styles.infoItem}>
                <Ionicons name="alert-circle" size={20} color="#3b82f6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Chronic Conditions</Text>
                  <Text style={styles.infoValue}>{profile.chronicConditions}</Text>
                </View>
              </View>
            )}

            {profile?.emergencyContact && (
              <View style={styles.infoItem}>
                <Ionicons name="call" size={20} color="#16a34a" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValue}>{profile.emergencyContact.name}</Text>
                  {profile.emergencyContact.phone && (
                    <Text style={styles.infoSubtext}>{profile.emergencyContact.phone}</Text>
                  )}
                  {profile.emergencyContact.relationship && (
                    <Text style={styles.infoSubtext}>{profile.emergencyContact.relationship}</Text>
                  )}
                </View>
              </View>
            )}

            {profile?.emergencyMode && (
              <View style={styles.emergencyBanner}>
                <Ionicons name="warning" size={20} color="#dc2626" />
                <Text style={styles.emergencyBannerText}>Emergency Mode - Critical Information Only</Text>
              </View>
            )}
          </View>
        )}

        {/* Empty State */}
        {!profile?.bloodType && !profile?.allergies && !profile?.chronicConditions && !profile?.emergencyContact && (
          <View style={styles.emptyState}>
            <Ionicons name="information-circle" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No additional information available</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileCard: {
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  healthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  emergencyBannerText: {
    fontSize: 12,
    color: '#991b1b',
    marginLeft: 8,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  authContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  authForm: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  resendButtonText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
});

