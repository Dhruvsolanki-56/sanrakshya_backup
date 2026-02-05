import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, ScrollView, Modal, TouchableWithoutFeedback, Platform, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { childrenService } from '../../services/childrenService';
import { enums } from '../../services/storage';

const ChildRegistrationScreen = ({ navigation }) => {
  const tabBarHeight = typeof useBottomTabBarHeight === 'function' ? useBottomTabBarHeight() : 80;
  const [fullName, setFullName] = useState('');
  const fullNameRef = useRef(null);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(enums.Gender[0]);
  const [bloodGroup, setBloodGroup] = useState(enums.BloodGroup[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayTimerRef = useRef(null);
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [selYear, setSelYear] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const [selDay, setSelDay] = useState(null);
  const today = new Date();
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(today.getFullYear() - 10);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const formatYMD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const updateDobIfComplete = (y, m, d) => {
    if (y && m && d) {
      const dateObj = new Date(y, m - 1, d);
      setDob(formatYMD(dateObj));
    }
  };

  const formatDisplayDob = (value) => {
    if (!value) return 'YYYY-MM-DD';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'YYYY-MM-DD';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mon = monthNames[dt.getMonth()];
    const yyyy = dt.getFullYear();
    return `${dd} ${mon} ${yyyy}`;
  };

  const selectedDisplayDob = () => {
    if (selYear && selMonth && selDay) {
      const d = new Date(selYear, selMonth - 1, selDay);
      return formatDisplayDob(formatYMD(d));
    }
    return formatDisplayDob(dob);
  };

  // Default DOB to today on mount
  useEffect(() => {
    if (!dob) setDob(formatYMD(today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate overlay only AFTER modal is opened (DOB/Gender/Blood)
  useEffect(() => {
    const anyOpen = showDobPicker || showGenderModal || showBloodModal;
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    if (anyOpen) {
      setOverlayMounted(false);
      overlayOpacity.setValue(0);
      overlayTimerRef.current = setTimeout(() => {
        setOverlayMounted(true);
        Animated.timing(overlayOpacity, { toValue: 0.35, duration: 150, useNativeDriver: false }).start();
      }, 120);
    } else {
      Animated.timing(overlayOpacity, { toValue: 0, duration: 80, useNativeDriver: false }).start(() => {
        setOverlayMounted(false);
      });
    }
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
    };
  }, [showDobPicker, showGenderModal, showBloodModal]);

  const validate = () => {
    if (!fullName.trim()) return 'Enter full name.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return 'DOB must be YYYY-MM-DD.';
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return 'Invalid DOB.';
    const dayOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const maxOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const minOnly = new Date(tenYearsAgo.getFullYear(), tenYearsAgo.getMonth(), tenYearsAgo.getDate());
    if (dayOnly > maxOnly) return 'DOB cannot be future.';
    if (dayOnly < minOnly) return 'DOB must be within 10 years.';
    if (!enums.Gender.includes(gender)) return 'Select a valid gender.';
    if (!enums.BloodGroup.includes(bloodGroup)) return 'Select a valid blood group.';
    return '';
  };

  const parseDobToSelections = (value) => {
    const base = value ? new Date(value) : today;
    setSelYear(base.getFullYear());
    setSelMonth(base.getMonth() + 1);
    setSelDay(base.getDate());
  };
  const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getYearOptions = () => {
    const years = [];
    for (let y = today.getFullYear(); y >= tenYearsAgo.getFullYear(); y--) years.push(y);
    return years;
  };
  const getMonthOptions = () => {
    if (!selYear) return [];
    const maxMonth = selYear === today.getFullYear() ? today.getMonth() + 1 : 12;
    const minMonth = selYear === tenYearsAgo.getFullYear() ? tenYearsAgo.getMonth() + 1 : 1;
    const arr = [];
    for (let m = minMonth; m <= maxMonth; m++) arr.push(m);
    return arr;
  };
  const getDayOptions = () => {
    if (!selYear || !selMonth) return [];
    const total = daysInMonth(selYear, selMonth);
    let maxDay = total;
    let minDay = 1;
    if (selYear === today.getFullYear() && selMonth === (today.getMonth() + 1)) maxDay = Math.min(maxDay, today.getDate());
    if (selYear === tenYearsAgo.getFullYear() && selMonth === (tenYearsAgo.getMonth() + 1)) minDay = Math.max(minDay, tenYearsAgo.getDate());
    const arr = [];
    for (let d0 = minDay; d0 <= maxDay; d0++) arr.push(d0);
    return arr;
  };

  const onSubmit = async () => {
    setAttemptedSubmit(true);
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      if (v.startsWith('Enter full name') && fullNameRef.current) {
        fullNameRef.current.focus();
      }
      return;
    }
    setLoading(true);
    try {
      await childrenService.createChild({
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        blood_group: bloodGroup,
      });
      Alert.alert('Success', 'Child registered successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      if (err?.status === 422) {
        const firstError = err?.data?.detail && err.data.detail.length > 0 ? err.data.detail[0].msg : 'Validation error.';
        setError(firstError);
      } else if (err?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else if (err?.message === 'Network request failed') {
        setError('Could not connect to the server.');
      } else {
        setError(err?.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Child</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: (tabBarHeight || 0) + 24 }]} keyboardShouldPersistTaps="handled">

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Full Name</Text>
          <View style={styles.formInputContainer}>
            <TextInput
              ref={fullNameRef}
              style={styles.formInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
            />
          </View>
          {/* Single error box used below; per-field hints removed */}
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Date of Birth</Text>
          <TouchableOpacity style={[styles.formInputContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => { parseDobToSelections(dob); setShowDobPicker(true); }}>
            <Text style={[styles.formInput, { paddingHorizontal: 12, paddingVertical: 12 }]}>{selectedDisplayDob()}</Text>
            <Ionicons name="calendar" size={18} color="#667eea" style={{ marginRight: 12 }} />
          </TouchableOpacity>
          {/* Single error box used below; per-field hints removed */}
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Gender</Text>
          <TouchableOpacity style={[styles.formInputContainer, styles.dropdownTrigger]} onPress={() => setShowGenderModal(true)}>
            <Text style={styles.dropdownText}>{gender}</Text>
            <Ionicons name="chevron-down" size={18} color="#667eea" />
          </TouchableOpacity>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Blood Group</Text>
          <TouchableOpacity style={[styles.formInputContainer, styles.dropdownTrigger]} onPress={() => setShowBloodModal(true)}>
            <Text style={styles.dropdownText}>{bloodGroup}</Text>
            <Ionicons name="chevron-down" size={18} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* Single error area above the submit action with reserved space to avoid layout shift */}
        <View style={styles.errorAreaFixed}>
          {error ? (
            <View style={[styles.errorBox, { marginTop: 12 }]}>
              <Ionicons name="alert-circle" size={18} color="#d93025" style={{ marginRight: 8 }} />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          ) : (
            <View style={{ height: 44 }} />
          )}
        </View>

        {/* Submit action within content */}
        <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={onSubmit} disabled={loading}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.buttonInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        
        {/* Modals */}
        <Modal transparent animationType="fade" visible={showDobPicker} onRequestClose={() => setShowDobPicker(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => setShowDobPicker(false)}>
              <Animated.View style={[styles.modalOverlay, { opacity: overlayMounted ? overlayOpacity : 0 }]} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '70%', paddingBottom: 16 }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                  <Ionicons name="close" size={22} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              <View style={styles.dateColumnsRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Day</Text>
                  <ScrollView>
                    {getDayOptions().map((d0) => (
                      <TouchableOpacity key={d0} style={[styles.optionItem, selDay === d0 && styles.optionSelected]} onPress={() => { setSelDay(d0); updateDobIfComplete(selYear, selMonth, d0); }}>
                        <Text style={[styles.optionText, selDay === d0 && styles.optionTextSelected]}>{String(d0).padStart(2,'0')}</Text>
                        {selDay === d0 && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Month</Text>
                  <ScrollView>
                    {getMonthOptions().map((m) => (
                      <TouchableOpacity key={m} style={[styles.optionItem, selMonth === m && styles.optionSelected]} onPress={() => { setSelMonth(m); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); updateDobIfComplete(selYear, m, selDay); }}>
                        <Text style={[styles.optionText, selMonth === m && styles.optionTextSelected]}>{monthNames[m-1]}</Text>
                        {selMonth === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Year</Text>
                  <ScrollView>
                    {getYearOptions().map((y) => (
                      <TouchableOpacity key={y} style={[styles.optionItem, selYear === y && styles.optionSelected]} onPress={() => { setSelYear(y); if (selMonth && !getMonthOptions().includes(selMonth)) setSelMonth(null); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); updateDobIfComplete(y, selMonth, selDay); }}>
                        <Text style={[styles.optionText, selYear === y && styles.optionTextSelected]}>{y}</Text>
                        {selYear === y && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent animationType="fade" visible={showGenderModal} onRequestClose={() => setShowGenderModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => setShowGenderModal(false)}>
              <Animated.View style={[styles.modalOverlay, { opacity: overlayMounted ? overlayOpacity : 0 }]} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '60%' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                  <Ionicons name="close" size={22} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {enums.Gender.map((g) => (
                  <TouchableOpacity key={g} style={[styles.optionItem, gender === g && styles.optionSelected]} onPress={() => { setGender(g); setShowGenderModal(false); }}>
                    <Text style={[styles.optionText, gender === g && styles.optionTextSelected]}>{g}</Text>
                    {gender === g && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal transparent animationType="fade" visible={showBloodModal} onRequestClose={() => setShowBloodModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => setShowBloodModal(false)}>
              <Animated.View style={[styles.modalOverlay, { opacity: overlayMounted ? overlayOpacity : 0 }]} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '60%' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Blood Group</Text>
                <TouchableOpacity onPress={() => setShowBloodModal(false)}>
                  <Ionicons name="close" size={22} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {enums.BloodGroup.map((b) => (
                  <TouchableOpacity key={b} style={[styles.optionItem, bloodGroup === b && styles.optionSelected]} onPress={() => { setBloodGroup(b); setShowBloodModal(false); }}>
                    <Text style={[styles.optionText, bloodGroup === b && styles.optionTextSelected]}>{b}</Text>
                    {bloodGroup === b && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
  content: { padding: 24, paddingBottom: 140 },
  title: { fontSize: 24, fontWeight: '700', color: '#2c3e50', marginBottom: 16 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, color: '#7f8c8d', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 16, color: '#2c3e50', backgroundColor: '#fff' },
  pickerWrapper: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 8, overflow: 'hidden' },
  button: { borderRadius: 8, overflow: 'hidden', marginTop: 8 },
  buttonInner: { height: 50, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 6 },
  dateTrigger: { justifyContent: 'center' },
  dateText: { fontSize: 16, color: '#2c3e50' },
  errorBox: { backgroundColor: '#fdecea', borderColor: '#f5c6cb', borderWidth: 1, padding: 10, borderRadius: 8, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  errorBoxText: { color: '#d93025', fontSize: 14, textAlign: 'center' },
  errorArea: { marginTop: 8 },
  fieldHelpArea: { marginTop: 4 },
  fieldHelpText: { fontSize: 12, color: '#d93025' },
  // Parity with ParentHomeScreen inline registration styles
  formRow: { width: '100%', marginTop: 12 },
  formLabel: { fontSize: 13, color: '#7f8c8d', marginBottom: 6 },
  formInputContainer: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 8, backgroundColor: '#fff' },
  formInput: { height: 46, paddingHorizontal: 12, fontSize: 16, color: '#2c3e50' },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 46 },
  dropdownText: { fontSize: 16, color: '#2c3e50' },
  errorAreaFixed: { marginTop: 8, minHeight: 52, width: '100%' },
  // Modal styles parity
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCardBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginTop: 6, backgroundColor: '#f8f9ff' },
  optionSelected: { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#dbe4ff' },
  optionText: { fontSize: 16, color: '#2c3e50' },
  optionTextSelected: { color: '#667eea', fontWeight: '700' },
  dateColumnsRow: { flexDirection: 'row', gap: 10 },
  dateColumn: { flex: 1, backgroundColor: '#f8f9ff', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8, maxHeight: 220 },
  dateColLabel: { fontSize: 12, color: '#7f8c8d', marginBottom: 6, marginLeft: 4, fontWeight: '600' },
  // Submit button parity
  emptyButton: { marginTop: 16, borderRadius: 10, overflow: 'hidden', width: '100%' },
  emptyButtonInner: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ChildRegistrationScreen;
