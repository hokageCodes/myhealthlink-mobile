import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getStatusColor = (status) => {
  const colors = {
    scheduled: '#3b82f6',
    confirmed: '#16a34a',
    completed: '#6b7280',
    cancelled: '#ef4444',
  };
  return colors[status] || '#6b7280';
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatShortDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if it's today
  if (d.toDateString() === today.toDateString()) {
    return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // Check if it's tomorrow
  if (d.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  return d.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export default function AppointmentCard({ appointment, onEdit, onDelete }) {
  const status = appointment.status || 'scheduled';
  const statusColor = getStatusColor(status);

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentTitle} numberOfLines={2}>
            {appointment.title || 'Medical Appointment'}
          </Text>
          
          {appointment.provider && (
            <View style={styles.providerRow}>
              <Ionicons name="person" size={16} color="#6b7280" />
              <Text style={styles.providerText} numberOfLines={1}>
                {appointment.provider}
              </Text>
            </View>
          )}
          
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.dateText} numberOfLines={1}>
              {formatShortDate(appointment.date)}
            </Text>
          </View>
          
          {appointment.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {appointment.location}
              </Text>
            </View>
          )}
        </View>

        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onEdit(appointment)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="create-outline" size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onDelete(appointment)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {appointment.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {appointment.notes}
        </Text>
      )}
    </TouchableOpacity>
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
    flexDirection: 'row',
    padding: 16,
  },
  statusIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  providerText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  notes: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontStyle: 'italic',
  },
});

