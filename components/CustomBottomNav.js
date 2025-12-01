import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const optionsMenu = [
  { id: 'home', icon: 'home', label: 'Home', route: '/(tabs)/home' },
  { id: 'health', icon: 'heart', label: 'Health', route: '/(tabs)/health' },
  { id: 'analytics', icon: 'analytics', label: 'Analytics', route: '/(tabs)/analytics' },
  { id: 'goals', icon: 'flag', label: 'Goals', route: '/(tabs)/goals' },
  { id: 'medications', icon: 'medical', label: 'Medications', route: '/(tabs)/medications' },
  { id: 'documents', icon: 'document-text', label: 'Documents', route: '/(tabs)/documents' },
  { id: 'calendar', icon: 'calendar', label: 'Calendar', route: '/(tabs)/calendar' },
  { id: 'notifications', icon: 'notifications', label: 'Notifications', route: '/(tabs)/notifications' },
];

export default function CustomBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const isActive = (route) => {
    return pathname === route || pathname?.startsWith(route);
  };

  const handleNavigate = (route) => {
    setShowOptionsModal(false);
    router.push(route);
  };

  return (
    <>
      {/* Bottom Navigation */}
      <View 
        style={[
          styles.bottomNav,
          { paddingBottom: Math.max(insets.bottom, 8) }
        ]}
      >
        {/* Left - Home */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/home')}
        >
          <View style={[
            styles.iconContainer,
            isActive('/(tabs)/home') && styles.iconContainerActive
          ]}>
            <Ionicons
              name="home"
              size={28}
              color={isActive('/(tabs)/home') ? '#16a34a' : '#9ca3af'}
            />
          </View>
          <Text style={[
            styles.navLabel,
            isActive('/(tabs)/home') && styles.navLabelActive
          ]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Center - Floating Options Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowOptionsModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.floatingButtonInner}>
            <Ionicons name="apps" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Right - Profile */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={[
            styles.iconContainer,
            isActive('/(tabs)/profile') && styles.iconContainerActive
          ]}>
            <Ionicons
              name="person"
              size={28}
              color={isActive('/(tabs)/profile') ? '#16a34a' : '#9ca3af'}
            />
          </View>
          <Text style={[
            styles.navLabel,
            isActive('/(tabs)/profile') && styles.navLabelActive
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Navigate</Text>
              <TouchableOpacity
                onPress={() => setShowOptionsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsGrid}>
              {optionsMenu.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isActive(option.route) && styles.optionCardActive
                  ]}
                  onPress={() => handleNavigate(option.route)}
                >
                  <View style={[
                    styles.optionIcon,
                    isActive(option.route) && styles.optionIconActive
                  ]}>
                    <Ionicons
                      name={option.icon}
                      size={36}
                      color={isActive(option.route) ? '#16a34a' : '#6b7280'}
                    />
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    isActive(option.route) && styles.optionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    paddingHorizontal: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainerActive: {
    backgroundColor: '#16a34a15',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  navLabelActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    zIndex: 10,
  },
  floatingButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 0,
  },
  optionCard: {
    width: '30%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    margin: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    backgroundColor: '#16a34a15',
    borderColor: '#16a34a',
  },
  optionIcon: {
    marginBottom: 10,
  },
  optionIconActive: {
    // Icon color handled in component
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  optionLabelActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
});
