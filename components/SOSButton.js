import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { emergencyAPI } from '../src/api/emergency';
import Toast from 'react-native-toast-message';

export default function SOSButton() {
  const [isLoading, setIsLoading] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'We need your location to include it in the emergency SOS message. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return null;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return null;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const handleTriggerSOS = () => {
    Alert.alert(
      '🚨 Trigger Emergency SOS',
      'This will send an emergency alert with your location to all your emergency contacts via Email and SMS (if available). This feature should only be used in genuine medical emergencies. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Trigger SOS',
          style: 'destructive',
          onPress: async () => {
            await triggerEmergencySOS();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const triggerEmergencySOS = async () => {
    setIsLoading(true);
    
    try {
      // Get current location
      const location = await getCurrentLocation();

      // Trigger SOS
      const response = await emergencyAPI.triggerSOS({
        location: location || {
          latitude: null,
          longitude: null,
          accuracy: null,
        },
        notes: 'Mobile app emergency trigger',
      });

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Emergency SOS Activated',
          text2: `Alert sent to ${response.data.contactsNotified} contacts`,
        });
      } else {
        throw new Error(response.message || 'Failed to trigger SOS');
      }
    } catch (error) {
      console.error('SOS trigger error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to trigger emergency SOS. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="alert-circle" size={20} color="#dc2626" />
        </View>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
      </View>
      
      <Text style={styles.description}>
        In case of a medical emergency, tap the button below to immediately notify your emergency contacts with your location.
      </Text>

      <TouchableOpacity
        style={styles.sosButton}
        onPress={handleTriggerSOS}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <>
            <View style={styles.sosIconContainer}>
              <Ionicons name="warning" size={48} color="#ffffff" />
            </View>
            <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
        <Text style={styles.infoText}>
          Make sure your emergency contacts are up to date in your profile settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  sosButton: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosIconContainer: {
    marginBottom: 12,
  },
  sosButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
});

