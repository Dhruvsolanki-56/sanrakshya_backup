import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback, Animated, Alert, Dimensions, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { childrenService } from '../../services/childrenService';
import { enums } from '../../services/storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const ChildRegistrationScreen = ({ navigation }) => {
  const tabBarHeight = typeof useBottomTabBarHeight === 'function' ? useBottomTabBarHeight() : 80;

  // Form State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(enums.Gender[0]);
  const [bloodGroup, setBloodGroup] = useState(enums.BloodGroup[0]);

  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  // Selection State for Custom Picker
  const today = new Date();
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(today.getFullYear() - 10);

  const [selYear, setSelYear] = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1);
  const [selDay, setSelDay] = useState(today.getDate());

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();

    if (!dob) setDob(formatYMD(today));
  }, []);

  const formatYMD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const updateDobFromSelection = () => {
    if (selYear && selMonth && selDay) {
      const d = new Date(selYear, selMonth - 1, selDay);
      setDob(formatYMD(d));
    }
  };

  const getDayOptions = () => {
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const validate = () => {
    if (!fullName.trim()) return 'Please enter the full name.';
    if (!gender) return 'Please select a gender.';
    const d = new Date(dob);
    if (d > today) return 'Date of birth cannot be in the future.';
    return '';
  };

  const onSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const v = validate();
    if (v) {
      setError(v);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await childrenService.createChild({
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        blood_group: bloodGroup,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome aboard! 🚀', 'Registration successful.', [
        { text: 'Let\'s Go', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err?.data?.detail?.[0]?.msg || err?.message || 'Failed to register.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Child</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]} showsVerticalScrollIndicator={false}>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Intro Card */}
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.introCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Health Passport</Text>
              <Text style={styles.introSub}>Create a digital health identity to track growth, vaccines, and milestones.</Text>
            </View>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Aarav Sharma"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* DOB Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DATE OF BIRTH</Text>
              <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDobPicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <Text style={styles.inputText}>{dob ? new Date(dob).toDateString() : 'Select Date'}</Text>
                <View style={styles.editBadge}>
                  <Text style={styles.editBadgeText}>CHANGE</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GENDER</Text>
              <View style={styles.row}>
                {enums.Gender.map((g) => {
                  const active = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => { setGender(g); Haptics.selectionAsync(); }}
                    >
                      <Ionicons
                        name={g === 'Male' ? 'male' : g === 'Female' ? 'female' : 'person'}
                        size={18}
                        color={active ? '#FFF' : '#64748B'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Blood Group Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BLOOD GROUP</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {enums.BloodGroup.map((b) => {
                  const active = bloodGroup === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[styles.bloodChip, active && styles.bloodChipActive]}
                      onPress={() => { setBloodGroup(b); Haptics.selectionAsync(); }}
                    >
                      <Text style={[styles.bloodText, active && styles.bloodTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={onSubmit}
              disabled={loading}
            >
              <LinearGradient colors={['#4F46E5', '#4338CA']} style={styles.gradientBtn}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Create Health Passport</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </Animated.View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDobPicker} transparent animationType="slide" onRequestClose={() => setShowDobPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll}>
                  {getDayOptions().map(d => (
                    <TouchableOpacity key={d} style={[styles.pickerItem, selDay === d && styles.pickerItemActive]} onPress={() => setSelDay(d)}>
                      <Text style={[styles.pickerText, selDay === d && styles.pickerTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <TouchableOpacity key={m} style={[styles.pickerItem, selMonth === m && styles.pickerItemActive]} onPress={() => setSelMonth(m)}>
                      <Text style={[styles.pickerText, selMonth === m && styles.pickerTextActive]}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll}>
                  {Array.from({ length: 20 }, (_, i) => today.getFullYear() - i).map(y => (
                    <TouchableOpacity key={y} style={[styles.pickerItem, selYear === y && styles.pickerItemActive]} onPress={() => setSelYear(y)}>
                      <Text style={[styles.pickerText, selYear === y && styles.pickerTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={() => { updateDobFromSelection(); setShowDobPicker(false); }}>
              <Text style={styles.confirmText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

  content: { padding: 20 },
  introCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: '#E0E7FF' },
  cardIcon: { width: 50, height: 50, borderRadius: 12, marginLeft: 16 },
  introTitle: { fontSize: 18, fontWeight: '800', color: '#4338CA', marginBottom: 4 },
  introSub: { fontSize: 13, color: '#6366F1', lineHeight: 18 },

  formSection: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#E2E8F0' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  inputText: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },

  editBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBadgeText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },

  row: { flexDirection: 'row', gap: 12 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#FFF' },

  bloodChip: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  bloodChipActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  bloodText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  bloodTextActive: { color: '#FFF' },

  errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 20 },
  errorText: { marginLeft: 8, color: '#EF4444', fontSize: 14, flex: 1 },

  submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  gradientBtn: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  pickerRow: { flexDirection: 'row', gap: 12, height: 200 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textAlign: 'center' },
  pickerScroll: { backgroundColor: '#F8FAFC', borderRadius: 12 },
  pickerItem: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerItemActive: { backgroundColor: '#EEF2FF' },
  pickerText: { fontSize: 16, color: '#1E293B' },
  pickerTextActive: { color: '#4F46E5', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  confirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default ChildRegistrationScreen;
