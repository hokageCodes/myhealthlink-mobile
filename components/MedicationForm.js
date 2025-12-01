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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'twice-daily', label: 'Twice Daily' },
  { value: 'three-times-daily', label: 'Three Times Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as-needed', label: 'As Needed' },
];

const FORM_OPTIONS = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'injection', label: 'Injection' },
  { value: 'topical', label: 'Topical' },
  { value: 'other', label: 'Other' },
];

export default function MedicationForm({ visible, onClose, onSubmit, initialData }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('tablet');
  const [frequency, setFrequency] = useState('daily');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [prescribedBy, setPrescribedBy] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDosage(initialData.dosage || '');
      setForm(initialData.form || 'tablet');
      setFrequency(initialData.frequency || 'daily');
      setStartDate(initialData.startDate ? new Date(initialData.startDate) : new Date());
      setEndDate(initialData.endDate ? new Date(initialData.endDate) : null);
      setPrescribedBy(initialData.prescribedBy || '');
      setInstructions(initialData.instructions || '');
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setName('');
    setDosage('');
    setForm('tablet');
    setFrequency('daily');
    setStartDate(new Date());
    setEndDate(null);
    setPrescribedBy('');
    setInstructions('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Medication name is required';
    if (!dosage.trim()) newErrors.dosage = 'Dosage is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const medicationData = {
      name: name.trim(),
      dosage: dosage.trim(),
      form,
      frequency,
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : undefined,
      prescribedBy: prescribedBy.trim() || undefined,
      instructions: instructions.trim() || undefined,
    };

    onSubmit(medicationData);
    resetForm();
  };

  const handleDateChange = (event, selectedDate, field) => {
    if (Platform.OS === 'android') {
      if (field === 'start') setShowStartDatePicker(false);
      if (field === 'end') setShowEndDatePicker(false);
    }
    if (selectedDate) {
      if (field === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {initialData ? 'Edit Medication' : 'Add Medication'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Medication Name *</Text>
              <TextInput style={[styles.input, errors.name && styles.inputError]} value={name} onChangeText={(text) => { setName(text); setErrors({ ...errors, name: undefined }); }} placeholder="e.g., Aspirin" placeholderTextColor="#9ca3af" />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Dosage *</Text>
              <TextInput style={[styles.input, errors.dosage && styles.inputError]} value={dosage} onChangeText={(text) => { setDosage(text); setErrors({ ...errors, dosage: undefined }); }} placeholder="e.g., 50mg" placeholderTextColor="#9ca3af" />
              {errors.dosage && <Text style={styles.errorText}>{errors.dosage}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Form</Text>
              <View style={styles.gridContainer}>
                {FORM_OPTIONS.map((option) => (
                  <TouchableOpacity key={option.value} style={[styles.chip, form === option.value && styles.chipActive]} onPress={() => setForm(option.value)}>
                    <Text style={[styles.chipText, form === option.value && styles.chipTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.gridContainer}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <TouchableOpacity key={option.value} style={[styles.chip, frequency === option.value && styles.chipActive]} onPress={() => setFrequency(option.value)}>
                    <Text style={[styles.chipText, frequency === option.value && styles.chipTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#16a34a" />
                <Text style={styles.dateText}>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </TouchableOpacity>
              {showStartDatePicker && <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, date) => handleDateChange(event, date, 'start')} />}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>End Date (Optional)</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#16a34a" />
                <Text style={styles.dateText}>{endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No end date'}</Text>
              </TouchableOpacity>
              {showEndDatePicker && <DateTimePicker value={endDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, date) => handleDateChange(event, date, 'end')} />}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Prescribed By</Text>
              <TextInput style={styles.input} value={prescribedBy} onChangeText={setPrescribedBy} placeholder="e.g., Dr. John Smith" placeholderTextColor="#9ca3af" />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Instructions</Text>
              <TextInput style={[styles.textArea, errors.instructions && styles.inputError]} value={instructions} onChangeText={(text) => { if (text.length <= 500) { setInstructions(text); setErrors({ ...errors, instructions: undefined }); } }} placeholder="Special instructions..." placeholderTextColor="#9ca3af" multiline numberOfLines={4} textAlignVertical="top" maxLength={500} />
              <Text style={styles.charCount}>{instructions.length}/500 characters</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, !name && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={!name}>
              <Text style={styles.submitButtonText}>{initialData ? 'Update' : 'Add'} Medication</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContainer: { flex: 1, backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 'auto', maxHeight: '90%', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 10 }, android: { elevation: 10 } }) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  closeButton: { padding: 4 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { height: 50, backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', ...Platform.select({ ios: { paddingVertical: 14 }, android: { paddingVertical: 12 } }) },
  dateButton: { height: 50, backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { fontSize: 16, color: '#111827', fontWeight: '500' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', margin: 6 },
  chipActive: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#16a34a' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#16a34a' },
  textArea: { minHeight: 100, backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, fontSize: 16, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', ...Platform.select({ ios: { paddingTop: 14 }, android: { paddingTop: 12 } }) },
  charCount: { fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'right' },
  inputError: { borderColor: '#ef4444' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 12, ...Platform.select({ ios: { paddingBottom: 34 }, android: { paddingBottom: 16 } }) },
  cancelButton: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#f3f4f6' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  submitButton: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#16a34a' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});

