import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 32; // 16px padding on each side

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

const getMetricLabel = (type) => {
  const labels = {
    'bloodPressure': 'Blood Pressure',
    'weight': 'Weight',
    'glucose': 'Blood Glucose',
    'heartRate': 'Heart Rate',
    'temperature': 'Temperature',
    'oxygenSaturation': 'Oxygen Saturation',
    'custom': 'Custom Metric',
  };
  return labels[type] || 'Metric';
};

const formatDateLabel = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
};

export default function HealthMetricChart({ metrics, type }) {
  if (!metrics || metrics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={48} color="#e5e7eb" />
        <Text style={styles.emptyText}>No data available for chart</Text>
        <Text style={styles.emptySubtext}>
          Add more measurements to see trends over time
        </Text>
      </View>
    );
  }

  // Sort metrics by date
  const sortedMetrics = [...metrics].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return dateA - dateB;
  });

  // Prepare chart data
  const labels = sortedMetrics.map(metric => {
    return formatDateLabel(metric.date || metric.createdAt);
  });

  const data = sortedMetrics.map(metric => {
    // Handle blood pressure specially
    if (type === 'bloodPressure') {
      if (typeof metric.value === 'object' && metric.value.systolic) {
        return metric.value.systolic;
      }
      if (typeof metric.value === 'string' && metric.value.includes('/')) {
        return parseFloat(metric.value.split('/')[0]);
      }
    }
    
    // Handle other numeric values
    if (typeof metric.value === 'number') {
      return metric.value;
    }
    if (metric.value?.numeric !== undefined) {
      return metric.value.numeric;
    }
    if (typeof metric.value === 'string') {
      const parsed = parseFloat(metric.value);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  });

  const color = getMetricColor(type);
  const label = getMetricLabel(type);
  const unit = metrics[0]?.unit || '';

  const chartData = {
    labels: labels.length > 7 ? labels.slice(-7) : labels, // Show last 7 or all if less
    datasets: [
      {
        data: data.length > 7 ? data.slice(-7) : data,
        color: (opacity = 1) => color,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: type === 'bloodPressure' ? 0 : 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: '#e5e7eb',
      strokeWidth: 1,
    },
  };

  // Calculate statistics
  const latestValue = data[data.length - 1];
  const average = data.reduce((sum, val) => sum + val, 0) / data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);

  // Format value based on type
  const formatValue = (value) => {
    if (type === 'bloodPressure') {
      return Math.round(value);
    }
    return value.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name="analytics" size={20} color={color} />
          </View>
          <Text style={styles.title}>{label} Trends</Text>
        </View>
        <Text style={styles.unitText}>{unit}</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chartScrollView}
        contentContainerStyle={styles.chartContentContainer}
      >
        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLabels={true}
        />
      </ScrollView>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Latest</Text>
          <Text style={[styles.statValue, { color }]}>
            {formatValue(latestValue)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{formatValue(average)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>{formatValue(min)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>{formatValue(max)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  chartScrollView: {
    marginHorizontal: -16,
  },
  chartContentContainer: {
    paddingHorizontal: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});

