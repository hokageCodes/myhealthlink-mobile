import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const METRIC_TYPES = [
  { type: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', icon: 'pulse' },
  { type: 'weight', label: 'Weight', unit: 'kg', icon: 'scale' },
  { type: 'glucose', label: 'Blood Glucose', unit: 'mg/dL', icon: 'flask' },
  { type: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: 'heart' },
  { type: 'temperature', label: 'Temperature', unit: '°C', icon: 'thermometer' },
  { type: 'oxygenSaturation', label: 'Oxygen Saturation', unit: '%', icon: 'air' },
];

export default function HealthMetricForm({ visible, onClose, onSubmit, initialData }) {
  const [selectedType, setSelectedType] = useState(initialData?.type || '');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setSelectedType(initialData.type);
      if (initialData.type === 'bloodPressure') {
        if (typeof initialData.value === 'object') {
          setSystolic(String(initialData.value.systolic || ''));
          setDiastolic(String(initialData.value.diastolic || ''));
        } else if (typeof initialData.value === 'string' && initialData.value.includes('/')) {
          const [sys, dia] = initialData.value.split('/');
          setSystolic(sys.trim());
          setDiastolic(dia.trim());
        }
      } else {
        setValue(String(initialData.value || ''));
      }
      setNotes(initialData.notes || '');
      setDate(initialData.date ? new Date(initialData.date) : new Date());
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setSelectedType('');
    setSystolic('');
    setDiastolic('');
    setValue('');
    setNotes('');
    setDate(new Date());
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    
    if (!selectedType) {
      newErrors.type = 'Please select a metric type';
    }
    
    if (selectedType === 'bloodPressure') {
      if (!systolic || isNaN(systolic) || parseFloat(systolic) <= 0) {
        newErrors.systolic = 'Valid systolic value is required';
      }
      if (!diastolic || isNaN(diastolic) || parseFloat(diastolic) <= 0) {
        newErrors.diastolic = 'Valid diastolic value is required';
      }
      if (parseFloat(systolic) <= parseFloat(diastolic)) {
        newErrors.bloodPressure = 'Systolic should be greater than diastolic';
      }
    } else {
      if (!value || isNaN(value) || parseFloat(value) <= 0) {
        newErrors.value = 'Valid value is required';
      }
    }
    
    if (notes && notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const metricType = METRIC_TYPES.find(m => m.type === selectedType);
    const metricData = {
      type: selectedType,
      unit: metricType.unit,
      notes: notes.trim() || undefined,
      date: date.toISOString(),
    };

    if (selectedType === 'bloodPressure') {
      metricData.value = {
        systolic: parseFloat(systolic),
        diastolic: parseFloat(diastolic),
      };
    } else {
      metricData.value = parseFloat(value);
    }

    onSubmit(metricData);
    resetForm();
  };

  const selectedMetric = METRIC_TYPES.find(m => m.type === selectedType);
  const isBloodPressure = selectedType === 'bloodPressure';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {initialData ? 'Edit Metric' : 'Add Health Metric'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Metric Type Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Metric Type *</Text>
              <View style={styles.typeGrid}>
                {METRIC_TYPES.map((metric) => (
                  <TouchableOpacity
                    key={metric.type}
                    style={[
                      styles.typeCard,
                      selectedType === metric.type && styles.typeCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedType(metric.type);
                      setErrors({ ...errors, type: undefined });
                    }}
                  >
                    <Ionicons
                      name={metric.icon}
                      size={24}
                      color={selectedType === metric.type ? '#16a34a' : '#6b7280'}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        selectedType === metric.type && styles.typeLabelSelected,
                      ]}
                    >
                      {metric.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
            </View>

            {/* Value Input */}
            {selectedType && (
              <View style={styles.section}>
                {isBloodPressure ? (
                  <>
                    <Text style={styles.label}>Blood Pressure *</Text>
                    <View style={styles.bloodPressureRow}>
                      <View style={styles.bloodPressureInput}>
                        <Text style={styles.bloodPressureLabel}>Systolic</Text>
                        <TextInput
                          style={[
                            styles.input,
                            errors.systolic && styles.inputError,
                          ]}
                          value={systolic}
                          onChangeText={(text) => {
                            setSystolic(text.replace(/[^0-9.]/g, ''));
                            setErrors({ ...errors, systolic: undefined });
                          }}
                          placeholder="120"
                          keyboardType="decimal-pad"
                          returnKeyType="next"
                        />
                        <Text style={styles.unitText}>{selectedMetric.unit}</Text>
                      </View>
                      <View style={styles.bloodPressureDivider}>
                        <Text style={styles.dividerText}>/</Text>
                      </View>
                      <View style={styles.bloodPressureInput}>
                        <Text style={styles.bloodPressureLabel}>Diastolic</Text>
                        <TextInput
                          style={[
                            styles.input,
                            errors.diastolic && styles.inputError,
                          ]}
                          value={diastolic}
                          onChangeText={(text) => {
                            setDiastolic(text.replace(/[^0-9.]/g, ''));
                            setErrors({ ...errors, diastolic: undefined });
                          }}
                          placeholder="80"
                          keyboardType="decimal-pad"
                          returnKeyType="done"
                        />
                        <Text style={styles.unitText}>{selectedMetric.unit}</Text>
                      </View>
                    </View>
                    {errors.systolic && (
                      <Text style={styles.errorText}>{errors.systolic}</Text>
                    )}
                    {errors.diastolic && (
                      <Text style={styles.errorText}>{errors.diastolic}</Text>
                    )}
                    {errors.bloodPressure && (
                      <Text style={styles.errorText}>{errors.bloodPressure}</Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Value *</Text>
                    <View style={styles.valueInputContainer}>
                      <TextInput
                        style={[styles.input, styles.valueInput, errors.value && styles.inputError]}
                        value={value}
                        onChangeText={(text) => {
                          setValue(text.replace(/[^0-9.]/g, ''));
                          setErrors({ ...errors, value: undefined });
                        }}
                        placeholder="Enter value"
                        keyboardType="decimal-pad"
                        returnKeyType="next"
                      />
                      <Text style={styles.unitText}>{selectedMetric?.unit}</Text>
                    </View>
                    {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
                  </>
                )}
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  errors.notes && styles.inputError,
                ]}
                value={notes}
                onChangeText={(text) => {
                  if (text.length <= 500) {
                    setNotes(text);
                    setErrors({ ...errors, notes: undefined });
                  }
                }}
                placeholder="Add any notes or observations..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
                returnKeyType="done"
              />
              <Text style={styles.charCount}>
                {notes.length}/500 characters
              </Text>
              {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.label}>Date & Time</Text>
              <Text style={styles.dateText}>
                {date.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.dateHint}>
                Current time will be used. Date cannot be changed from mobile.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !selectedType && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!selectedType}
            >
              <Text style={styles.submitButtonText}>
                {initialData ? 'Update' : 'Add'} Metric
              </Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeCard: {
    width: '30%',
    minWidth: 100,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    margin: 6,
  },
  typeCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#16a34a',
  },
  bloodPressureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  bloodPressureInput: {
    flex: 1,
  },
  bloodPressureLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  bloodPressureDivider: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
  dividerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9ca3af',
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        paddingVertical: 14,
      },
      android: {
        paddingVertical: 12,
      },
    }),
  },
  valueInput: {
    flex: 1,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  unitText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    minWidth: 50,
  },
  textArea: {
    minHeight: 100,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        paddingTop: 14,
      },
      android: {
        paddingTop: 12,
      },
    }),
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateHint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
    ...Platform.select({
      ios: {
        paddingBottom: 34, // Safe area for iOS
      },
      android: {
        paddingBottom: 16,
      },
    }),
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

