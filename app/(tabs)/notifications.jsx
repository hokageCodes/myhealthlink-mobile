import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { notificationsAPI } from '../../src/api/notifications';
import useAuthStore from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diff = now - past;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const getNotificationIcon = (type) => {
  const icons = {
    'reminder': 'alarm',
    'appointment': 'calendar',
    'medication': 'medical',
    'system': 'settings',
    'alert': 'alert-circle',
    'emergency': 'warning',
  };
  return icons[type] || 'notifications';
};

const getNotificationColor = (type) => {
  const colors = {
    'reminder': '#3b82f6',
    'appointment': '#16a34a',
    'medication': '#ef4444',
    'system': '#6b7280',
    'alert': '#f59e0b',
    'emergency': '#dc2626',
  };
  return colors[type] || '#6b7280';
};

function NotificationCard({ notification, onMarkRead, onDelete, onPress }) {
  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
      onPress={() => {
        if (onPress) {
          onPress(notification);
        }
        if (!notification.read && onMarkRead) {
          onMarkRead(notification._id || notification.id);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={2}>
          {notification.title}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimeAgo(notification.createdAt)}
        </Text>
      </View>

      {!notification.read && (
        <View style={styles.unreadDot} />
      )}

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(notification)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#9ca3af" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch notifications
  const {
    data: notificationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const response = await notificationsAPI.getNotifications({ limit: 100 });
      if (Array.isArray(response)) return response;
      if (response?.data) return Array.isArray(response.data) ? response.data : [];
      return [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const notifications = Array.isArray(notificationsResponse) ? notificationsResponse : [];

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await notificationsAPI.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await notificationsAPI.deleteNotification(id);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: 'Notification removed',
      });
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      return await notificationsAPI.markAllAsRead();
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'All notifications marked as read',
      });
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const handleDelete = (notification) => {
    Alert.alert(
      'Delete Notification',
      'Remove this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotificationMutation.mutate(notification._id || notification.id),
        },
      ]
    );
  };

  const handleMarkAllRead = () => {
    Alert.alert(
      'Mark All Read',
      'Mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All Read', onPress: () => markAllAsReadMutation.mutate() },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    // Mark as read when viewing
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id || notification.id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  const handleMarkReadFromModal = () => {
    if (selectedNotification && !selectedNotification.read) {
      markAsReadMutation.mutate(selectedNotification._id || selectedNotification.id);
    }
  };

  const filters = [
    { value: 'all', label: 'All', icon: 'list' },
    { value: 'unread', label: 'Unread', icon: 'mail-unread' },
    { value: 'read', label: 'Read', icon: 'mail-open' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    return selectedFilter === 'unread' ? !notification.read : notification.read;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.tabItem,
              selectedFilter === filter.value && styles.tabItemActive,
            ]}
            onPress={() => setSelectedFilter(filter.value)}
          >
            <Ionicons
              name={filter.icon}
              size={18}
              color={selectedFilter === filter.value ? '#16a34a' : '#6b7280'}
            />
            <Text
              style={[
                styles.tabText,
                selectedFilter === filter.value && styles.tabTextActive,
              ]}
            >
              {filter.label}
            </Text>
            {filter.value === 'unread' && unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{error.message}</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyScrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
            </Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id || notification.id}
              notification={notification}
              onMarkRead={markAsReadMutation.mutate}
              onDelete={handleDelete}
              onPress={handleNotificationPress}
            />
          ))}
        </ScrollView>
      )}

      {/* Notification Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedNotification && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={[styles.modalIconContainer, { backgroundColor: `${getNotificationColor(selectedNotification.type)}15` }]}>
                      <Ionicons name={getNotificationIcon(selectedNotification.type)} size={24} color={getNotificationColor(selectedNotification.type)} />
                    </View>
                    <View style={styles.modalHeaderTextContainer}>
                      <Text style={styles.modalTitle} numberOfLines={2}>{selectedNotification.title}</Text>
                      <Text style={styles.modalTime}>{formatTimeAgo(selectedNotification.createdAt)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <View style={styles.closeButtonBg}>
                      <Ionicons name="close" size={24} color="#374151" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <ScrollView style={styles.modalContent}>
                  <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  {selectedNotification.read ? (
                    <View style={styles.readBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                      <Text style={styles.readBadgeText}>Read</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={handleMarkReadFromModal} style={styles.markReadButton}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
                      <Text style={styles.markReadButtonText}>Mark as Read</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 2,
  },
  tabItemActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#16a34a',
  },
  tabBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
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
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  notificationCardUnread: {
    backgroundColor: '#f9fafb',
    borderColor: '#16a34a',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  modalHeaderTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
    alignItems: 'flex-end',
  },
  closeButtonBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  modalMessage: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  readBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 6,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  markReadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 6,
  },
});

