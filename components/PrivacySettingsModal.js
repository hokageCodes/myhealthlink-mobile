import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { profileAPI } from '../src/api/profile';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

export default function PrivacySettingsModal({ visible, onClose, userData }) {
  const queryClient = useQueryClient();
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [accessType, setAccessType] = useState('public');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('never');
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [publicFields, setPublicFields] = useState([]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [loadingField, setLoadingField] = useState(null);

  // Initialize from userData only when modal opens
  useEffect(() => {
    if (visible && userData) {
      setIsPublicProfile(userData.isPublicProfile || false);
      const currentAccessType = userData.shareLinkSettings?.accessType || 'public';
      setAccessType(currentAccessType);
      setShowPasswordInput(currentAccessType === 'password');
      setPublicFields(userData.publicFields || []);
      const expiresAt = userData.shareLinkSettings?.expiresAt;
      if (expiresAt) {
        const expiry = new Date(expiresAt);
        const days = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        if (days <= 7) setLinkExpiry('7days');
        else if (days <= 30) setLinkExpiry('30days');
        else if (days <= 90) setLinkExpiry('90days');
      }
    }
  }, [visible]); // Only depend on visible, not userData

  // Update privacy mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: async (privacyData) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await profileAPI.updateProfile(privacyData);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Privacy settings updated',
      });
      queryClient.invalidateQueries(['userProfile']);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update privacy settings',
      });
    },
  });

  const handlePublicToggle = (value) => {
    setIsPublicProfile(value);
    updatePrivacyMutation.mutate({ isPublicProfile: value });
    // Don't reset on success, let invalidateQueries handle it
  };

  const handleAccessTypeChange = (newAccessType) => {
    setAccessType(newAccessType);
    setShowPasswordInput(newAccessType === 'password');
    updatePrivacyMutation.mutate({
      shareLinkSettings: {
        ...userData?.shareLinkSettings,
        accessType: newAccessType,
      },
    });
  };

  const handlePasswordUpdate = () => {
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
      });
      return;
    }
    updatePrivacyMutation.mutate({
      shareLinkSettings: {
        ...userData?.shareLinkSettings,
        password,
      },
    });
    setPassword('');
    setConfirmPassword('');
    setShowPasswordInput(false);
  };

  const handleFieldToggle = async (field) => {
    setLoadingField(field);
    const newFields = publicFields.includes(field)
      ? publicFields.filter(f => f !== field)
      : [...publicFields, field];
    
    try {
      await updatePrivacyMutation.mutateAsync({ publicFields: newFields });
      setPublicFields(newFields);
    } catch (error) {
      // Error already handled in mutation
    } finally {
      setLoadingField(null);
    }
  };

  const handleExpiryChange = (value) => {
    setLinkExpiry(value);
    if (value === 'never') {
      updatePrivacyMutation.mutate({
        shareLinkSettings: {
          ...userData?.shareLinkSettings,
          expiresAt: null,
        },
      });
    } else if (value !== 'never') {
      const days = parseInt(value.replace('days', ''));
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      updatePrivacyMutation.mutate({
        shareLinkSettings: {
          ...userData?.shareLinkSettings,
          expiresAt: expiresAt.toISOString(),
        },
      });
    }
  };

  const accessTypes = [
    { value: 'public', label: 'Public', icon: 'globe-outline', desc: 'Anyone with link' },
    { value: 'password', label: 'Password', icon: 'lock-closed-outline', desc: 'Password required' },
    { value: 'otp', label: 'OTP', icon: 'key-outline', desc: 'One-time code' },
  ];

  const fieldOptions = [
    { value: 'bloodType', label: 'Blood Type', icon: 'heart', color: '#ef4444' },
    { value: 'allergies', label: 'Allergies', icon: 'shield-checkmark', color: '#f59e0b' },
    { value: 'emergencyContact', label: 'Emergency Contact', icon: 'call', color: '#3b82f6' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Privacy & Sharing</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Public Profile Toggle */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="globe" size={24} color="#16a34a" />
                </View>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Public Profile</Text>
                  <Text style={styles.sectionSubtitle}>
                    Allow others to view your health information
                  </Text>
                </View>
              </View>
              <Switch
                value={isPublicProfile}
                onValueChange={handlePublicToggle}
                trackColor={{ false: '#d1d5db', true: '#16a34a' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Share Link Settings - Only show if public */}
            {isPublicProfile && (
              <>
                {/* Access Type */}
                <View style={styles.section}>
                  <Text style={styles.label}>Access Type</Text>
                  <View style={styles.gridContainer}>
                    {accessTypes.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.accessTypeCard,
                          accessType === type.value && styles.accessTypeCardActive,
                        ]}
                        onPress={() => handleAccessTypeChange(type.value)}
                      >
                        <Ionicons
                          name={type.icon}
                          size={24}
                          color={accessType === type.value ? '#16a34a' : '#6b7280'}
                        />
                        <Text
                          style={[
                            styles.accessTypeLabel,
                            accessType === type.value && styles.accessTypeLabelActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                        <Text style={styles.accessTypeDesc}>{type.desc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Password Input */}
                {showPasswordInput && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Set Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholderTextColor="#9ca3af"
                    />
                    <TextInput
                      style={[styles.input, { marginTop: 12 }]}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                      style={styles.passwordButton}
                      onPress={handlePasswordUpdate}
                      disabled={!password || password !== confirmPassword}
                    >
                      <Text style={styles.passwordButtonText}>Update Password</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Link Expiry */}
                <View style={styles.section}>
                  <Text style={styles.label}>Link Expiration</Text>
                  <View style={styles.expiryContainer}>
                    {['never', '7days', '30days', '90days'].map((expiry) => (
                      <TouchableOpacity
                        key={expiry}
                        style={[
                          styles.expiryOption,
                          linkExpiry === expiry && styles.expiryOptionActive,
                        ]}
                        onPress={() => handleExpiryChange(expiry)}
                      >
                        <Text
                          style={[
                            styles.expiryText,
                            linkExpiry === expiry && styles.expiryTextActive,
                          ]}
                        >
                          {expiry === 'never' ? 'Never' : expiry}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Public Fields */}
                <View style={styles.section}>
                  <Text style={styles.label}>What to Share</Text>
                  <Text style={styles.hint}>Choose which information is visible</Text>
                  {fieldOptions.map((field) => (
                    <View key={field.value} style={styles.fieldCard}>
                      <View style={[styles.fieldIcon, { backgroundColor: `${field.color}15` }]}>
                        <Ionicons name={field.icon} size={24} color={field.color} />
                      </View>
                      <View style={styles.fieldContent}>
                        <Text style={styles.fieldLabel}>{field.label}</Text>
                        <Text style={styles.fieldDesc}>
                          {field.value === 'bloodType' && 'Essential for emergencies'}
                          {field.value === 'allergies' && 'Important medical information'}
                          {field.value === 'emergencyContact' && 'Who to contact in emergencies'}
                        </Text>
                      </View>
                      {loadingField === field.value ? (
                        <ActivityIndicator size="small" color="#16a34a" />
                      ) : (
                        <Switch
                          value={publicFields.includes(field.value)}
                          onValueChange={() => handleFieldToggle(field.value)}
                          trackColor={{ false: '#d1d5db', true: field.color }}
                          thumbColor="#ffffff"
                        />
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Your privacy is important. Only share what you're comfortable with.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 'auto',
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  accessTypeCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: '1%',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  accessTypeCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  accessTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  accessTypeLabelActive: {
    color: '#16a34a',
  },
  accessTypeDesc: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: { paddingVertical: 14 },
      android: { paddingVertical: 12 },
    }),
  },
  passwordButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  passwordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  expiryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  expiryOption: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    margin: '1%',
    alignItems: 'center',
  },
  expiryOptionActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  expiryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  expiryTextActive: {
    color: '#16a34a',
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  fieldDesc: {
    fontSize: 12,
    color: '#9ca3af',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
    marginLeft: 12,
  },
});

