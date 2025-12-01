import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { exportAPI } from '../src/api/export';
import apiClient from '../src/api/client';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';

export default function SettingsModal({ visible, onClose, userData }) {
  const [exporting, setExporting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Confirmation',
        text2: 'Please type "DELETE" to confirm',
      });
      return;
    }

    setDeleting(true);
    try {
      await apiClient.delete('/auth/account');
      Toast.show({
        type: 'success',
        text1: 'Account Deleted',
        text2: 'Your account has been permanently deleted',
      });
      await logout();
      router.replace('/login');
      onClose();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to delete account',
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation('');
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => setShowDeleteConfirm(true),
        },
      ]
    );
  };

  const handleExport = async (type) => {
    try {
      setExporting(type);
      switch (type) {
        case 'json':
          await exportAPI.exportJSON();
          Toast.show({ type: 'success', text1: 'Exported', text2: 'JSON exported' });
          break;
        case 'csv-metrics':
          await exportAPI.exportCSV('metrics');
          Toast.show({ type: 'success', text1: 'Exported', text2: 'Metrics CSV ready' });
          break;
        case 'csv-appointments':
          await exportAPI.exportCSV('appointments');
          Toast.show({ type: 'success', text1: 'Exported', text2: 'Appointments CSV ready' });
          break;
        case 'csv-medications':
          await exportAPI.exportCSV('medications');
          Toast.show({ type: 'success', text1: 'Exported', text2: 'Medications CSV ready' });
          break;
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Export failed',
      });
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    { id: 'json', title: 'Export All Data (JSON)', description: 'Complete backup', icon: 'code-working', color: '#3b82f6' },
    { id: 'csv-metrics', title: 'Export Health Metrics', description: 'Tracking data', icon: 'pulse', color: '#ef4444' },
    { id: 'csv-appointments', title: 'Export Appointments', description: 'All medical visits', icon: 'calendar', color: '#10b981' },
    { id: 'csv-medications', title: 'Export Medications', description: 'Current + past meds', icon: 'medical', color: '#f59e0b' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ACCOUNT CARD */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {userData?.profilePicture ? (
                  <Image source={{ uri: userData.profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {userData?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </Text>
                  </View>
                )}

                <View>
                  <Text style={styles.cardTitle}>Account</Text>
                  <Text style={styles.cardSubtitle}>Personal information</Text>
                </View>
              </View>

              <View style={styles.listItem}>
                <Text style={styles.listLabel}>Name</Text>
                <Text style={styles.listValue}>{userData?.name || 'N/A'}</Text>
              </View>

              <View style={styles.listItem}>
                <Text style={styles.listLabel}>Email</Text>
                <Text style={styles.listValue}>{userData?.email || 'N/A'}</Text>
              </View>

              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                <Text style={styles.infoBannerText}>Go to Edit Profile to update details</Text>
              </View>
            </View>

            {/* EXPORT CARD */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: "#DCFCE7" }]}>
                  <Ionicons name="download-outline" size={22} color="#059669" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Export Data</Text>
                  <Text style={styles.cardSubtitle}>Download your health records</Text>
                </View>
              </View>

              {exportOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.exportItem}
                  onPress={() => handleExport(opt.id)}
                >
                  <View style={[styles.exportIcon, { backgroundColor: opt.color + "22" }]}>
                    <Ionicons name={opt.icon} size={22} color={opt.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportTitle}>{opt.title}</Text>
                    <Text style={styles.exportSubtitle}>{opt.description}</Text>
                  </View>

                  {exporting === opt.id ? (
                    <ActivityIndicator size="small" color={opt.color} />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* APP INFO */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="information-circle" size={22} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>App Information</Text>
                  <Text style={styles.cardSubtitle}>About MyHealthLink</Text>
                </View>
              </View>

              <View style={styles.appInfoContent}>
                <Text style={styles.appVersion}>MyHealthLink v1.0.0</Text>
                <Text style={styles.appDescription}>
                  Your secure, personal health information hub. Access your health data anytime, anywhere.
                </Text>
                
                <View style={styles.featuresGrid}>
                  <View style={styles.featureItem}>
                    <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
                    <Text style={styles.featureText}>Encrypted Storage</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="lock-closed" size={16} color="#16a34a" />
                    <Text style={styles.featureText}>Privacy First</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="share-social" size={16} color="#16a34a" />
                    <Text style={styles.featureText}>Easy Sharing</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="download" size={16} color="#16a34a" />
                    <Text style={styles.featureText}>Export Data</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* DANGER ZONE */}
            <View style={[styles.card, styles.dangerCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="warning-outline" size={22} color="#DC2626" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: "#DC2626" }]}>Danger Zone</Text>
                  <Text style={styles.cardSubtitle}>Irreversible actions</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.dangerButton} onPress={confirmDeleteAccount}>
                <Ionicons name="trash" size={20} color="#DC2626" />
                <Text style={styles.dangerButtonText}>Delete My Account</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainer}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="warning" size={50} color="#DC2626" />
              <Text style={styles.confirmTitle}>Final Confirmation</Text>
              <Text style={styles.confirmSubtitle}>
                Type "DELETE" to permanently remove your account.
              </Text>
            </View>

            <TextInput
              style={styles.confirmInput}
              placeholder="Type DELETE"
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              autoCapitalize="characters"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  (deleteConfirmation.toLowerCase() !== 'delete') && { opacity: 0.5 }
                ]}
                disabled={deleteConfirmation.toLowerCase() !== 'delete'}
                onPress={handleDeleteAccount}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 'auto',
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 20,
    maxHeight: '90%',
  },

  /* HEADER */
  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  /* AVATAR */
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  /* LIST ITEMS */
  listItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listLabel: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  listValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  /* SMALL BANNER */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  infoBannerText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 12,
  },

  /* EXPORT ITEMS */
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  exportIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  exportSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },

  /* DANGER */
  dangerCard: {
    borderColor: '#FECACA',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* CONFIRM MODAL */
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmContainer: {
    backgroundColor: '#fff',
    padding: 26,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  confirmSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 6,
    fontSize: 13,
  },

  confirmInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
  },

  confirmButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* APP INFO */
  appInfoContent: {
    marginTop: 4,
  },
  appVersion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  featureText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
});
