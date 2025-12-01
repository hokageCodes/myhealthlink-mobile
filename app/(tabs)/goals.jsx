import { useState, useEffect } from 'react';
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
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { healthGoalsAPI } from '../../src/api/healthGoals';
import useAuthStore from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';

const getToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

const CATEGORIES = [
  { id: 'weight', label: 'Weight', icon: 'scale', color: '#3b82f6' },
  { id: 'exercise', label: 'Exercise', icon: 'fitness', color: '#ef4444' },
  { id: 'blood-pressure', label: 'Blood Pressure', icon: 'pulse', color: '#10b981' },
  { id: 'blood-sugar', label: 'Blood Sugar', icon: 'flask', color: '#f59e0b' },
  { id: 'cholesterol', label: 'Cholesterol', icon: 'heart', color: '#ec4899' },
  { id: 'sleep', label: 'Sleep', icon: 'moon', color: '#8b5cf6' },
  { id: 'hydration', label: 'Hydration', icon: 'water', color: '#06b6d4' },
  { id: 'nutrition', label: 'Nutrition', icon: 'restaurant', color: '#84cc16' },
  { id: 'mental-health', label: 'Mental Health', icon: 'happy', color: '#f97316' },
  { id: 'other', label: 'Other', icon: 'ellipse', color: '#6b7280' },
];

export default function HealthGoalsScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('active');
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Fetch health goals
  const {
    data: goalsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['healthGoals', selectedFilter],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const params = { limit: 100 };
      if (selectedFilter !== 'all') params.status = selectedFilter;
      return await healthGoalsAPI.getGoals(params);
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const goals = goalsResponse?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries(['healthGoals']);
    setRefreshing(false);
  };

  const handleDelete = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const token = getToken();
            healthGoalsAPI.deleteGoal(goalId).then(() => {
              queryClient.invalidateQueries(['healthGoals']);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Goal deleted',
              });
            }).catch(() => {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete goal',
              });
            });
          },
        },
      ]
    );
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const renderGoalCard = ({ item: goal }) => {
    const daysRemaining = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0 && goal.status === 'active';
    const category = CATEGORIES.find(c => c.id === goal.category) || CATEGORIES[9];

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIcon, { backgroundColor: `${category.color}15` }]}>
            <Ionicons name={category.icon} size={24} color={category.color} />
          </View>
          <View style={styles.goalHeaderText}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.description ? (
              <Text style={styles.goalDescription} numberOfLines={2}>
                {goal.description}
              </Text>
            ) : null}
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity onPress={() => handleEdit(goal)} style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(goal._id)} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress */}
        {goal.targetValue !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercent}>{goal.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, goal.progress)}%`,
                    backgroundColor: goal.status === 'completed' ? '#10b981' : '#3b82f6',
                  },
                ]}
              />
            </View>
            <View style={styles.progressValues}>
              <Text style={styles.progressValue}>
                Current: {goal.currentValue} {goal.unit}
              </Text>
              <Text style={styles.progressValue}>
                Target: {goal.targetValue} {goal.unit}
              </Text>
            </View>
          </View>
        )}

        {/* Status and Date */}
        <View style={styles.goalFooter}>
          <View
            style={[
              styles.statusBadge,
              goal.status === 'completed' && styles.statusBadgeCompleted,
              goal.status === 'paused' && styles.statusBadgePaused,
              isOverdue && styles.statusBadgeOverdue,
              goal.status === 'active' && !isOverdue && styles.statusBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                goal.status === 'completed' && styles.statusTextCompleted,
                goal.status === 'paused' && styles.statusTextPaused,
                isOverdue && styles.statusTextOverdue,
                goal.status === 'active' && !isOverdue && styles.statusTextActive,
              ]}
            >
              {goal.status === 'completed'
                ? 'Completed'
                : goal.status === 'paused'
                ? 'Paused'
                : isOverdue
                ? 'Overdue'
                : 'Active'}
            </Text>
          </View>
          <Text style={styles.daysText}>
            {isOverdue
              ? `${Math.abs(daysRemaining)} days overdue`
              : daysRemaining >= 0
              ? `${daysRemaining} days left`
              : 'Past due'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading && goals.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Health Goals</Text>
          <Text style={styles.subtitle}>Set and track your health goals</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingGoal(null);
            setShowForm(true);
          }}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {['all', 'active', 'completed', 'paused'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Goals List */}
      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyText}>
            Set your first health goal to start tracking progress
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              setEditingGoal(null);
              setShowForm(true);
            }}
          >
            <Text style={styles.emptyButtonText}>Create Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoalCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
          }
        />
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <GoalFormModal
          goal={editingGoal}
          visible={showForm}
          onClose={handleFormClose}
          onSuccess={() => {
            queryClient.invalidateQueries(['healthGoals']);
            handleFormClose();
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: editingGoal ? 'Goal updated' : 'Goal created',
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

// Goal Form Modal Component
function GoalFormModal({ goal, visible, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('weight');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setCategory(goal.category || 'weight');
      setTargetValue(goal.targetValue?.toString() || '');
      setCurrentValue(goal.currentValue?.toString() || '0');
      setUnit(goal.unit || '');
      setTargetDate(goal.targetDate ? new Date(goal.targetDate) : new Date());
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('weight');
      setTargetValue('');
      setCurrentValue('0');
      setUnit('');
      setTargetDate(new Date());
    }
  }, [goal, visible]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Title is required',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const goalData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        currentValue: currentValue ? parseFloat(currentValue) : 0,
        unit: unit.trim() || undefined,
        targetDate: targetDate.toISOString(),
      };

      if (goal) {
        await healthGoalsAPI.updateGoal(goal._id, goalData);
      } else {
        await healthGoalsAPI.createGoal(goalData);
      }

      onSuccess();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save goal',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryInfo = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{goal ? 'Edit Goal' : 'Create Goal'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Goal title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Optional description"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categorySelector}>
                <FlatList
                  data={CATEGORIES}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryChip,
                        category === item.id && styles.categoryChipActive,
                      ]}
                      onPress={() => setCategory(item.id)}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={category === item.id ? '#ffffff' : item.color}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === item.id && styles.categoryChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>

            {/* Target Value (optional for some categories) */}
            {['weight', 'blood-pressure', 'blood-sugar', 'cholesterol', 'exercise', 'sleep', 'hydration'].includes(category) && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Value *</Text>
                <View style={styles.targetValueRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 2 }]}
                    placeholder="Target"
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9ca3af"
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginLeft: 8 }]}
                    placeholder="Unit"
                    value={unit}
                    onChangeText={setUnit}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <Text style={styles.formHelperText}>
                  e.g., 70 kg, 120/80 mmHg, 10000 steps
                </Text>
              </View>
            )}

            {/* Current Value */}
            {targetValue && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Value</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Current value"
                  value={currentValue}
                  onChangeText={setCurrentValue}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}

            {/* Target Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <Text style={styles.dateText}>
                  {targetDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setTargetDate(selectedDate);
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {goal ? 'Update Goal' : 'Create Goal'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#16a34a15',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  goalHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalHeaderText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressValue: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#dbeafe',
  },
  statusBadgeCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusBadgePaused: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeOverdue: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#1e40af',
  },
  statusTextCompleted: {
    color: '#065f46',
  },
  statusTextPaused: {
    color: '#92400e',
  },
  statusTextOverdue: {
    color: '#991b1b',
  },
  daysText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 80,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  formHelperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  categorySelector: {
    height: 100,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#16a34a',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  targetValueRow: {
    flexDirection: 'row',
  },
  dateButton: {
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});

