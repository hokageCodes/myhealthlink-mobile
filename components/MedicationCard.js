import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

const getFrequencyLabel = (frequency) => {
  const labels = {
    'once': 'Once',
    'daily': 'Daily',
    'twice-daily': 'Twice Daily',
    'three-times-daily': '3x Daily',
    'weekly': 'Weekly',
    'as-needed': 'As Needed',
    'other': 'Other',
  };
  return labels[frequency] || frequency;
};

const getStatusColor = (status) => {
  const colors = {
    'active': '#16a34a',
    'completed': '#6b7280',
    'inactive': '#ef4444',
    'stopped': '#f59e0b',
  };
  return colors[status] || '#6b7280';
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function MedicationCard({ medication, onDelete, onLog }) {
  const status = medication.status || 'active';
  const statusColor = getStatusColor(status);

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View style={[styles.deleteActionContainer, { transform: [{ scale }] }]}>
          {onDelete && (
            <TouchableOpacity 
              style={styles.deleteActionButton}
              onPress={() => onDelete(medication)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={24} color="#ffffff" />
              <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={onDelete ? renderRightActions : null}
      overshootRight={false}
      rightThreshold={40}
    >
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name="medical" size={24} color={statusColor} />
          </View>
          
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName} numberOfLines={1}>
              {medication.name}
            </Text>
            <Text style={styles.medicationDosage}>
              {medication.dosage} • {getFrequencyLabel(medication.frequency)}
            </Text>
            {medication.prescribedBy && (
              <Text style={styles.prescribedBy} numberOfLines={1}>
                Prescribed by: {medication.prescribedBy}
              </Text>
            )}
            {medication.startDate && (
              <Text style={styles.dateText}>
                Started: {formatDate(medication.startDate)}
              </Text>
            )}
          </View>
        </View>

        {medication.instructions && (
          <Text style={styles.instructions} numberOfLines={2}>
            {medication.instructions}
          </Text>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  prescribedBy: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  instructions: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontStyle: 'italic',
  },
  rightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 12,
  },
  deleteActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionButton: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  deleteActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

