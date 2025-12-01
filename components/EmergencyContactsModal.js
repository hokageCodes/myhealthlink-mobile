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
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { profileAPI } from '../src/api/profile';
import * as SecureStore from 'expo-secure-store';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

const CRITICAL_FIELDS = ['bloodType', 'allergies', 'emergencyContact', 'chronicConditions', 'medications', 'healthMetrics'];

export default function EmergencyContactsModal({ visible, onClose, userData }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUsernameSearch, setShowUsernameSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingField, setLoadingField] = useState(null);

  const [emergencyData, setEmergencyData] = useState({
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
      linkedUsername: null,
    },
    emergencyMode: {
      enabled: false,
      showCriticalOnly: true,
      criticalFields: ['bloodType', 'allergies', 'emergencyContact', 'chronicConditions'],
    },
    additionalContacts: [],
  });

  // Initialize from userData only when modal opens or is not editing
  useEffect(() => {
    if (visible && userData && !isEditing) {
      setEmergencyData({
        emergencyContact: userData.emergencyContact || {
          name: '',
          phone: '',
          email: '',
          relationship: '',
          linkedUsername: null,
        },
        emergencyMode: userData.emergencyMode || {
          enabled: false,
          showCriticalOnly: true,
          criticalFields: ['bloodType', 'allergies', 'emergencyContact', 'chronicConditions'],
        },
        additionalContacts: userData.additionalContacts || [],
      });
    }
  }, [visible]); // Only depend on visible, not userData to prevent resets

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await profileAPI.updateProfile(data);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Emergency settings saved successfully',
      });
      queryClient.invalidateQueries(['userProfile']);
      setIsEditing(false);
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save emergency settings',
      });
    },
  });

  const handleSave = () => {
    // Validate primary contact
    if (!emergencyData.emergencyContact.name || !emergencyData.emergencyContact.email) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Primary contact must have a name and email',
      });
      return;
    }

    // Validate all additional contacts
    const invalidContacts = emergencyData.additionalContacts.filter(
      contact => !contact.name || !contact.email
    );

    if (invalidContacts.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'All additional contacts must have a name and email',
      });
      return;
    }

    updateMutation.mutate({
      emergencyContact: emergencyData.emergencyContact,
      emergencyMode: emergencyData.emergencyMode,
      additionalContacts: emergencyData.additionalContacts,
    });
  };

  const handleSearchUsername = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await profileAPI.searchByUsername(query);
      if (response.success) {
        setSearchResults(response.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectLinkedUser = (user) => {
    setEmergencyData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        name: user.name,
        linkedUsername: user.username,
        email: prev.emergencyContact.email || '', // Preserve existing email
        phone: prev.emergencyContact.phone || '',
      },
    }));
    setSearchQuery('');
    setSearchResults([]);
    setShowUsernameSearch(false);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: `Linked to ${user.name}`,
    });
  };

  const unlinkUser = () => {
    setEmergencyData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        linkedUsername: null,
      },
    }));
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Contact unlinked',
    });
  };

  const addContact = () => {
    setEmergencyData(prev => ({
      ...prev,
      additionalContacts: [...prev.additionalContacts, { name: '', phone: '', email: '', relationship: '' }],
    }));
  };

  const removeContact = (index) => {
    setEmergencyData(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== index),
    }));
  };

  const updateContact = (index, field, value) => {
    setEmergencyData(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }));
  };

  const updateEmergencyContact = (field, value) => {
    setEmergencyData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  const toggleCriticalField = (field) => {
    setEmergencyData(prev => {
      const currentFields = prev.emergencyMode.criticalFields || [];
      const newFields = currentFields.includes(field)
        ? currentFields.filter(f => f !== field)
        : [...currentFields, field];
      return {
        ...prev,
        emergencyMode: {
          ...prev.emergencyMode,
          criticalFields: newFields,
        },
      };
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Emergency Contacts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Primary Emergency Contact */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="shield-checkmark" size={24} color="#dc2626" />
                </View>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Primary Emergency Contact</Text>
                  <Text style={styles.sectionSubtitle}>
                    First person to be notified in emergencies
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contact name"
                  value={emergencyData.emergencyContact.name}
                  onChangeText={(value) => updateEmergencyContact('name', value)}
                  placeholderTextColor="#9ca3af"
                  editable={isEditing}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="contact@email.com"
                  value={emergencyData.emergencyContact.email}
                  onChangeText={(value) => updateEmergencyContact('email', value)}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={isEditing}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="08012345678"
                  value={emergencyData.emergencyContact.phone || ''}
                  onChangeText={(value) => updateEmergencyContact('phone', value)}
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Spouse, Parent"
                  value={emergencyData.emergencyContact.relationship}
                  onChangeText={(value) => updateEmergencyContact('relationship', value)}
                  placeholderTextColor="#9ca3af"
                  editable={isEditing}
                />
              </View>

              {/* Link to existing user */}
              {!emergencyData.emergencyContact.linkedUsername && isEditing && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setShowUsernameSearch(!showUsernameSearch)}
                >
                  <Ionicons name="link" size={20} color="#16a34a" />
                  <Text style={styles.linkButtonText}>Link to another user</Text>
                </TouchableOpacity>
              )}

              {/* Username search */}
              {showUsernameSearch && isEditing && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChangeText={handleSearchUsername}
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                  />
                  {searching && (
                    <ActivityIndicator size="small" color="#16a34a" style={{ marginLeft: 8 }} />
                  )}
                  {searchResults.map((user) => (
                    <TouchableOpacity
                      key={user._id}
                      style={styles.searchResult}
                      onPress={() => selectLinkedUser(user)}
                    >
                      {user.profilePicture ? (
                        <Image source={{ uri: user.profilePicture }} style={styles.searchAvatar} />
                      ) : (
                        <View style={[styles.searchAvatar, { backgroundColor: '#e5e7eb' }]}>
                          <Text style={styles.searchAvatarText}>{user.name?.charAt(0)}</Text>
                        </View>
                      )}
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>{user.name}</Text>
                        <Text style={styles.searchResultUsername}>@{user.username}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Linked user display */}
              {emergencyData.emergencyContact.linkedUsername && (
                <View style={styles.linkedUserCard}>
                  <View style={styles.linkedUserInfo}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.linkedUserText}>
                      Linked to @{emergencyData.emergencyContact.linkedUsername}
                    </Text>
                  </View>
                  <View style={styles.linkedUserActions}>
                    {!isEditing && (
                      <TouchableOpacity
                        style={styles.viewProfileButton}
                        onPress={() => {
                          onClose();
                          router.push(`/share/${emergencyData.emergencyContact.linkedUsername}`);
                        }}
                      >
                        <Ionicons name="eye-outline" size={18} color="#16a34a" />
                        <Text style={styles.viewProfileText}>View Profile</Text>
                      </TouchableOpacity>
                    )}
                    {isEditing && (
                      <TouchableOpacity onPress={unlinkUser}>
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Additional Contacts */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="people" size={24} color="#2563eb" />
                </View>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Additional Contacts</Text>
                  <Text style={styles.sectionSubtitle}>
                    Other people to notify during emergencies
                  </Text>
                </View>
              </View>

              {emergencyData.additionalContacts.map((contact, index) => (
                <View key={index} style={styles.contactCard}>
                  <Text style={styles.contactCardTitle}>Contact {index + 1}</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Contact name"
                      value={contact.name}
                      onChangeText={(value) => updateContact(index, 'name', value)}
                      placeholderTextColor="#9ca3af"
                      editable={isEditing}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="contact@email.com"
                      value={contact.email}
                      onChangeText={(value) => updateContact(index, 'email', value)}
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={isEditing}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="08012345678"
                      value={contact.phone}
                      onChangeText={(value) => updateContact(index, 'phone', value)}
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      editable={isEditing}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Relationship</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Friend, Sibling"
                      value={contact.relationship}
                      onChangeText={(value) => updateContact(index, 'relationship', value)}
                      placeholderTextColor="#9ca3af"
                      editable={isEditing}
                    />
                  </View>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeContact(index)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {isEditing && (
                <TouchableOpacity style={styles.addButton} onPress={addContact}>
                  <Ionicons name="add-circle-outline" size={20} color="#16a34a" />
                  <Text style={styles.addButtonText}>Add Contact</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Emergency Mode Settings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="warning" size={24} color="#d97706" />
                </View>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Emergency Mode</Text>
                  <Text style={styles.sectionSubtitle}>
                    Control what information is shared in emergencies
                  </Text>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Enable Emergency Mode</Text>
                  <Text style={styles.toggleDesc}>
                    Show critical information only during emergencies
                  </Text>
                </View>
                <Switch
                  value={emergencyData.emergencyMode.enabled}
                  onValueChange={(value) =>
                    setEmergencyData(prev => ({
                      ...prev,
                      emergencyMode: { ...prev.emergencyMode, enabled: value },
                    }))
                  }
                  trackColor={{ false: '#d1d5db', true: '#16a34a' }}
                  thumbColor="#ffffff"
                />
              </View>

              {emergencyData.emergencyMode.enabled && (
                <View style={styles.criticalFieldsContainer}>
                  <Text style={styles.criticalFieldsLabel}>Critical Fields</Text>
                  <Text style={styles.criticalFieldsDesc}>
                    Select which information to share in emergencies
                  </Text>
                  {CRITICAL_FIELDS.map((field) => (
                    <View key={field} style={styles.fieldToggleRow}>
                      <Text style={styles.fieldToggleLabel}>
                        {field === 'bloodType' && 'Blood Type'}
                        {field === 'allergies' && 'Allergies'}
                        {field === 'emergencyContact' && 'Emergency Contact'}
                        {field === 'chronicConditions' && 'Chronic Conditions'}
                        {field === 'medications' && 'Medications'}
                        {field === 'healthMetrics' && 'Health Metrics'}
                      </Text>
                      <Switch
                        value={emergencyData.emergencyMode.criticalFields.includes(field)}
                        onValueChange={() => toggleCriticalField(field)}
                        trackColor={{ false: '#d1d5db', true: '#16a34a' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {isEditing ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    // Reset data
                    setEmergencyData({
                      emergencyContact: userData?.emergencyContact || {
                        name: '',
                        phone: '',
                        email: '',
                        relationship: '',
                        linkedUsername: null,
                      },
                      emergencyMode: userData?.emergencyMode || {
                        enabled: false,
                        showCriticalOnly: true,
                        criticalFields: ['bloodType', 'allergies', 'emergencyContact', 'chronicConditions'],
                      },
                      additionalContacts: userData?.additionalContacts || [],
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color="#ffffff" />
                <Text style={styles.editButtonText}>Edit Contacts</Text>
              </TouchableOpacity>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Emergency contacts will be notified via Email and SMS (if phone provided) when you trigger an SOS alert.
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
    marginLeft: 8,
  },
  searchContainer: {
    marginTop: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  searchResultInfo: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  searchResultUsername: {
    fontSize: 12,
    color: '#6b7280',
  },
  linkedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  linkedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkedUserText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
    marginLeft: 8,
  },
  linkedUserActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 4,
  },
  contactCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
    marginLeft: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  criticalFieldsContainer: {
    marginTop: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  criticalFieldsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  criticalFieldsDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  fieldToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fieldToggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    marginHorizontal: 16,
    marginTop: 24,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
    marginLeft: 12,
  },
});

