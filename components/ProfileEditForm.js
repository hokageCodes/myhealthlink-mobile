import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { profileAPI } from '../src/api/profile';

export default function ProfileEditForm({ visible, onClose, onSuccess, userData }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [genotype, setGenotype] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genotypes = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC'];

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setPhone(userData.phone || '');
      setBloodType(userData.bloodType || '');
      setGenotype(userData.genotype || '');
      // Backend stores as string, not array
      setAllergies(userData.allergies || '');
      setChronicConditions(userData.chronicConditions || '');
      setProfilePicture(userData.profilePicture || null);
    }
  }, [userData, visible]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setBloodType('');
    setGenotype('');
    setAllergies('');
    setChronicConditions('');
    setProfilePicture(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUploadPicture = async () => {
    if (!profilePicture || uploading) return;

    try {
      setUploading(true);
      const response = await profileAPI.uploadPicture(profilePicture);
      
      if (response.success) {
        return response.data.profilePicture;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Upload picture if changed
      let pictureUrl = userData?.profilePicture;
      if (profilePicture && profilePicture !== userData?.profilePicture) {
        pictureUrl = await handleUploadPicture();
      }

      const profileData = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        bloodType: bloodType || undefined,
        genotype: genotype || undefined,
        allergies: allergies.trim() || undefined,
        chronicConditions: chronicConditions.trim() || undefined,
        profilePicture: pictureUrl,
      };

      console.log('[ProfileEditForm] Submitting profile data:', profileData);
      const response = await profileAPI.updateProfile(profileData);
      console.log('[ProfileEditForm] Update response:', response);
      
      if (response.success || response.data) {
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('[ProfileEditForm] Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Picture */}
            <View style={styles.section}>
              <Text style={styles.label}>Profile Picture</Text>
              <View style={styles.avatarWrapper}>
                <TouchableOpacity 
                  style={styles.avatarContainer}
                  onPress={handlePickImage}
                  disabled={uploading}
                >
                  {profilePicture ? (
                    <View style={styles.avatarImageContainer}>
                      <Image 
                        source={{ uri: profilePicture }} 
                        style={styles.avatarImage}
                      />
                      {uploading && (
                        <View style={styles.uploadOverlay}>
                          <ActivityIndicator size="small" color="#ffffff" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={48} color="#16a34a" />
                    </View>
                  )}
                  <View style={styles.avatarEditButton}>
                    <Ionicons name="camera" size={16} color="#ffffff" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors({ ...errors, name: undefined });
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.section}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>

            {/* Blood Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Blood Type</Text>
              <View style={styles.bloodTypeGrid}>
                {bloodTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.bloodTypeChip,
                      bloodType === type && styles.bloodTypeChipActive,
                    ]}
                    onPress={() => setBloodType(type)}
                  >
                    <Text
                      style={[
                        styles.bloodTypeText,
                        bloodType === type && styles.bloodTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Genotype */}
            <View style={styles.section}>
              <Text style={styles.label}>Genotype</Text>
              <View style={styles.bloodTypeGrid}>
                {genotypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.bloodTypeChip,
                      genotype === type && styles.bloodTypeChipActive,
                    ]}
                    onPress={() => setGenotype(type)}
                  >
                    <Text
                      style={[
                        styles.bloodTypeText,
                        genotype === type && styles.bloodTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Allergies */}
            <View style={styles.section}>
              <Text style={styles.label}>Allergies</Text>
              <TextInput
                style={styles.textArea}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="Enter allergies separated by commas"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Chronic Conditions */}
            <View style={styles.section}>
              <Text style={styles.label}>Chronic Conditions</Text>
              <TextInput
                style={styles.textArea}
                value={chronicConditions}
                onChangeText={setChronicConditions}
                placeholder="Enter chronic conditions separated by commas"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={uploading || !name.trim()}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#16a34a',
  },
  avatarImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#16a34a',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        paddingVertical: 14,
      },
      android: {
        paddingVertical: 12,
      },
    }),
  },
  textArea: {
    minHeight: 60,
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        paddingTop: 14,
      },
      android: {
        paddingTop: 12,
      },
    }),
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    width: '100%',
  },
  bloodTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
    margin: 6,
  },
  bloodTypeChipActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  bloodTypeTextActive: {
    color: '#16a34a',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    ...Platform.select({
      ios: {
        paddingBottom: 34,
      },
      android: {
        paddingBottom: 16,
      },
    }),
  },
  cancelButton: {
    flex: 1,
    height: 50,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

