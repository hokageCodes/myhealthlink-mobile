import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getMetricIcon = (type) => {
  const icons = {
    'bloodPressure': 'pulse',
    'weight': 'scale',
    'glucose': 'flask',
    'heartRate': 'heart',
    'temperature': 'thermometer',
    'oxygenSaturation': 'air',
    'custom': 'document-text',
  };
  return icons[type] || 'stats-chart';
};

const getMetricColor = (type) => {
  const colors = {
    'bloodPressure': '#ef4444',
    'weight': '#3b82f6',
    'glucose': '#10b981',
    'heartRate': '#f59e0b',
    'temperature': '#ec4899',
    'oxygenSaturation': '#06b6d4',
    'custom': '#6b7280',
  };
  return colors[type] || '#6b7280';
};

const formatMetricValue = (type, value) => {
  if (!value) return 'N/A';
  
  if (type === 'blood-pressure' || type === 'bloodPressure') {
    if (typeof value === 'string' && value.includes('/')) {
      return value;
    }
    if (typeof value === 'object' && value.systolic && value.diastolic) {
      return `${value.systolic}/${value.diastolic}`;
    }
    return String(value);
  }
  
  return String(value);
};

export default function HealthMetricCard({ metric, onPress, onEdit, onDelete }) {
  const type = metric.type || 'custom';
  const icon = getMetricIcon(type);
  const color = getMetricColor(type);
  const value = formatMetricValue(type, metric.value);
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        
        <View style={styles.metricInfo}>
          <Text style={styles.metricType}>
            {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </Text>
          <View style={styles.valueRow}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricUnit}>{metric.unit || ''}</Text>
          </View>
          {metric.notes && (
            <Text style={styles.metricNotes} numberOfLines={1}>
              {metric.notes}
            </Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.metricDate}>{formatDate(metric.date || metric.createdAt)}</Text>
          {(onEdit || onDelete) && (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onEdit(metric)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="create-outline" size={18} color="#6b7280" />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onDelete(metric)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
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
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  metricUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  metricNotes: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metricDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});

