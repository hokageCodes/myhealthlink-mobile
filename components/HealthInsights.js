import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getNormalRange = (type) => {
  const ranges = {
    bloodPressure: { normal: '< 120/80', elevated: '120-139/80-89', high: '> 140/90' },
    glucose: { normal: '70-100 mg/dL', elevated: '100-126 mg/dL', high: '> 126 mg/dL' },
    heartRate: { normal: '60-100 bpm', elevated: '> 100 bpm', low: '< 60 bpm' },
    temperature: { normal: '36.1-37.2°C', elevated: '> 37.2°C', low: '< 36.1°C' },
    oxygenSaturation: { normal: '> 95%', low: '< 95%' },
    weight: { normal: 'BMI 18.5-24.9' },
  };
  return ranges[type] || null;
};

const getValueStatus = (type, value) => {
  if (!value) return null;

  if (type === 'bloodPressure') {
    if (typeof value === 'object' && value.systolic && value.diastolic) {
      if (value.systolic >= 140 || value.diastolic >= 90) return 'high';
      if (value.systolic >= 130 || value.diastolic >= 85) return 'elevated';
      return 'normal';
    }
    return null;
  }

  if (type === 'glucose') {
    const numValue = typeof value === 'object' ? value.numeric : parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue >= 126) return 'high';
      if (numValue >= 100) return 'elevated';
      if (numValue >= 70) return 'normal';
      return 'low';
    }
  }

  if (type === 'heartRate') {
    const numValue = typeof value === 'object' ? value.numeric : parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue > 100) return 'high';
      if (numValue < 60) return 'low';
      return 'normal';
    }
  }

  if (type === 'temperature') {
    const numValue = typeof value === 'object' ? value.numeric : parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue > 37.2) return 'high';
      if (numValue < 36.1) return 'low';
      return 'normal';
    }
  }

  if (type === 'oxygenSaturation') {
    const numValue = typeof value === 'object' ? value.numeric : parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue < 95) return 'low';
      return 'normal';
    }
  }

  return null;
};

const getStatusColor = (status) => {
  const colors = {
    normal: { color: '#10b981', bg: '#f0fdf4', text: '#065f46' },
    elevated: { color: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    high: { color: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
    low: { color: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
  };
  return colors[status] || colors.normal;
};

const getTrend = (metrics) => {
  if (!metrics || metrics.length < 2) return null;

  const sortedMetrics = [...metrics].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return dateA - dateB;
  });

  const recent = sortedMetrics.slice(-3);
  const older = sortedMetrics.slice(-6, -3);

  if (older.length === 0) return null;

  // Calculate average
  const getAvg = (list) => {
    const values = list.map(m => {
      if (m.value?.systolic) return m.value.systolic;
      if (typeof m.value === 'object' && m.value.numeric !== undefined) return m.value.numeric;
      if (typeof m.value === 'number') return m.value;
      return 0;
    }).filter(v => v > 0);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  const recentAvg = getAvg(recent);
  const olderAvg = getAvg(older);

  if (olderAvg === 0) return null;

  const change = ((recentAvg - olderAvg) / olderAvg * 100);
  
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
};

export default function HealthInsights({ metrics = [], type }) {
  if (!metrics || metrics.length === 0 || !type) return null;

  const normalRange = getNormalRange(type);
  const latestMetric = metrics[metrics.length - 1];
  const status = getValueStatus(type, latestMetric.value);
  const trend = getTrend(metrics);
  const statusData = status ? getStatusColor(status) : null;

  if (!normalRange && !status) return null;

  return (
    <View style={styles.container}>
      {statusData && (
        <View style={[styles.statusBadge, { backgroundColor: statusData.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusData.color }]} />
          <Text style={[styles.statusText, { color: statusData.text }]}>
            {status === 'normal' && 'Normal'}
            {status === 'elevated' && 'Slightly Elevated'}
            {status === 'high' && 'High - Consider Doctor'}
            {status === 'low' && 'Low - Monitor Closely'}
          </Text>
        </View>
      )}

      <View style={styles.infoGrid}>
        {normalRange && (
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              Normal Range: {normalRange.normal || Object.values(normalRange)[0]}
            </Text>
          </View>
        )}

        {trend && (
          <View style={styles.infoItem}>
            <Ionicons 
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove-outline'} 
              size={16} 
              color={trend === 'up' ? '#ef4444' : trend === 'down' ? '#10b981' : '#6b7280'} 
            />
            <Text style={[styles.infoText, { color: trend === 'up' ? '#ef4444' : trend === 'down' ? '#10b981' : '#6b7280' }]}>
              {trend === 'up' && 'Trending Up ↑'}
              {trend === 'down' && 'Trending Down ↓'}
              {trend === 'stable' && 'Trend Stable →'}
            </Text>
          </View>
        )}
      </View>

      {status === 'high' && (
        <View style={styles.alert}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.alertText}>
            Consider consulting your doctor if this pattern continues.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 18,
  },
});

