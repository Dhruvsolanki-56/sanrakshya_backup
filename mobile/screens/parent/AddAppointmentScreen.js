import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');

const AddAppointmentScreen = ({ navigation }) => {
  /* -------------------------------------------------------------------------- */
  /*                               Logic Section                                */
  /* -------------------------------------------------------------------------- */
  const { selectedChild, children } = useSelectedChild();

  // Track which child is being booked for (default to globally selected child)
  const [formChild, setFormChild] = useState(selectedChild);
  const [showChildPicker, setShowChildPicker] = useState(false);

  // Sync when global selection changes (optional, but good for initial load)
  // useEffect(() => { setFormChild(selectedChild); }, [selectedChild]);

  // Calculate age helper
  const getAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' years old';
  };

  const [formData, setFormData] = useState({
    childName: formChild?.name || 'Child',
    childId: formChild?.id || null,
    appointmentType: 'General Checkup',
    doctorName: '',
    hospital: '',
    date: new Date(),
    time: new Date(),
    reason: '',
    questions: '',
    reminder: '1 day before',
  });

  // Update formData when formChild changes
  const handleChildSelect = (child) => {
    setFormChild(child);
    setFormData(prev => ({
      ...prev,
      childName: child.name,
      childId: child.id
    }));
    setShowChildPicker(false);
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const appointmentTypes = [
    { id: 'General Checkup', icon: 'medical-outline', color: '#3B82F6' },
    { id: 'Vaccination', icon: 'shield-checkmark-outline', color: '#10B981' },
    { id: 'Specialist', icon: 'body-outline', color: '#F59E0B' },
    { id: 'Dental', icon: 'happy-outline', color: '#EF4444' },
    { id: 'Therapy', icon: 'chatbubbles-outline', color: '#8B5CF6' },
    { id: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
  ];

  const reminderOptions = ['None', '1 hour before', '1 day before', '2 days before'];

  const handleSave = () => {
    if (!formData.doctorName || !formData.reason) {
      Alert.alert('Missing Information', 'Please fill in the required fields to verify the booking.');
      return;
    }

    setShowConfirmation(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const confirmBooking = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowConfirmation(false);
      navigation.goBack();
    });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) updateFormData('date', selectedDate);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) updateFormData('time', selectedTime);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /* -------------------------------------------------------------------------- */
  /*                               UI Render                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Appointment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Section 1: Child Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>For whom?</Text>
            <TouchableOpacity
              style={styles.glassCardRow}
              activeOpacity={0.8}
              onPress={() => setShowChildPicker(true)}
            >
              <View style={[styles.avatarContainer, { backgroundColor: '#DBEAFE', overflow: 'hidden' }]}>
                {formChild?.avatarSource ? (
                  <Image source={formChild.avatarSource} style={{ width: 48, height: 48 }} />
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1D4ED8' }}>
                    {formChild?.name?.charAt(0) || '?'}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{formChild?.name || 'Select Child'}</Text>
                <Text style={styles.cardSub}>{formChild?.ageText || (formChild?.ageYears ? `${formChild.ageYears} years old` : 'Age unknown')}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Section 2: Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Appointment Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
              {appointmentTypes.map((type) => {
                const isActive = formData.appointmentType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => updateFormData('appointmentType', type.id)}
                    style={[
                      styles.chip,
                      isActive ? { backgroundColor: type.color, borderColor: type.color } : { borderColor: '#E2E8F0' }
                    ]}
                  >
                    <Ionicons name={type.icon} size={18} color={isActive ? '#FFF' : type.color} style={{ marginRight: 6 }} />
                    <Text style={[styles.chipText, isActive && { color: '#FFF' }]}>{type.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section 3: Details Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Details</Text>
            <View style={styles.glassCard}>

              {/* Doctor */}
              <View style={styles.inputRow}>
                <Ionicons name="medkit-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabelSmall}>Doctor Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.doctorName}
                    onChangeText={(t) => updateFormData('doctorName', t)}
                    placeholder="e.g. Dr. Sarah"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Hospital */}
              <View style={styles.inputRow}>
                <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabelSmall}>Hospital / Clinic</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.hospital}
                    onChangeText={(t) => updateFormData('hospital', t)}
                    placeholder="e.g. City Children's Hospital"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Section 4: Date & Time */}
          <View style={styles.section}>
            <Text style={styles.label}>When?</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[styles.glassCard, { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 }]} onPress={() => setShowDatePicker(true)}>
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.inputLabelSmall}>Date</Text>
                  <Text style={styles.cardTitle}>{formatDate(formData.date)}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.glassCard, { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 }]} onPress={() => setShowTimePicker(true)}>
                <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="time" size={20} color="#10B981" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.inputLabelSmall}>Time</Text>
                  <Text style={styles.cardTitle}>{formatTime(formData.time)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 5: Reason & Questions */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <View style={[styles.glassCard, { padding: 0 }]}>
              <TextInput
                style={[styles.textInput, { padding: 16, minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Reason for visit (e.g. Follow-up, Fever)..."
                placeholderTextColor="#94A3B8"
                multiline
                value={formData.reason}
                onChangeText={(t) => updateFormData('reason', t)}
              />
              <View style={styles.divider} />
              <TextInput
                style={[styles.textInput, { padding: 16, minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Questions for the doctor..."
                placeholderTextColor="#94A3B8"
                multiline
                value={formData.questions}
                onChangeText={(t) => updateFormData('questions', t)}
              />
            </View>
          </View>

          {/* Section 6: Reminders */}
          <View style={styles.section}>
            <Text style={styles.label}>Remind me</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {reminderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => updateFormData('reminder', opt)}
                  style={[
                    styles.chipSmall,
                    formData.reminder === opt ? { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } : { borderColor: '#CBD5E1' }
                  ]}
                >
                  <Text style={[styles.chipTextSmall, formData.reminder === opt && { color: '#FFF' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* CTA Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryBtnText}>Confirm Booking</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Pickers */}
      {showDatePicker && (
        <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
      )}
      {showTimePicker && (
        <DateTimePicker value={formData.time} mode="time" display="default" onChange={onTimeChange} />
      )}

      {/* Confirmation Modal */}
      <Modal transparent visible={showConfirmation} onRequestClose={() => setShowConfirmation(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
            <View style={styles.modalIcon}>
              <Ionicons name="checkmark" size={40} color="#FFF" />
            </View>
            <Text style={styles.modalTitle}>Booked Successfully!</Text>
            <Text style={styles.modalText}>Your appointment with Dr. {formData.doctorName} is set for {formatDate(formData.date)} at {formatTime(formData.time)}.</Text>

            <TouchableOpacity style={styles.modalBtn} onPress={confirmBooking}>
              <Text style={styles.modalBtnText}>Great, thanks!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Child Picker Modal */}
      <Modal transparent visible={showChildPicker} onRequestClose={() => setShowChildPicker(false)} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowChildPicker(false)}>
          <View style={[styles.modalCard, { padding: 0, overflow: 'hidden' }]}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={{ padding: 20, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Select Child</Text>
            </LinearGradient>
            <ScrollView style={{ width: '100%', maxHeight: 300 }}>
              {children.map((child, idx) => (
                <TouchableOpacity
                  key={child.id || idx}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 16,
                    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
                    backgroundColor: formChild?.id === child.id ? '#EFF6FF' : '#FFF'
                  }}
                  onPress={() => handleChildSelect(child)}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', overflow: 'hidden', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                    {child.avatarSource ? <Image source={child.avatarSource} style={{ width: 40, height: 40 }} /> : <Text style={{ fontWeight: '700', color: '#1D4ED8' }}>{child.name.charAt(0)}</Text>}
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E293B' }}>{child.name}</Text>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>{child.ageText}</Text>
                  </View>
                  {formChild?.id === child.id && <Ionicons name="checkmark" size={20} color="#3B82F6" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ padding: 16, alignItems: 'center' }} onPress={() => setShowChildPicker(false)}>
              <Text style={{ color: '#64748B', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  section: { marginTop: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12, marginLeft: 4 },

  /* Cards */
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden'
  },
  glassCardRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },

  /* Avatar */
  avatarContainer: {
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  cardSub: { fontSize: 13, color: '#64748B' },

  /* Chips */
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  chipSmall: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1,
  },
  chipTextSmall: { fontSize: 13, fontWeight: '500', color: '#475569' },

  /* Inputs */
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  inputIcon: { marginRight: 12 },
  inputWrapper: { flex: 1 },
  inputLabelSmall: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  textInput: { fontSize: 16, color: '#1E293B', padding: 0 },
  divider: { height: 1, backgroundColor: '#E2E8F0' },

  /* Icons */
  iconBox: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center'
  },

  /* Footer */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderTopWidth: 1, borderTopColor: '#E2E8F0'
  },
  primaryBtn: {
    borderRadius: 16, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  primaryBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', width: '100%', maxWidth: 340,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20
  },
  modalIcon: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#10B981',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 10
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  modalText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalBtn: { backgroundColor: '#F1F5F9', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
  modalBtnText: { color: '#1E293B', fontWeight: '600', fontSize: 15 }
});

export default AddAppointmentScreen;
