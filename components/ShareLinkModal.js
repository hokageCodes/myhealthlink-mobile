import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { profileAPI } from '../src/api/profile';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { FRONTEND_BASE_URL } from '../src/constants/config';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

// Get base URL for share link from config
const getShareBaseUrl = () => {
  return FRONTEND_BASE_URL;
};

export default function ShareLinkModal({ visible, onClose, username: providedUsername }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch profile if username not provided
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');
        const response = await profileAPI.getProfile();
        return response;
      } catch (error) {
        console.error('[ShareLinkModal] Error fetching profile:', error);
        return null;
      }
    },
    enabled: !providedUsername && visible,
    staleTime: 300000, // 5 minutes
    retry: false,
  });

  // Build share URL
  useEffect(() => {
    const buildShareUrl = () => {
      try {
        const username = providedUsername || profileData?.data?.username || profileData?.username;
        if (username) {
          const baseUrl = getShareBaseUrl();
          const url = `${baseUrl}/share/${username}`;
          setShareUrl(url);
        } else {
          console.log('[ShareLinkModal] No username available:', { providedUsername, profileData });
        }
      } catch (error) {
        console.error('[ShareLinkModal] Error building share URL:', error);
      }
    };

    if (visible) {
      buildShareUrl();
    }
  }, [visible, providedUsername, profileData]);

  const handleCopyLink = async () => {
    if (!shareUrl) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Share link not available yet',
      });
      return;
    }

    try {
      await Clipboard.setStringAsync(shareUrl);
      setCopied(true);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Share link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to copy link',
      });
    }
  };

  const handleShare = async () => {
    if (!shareUrl) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Share link not available yet',
      });
      return;
    }

    try {
      const result = await Share.share({
        message: `Check out my health profile: ${shareUrl}`,
        title: 'Share Health Profile',
        url: shareUrl, // iOS specific
      });

      if (result.action === Share.sharedAction) {
        Toast.show({
          type: 'success',
          text1: 'Shared!',
          text2: 'Profile link shared successfully',
        });
      }
    } catch (err) {
      if (err.message !== 'User did not share') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to share link',
        });
      }
    }
  };

  const username = providedUsername || profileData?.data?.username || profileData?.username;
  const isLoading = profileLoading && !providedUsername;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
              ) : !username ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#ef4444" />
                  <Text style={styles.errorTitle}>Username Not Set</Text>
                  <Text style={styles.errorText}>
                    Please set a username in your profile settings to generate a share link.
                  </Text>
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => {
                      onClose();
                      // Navigate to profile settings (you can add navigation here)
                    }}
                  >
                    <Text style={styles.settingsButtonText}>Go to Profile Settings</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Profile Preview */}
                  <View style={styles.previewContainer}>
                    <Text style={styles.label}>Preview</Text>
                    <Text style={styles.previewSubtitle}>What others will see</Text>
                    
                    <View style={styles.previewCard}>
                      {/* Profile Header */}
                      <View style={styles.previewHeader}>
                        {(profileData?.data?.profilePicture || profileData?.profilePicture) ? (
                          <Image
                            source={{ uri: profileData?.data?.profilePicture || profileData?.profilePicture }}
                            style={styles.previewAvatar}
                          />
                        ) : (
                          <View style={styles.previewAvatarPlaceholder}>
                            <Ionicons name="person" size={32} color="#ffffff" />
                          </View>
                        )}
                        <Text style={styles.previewName}>
                          {profileData?.data?.name || profileData?.name || 'Your Name'}
                        </Text>
                      </View>

                      {/* Medical Info Cards */}
                      <View style={styles.previewInfoGrid}>
                        {profileData?.data?.bloodType || profileData?.bloodType ? (
                          <View style={[styles.infoCardPreview, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
                            <Ionicons name="heart" size={20} color="#ef4444" />
                            <Text style={styles.infoCardLabel}>Blood Type</Text>
                            <Text style={[styles.infoCardValue, { color: '#991b1b' }]}>
                              {profileData?.data?.bloodType || profileData?.bloodType}
                            </Text>
                          </View>
                        ) : null}

                        {profileData?.data?.allergies || profileData?.allergies ? (
                          <View style={[styles.infoCardPreview, { backgroundColor: '#fff7ed', borderColor: '#f59e0b' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#f59e0b" />
                            <Text style={styles.infoCardLabel}>Allergies</Text>
                            <Text style={[styles.infoCardValue, { color: '#92400e' }]} numberOfLines={2}>
                              {profileData?.data?.allergies || profileData?.allergies}
                            </Text>
                          </View>
                        ) : null}

                        {profileData?.data?.emergencyContact || profileData?.emergencyContact ? (
                          <View style={[styles.infoCardPreview, { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}>
                            <Ionicons name="call" size={20} color="#3b82f6" />
                            <Text style={styles.infoCardLabel}>Emergency</Text>
                            <Text style={[styles.infoCardValue, { color: '#1e40af' }]} numberOfLines={1}>
                              {(profileData?.data?.emergencyContact || profileData?.emergencyContact)?.name}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* QR Code Preview */}
                  {shareUrl ? (
                    <View style={styles.qrContainer}>
                      <Text style={styles.label}>Quick Access QR Code</Text>
                      <View style={styles.qrWrapper}>
                        <QRCode
                          value={shareUrl}
                          size={200}
                          backgroundColor="white"
                          color="black"
                        />
                      </View>
                      <Text style={styles.qrHelperText}>
                        Scan this code to quickly access your profile
                      </Text>
                    </View>
                  ) : null}

                  {/* Share Link Display */}
                  <View style={styles.linkContainer}>
                    <Text style={styles.label}>Your Share Link</Text>
                    <View style={styles.linkBox}>
                      <TextInput
                        style={styles.linkInput}
                        value={shareUrl}
                        editable={false}
                        multiline
                        selectTextOnFocus
                      />
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={handleCopyLink}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={copied ? 'checkmark' : 'copy-outline'}
                          size={20}
                          color={copied ? '#16a34a' : '#6b7280'}
                        />
                      </TouchableOpacity>
                    </View>
                    {copied && (
                      <Text style={styles.copiedText}>Link copied to clipboard!</Text>
                    )}
                  </View>

                  {/* Info Card */}
                  <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#3b82f6" />
                    <Text style={styles.infoText}>
                      Share this link with healthcare providers, family members, or emergency contacts
                      to give them access to your health information.
                    </Text>
                  </View>

                  {/* Share Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={handleShare}
                    >
                      <Ionicons name="share-social" size={20} color="#ffffff" />
                      <Text style={styles.shareButtonText}>Share via...</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.copyActionButton}
                      onPress={handleCopyLink}
                    >
                      <Ionicons
                        name={copied ? 'checkmark-circle' : 'copy-outline'}
                        size={20}
                        color={copied ? '#16a34a' : '#6b7280'}
                      />
                      <Text
                        style={[
                          styles.copyActionText,
                          copied && styles.copyActionTextActive,
                        ]}
                      >
                        {copied ? 'Copied!' : 'Copy Link'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  qrHelperText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
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
    lineHeight: 20,
  },
  settingsButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingRight: 8,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
      },
      android: {
        paddingVertical: 4,
      },
    }),
  },
  copyButton: {
    padding: 4,
  },
  copiedText: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 4,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
    marginLeft: 12,
  },
  actions: {
    ...Platform.select({
      ios: {
        paddingBottom: 34,
      },
      android: {
        paddingBottom: 16,
      },
    }),
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
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
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  copyActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  copyActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  copyActionTextActive: {
    color: '#16a34a',
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  previewHeader: {
    backgroundColor: '#16a34a',
    padding: 16,
    alignItems: 'center',
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  previewAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
  },
  previewInfoGrid: {
    padding: 16,
  },
  infoCardPreview: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});

