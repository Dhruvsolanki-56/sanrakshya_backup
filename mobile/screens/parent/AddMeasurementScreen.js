import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import { measurementsService } from '../../services/measurementsService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');

const AddMeasurementScreen = ({ navigation }) => {
  // Children & selection (global)
  const {
    children,
    selectedChild,
    selectedChildId,
    loadingChildren,
    switchingChild,
    error: childrenError,
    selectChild,
  } = useSelectedChild();

  const currentChild = selectedChild;
  const currentChildIndex = useMemo(
    () => children.findIndex(c => String(c.id) === String(selectedChildId)),
    [children, selectedChildId]
  );
  const [showChildModal, setShowChildModal] = useState(false);

  // Loading & submit
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [muacCm, setMuacCm] = useState('');
  const [sleepHours, setSleepHours] = useState('');

  // Age helpers
  const childAgeMonths = useMemo(() => {
    const dobRaw = currentChild?.dobRaw;
    if (!dobRaw) return null;
    const dob = new Date(dobRaw);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) months -= 1;
    return Math.max(0, months);
  }, [currentChild]);
  const showMuac = childAgeMonths != null && childAgeMonths > 6;

  const formatAgeText = (dobRaw) => {
    if (!dobRaw) return '';
    const dob = new Date(dobRaw);
    if (Number.isNaN(dob.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    const dayDiff = now.getDate() - dob.getDate();
    if (dayDiff < 0) months -= 1;
    if (months < 0) { years -= 1; months += 12; }
    if (years < 0) years = 0;
    if (months < 0) months = 0;
    return `${years} years ${months} ${months === 1 ? 'month' : 'months'}`;
  };

  const getAgeTextForChild = (child) => {
    if (!child) return '';
    const yearsFromApi = typeof child.ageYears === 'number' ? child.ageYears : null;
    const monthsFromApi = typeof child.ageMonths === 'number' ? child.ageMonths : null;
    if (yearsFromApi != null || monthsFromApi != null) {
      const years = yearsFromApi != null ? yearsFromApi : 0;
      const months = monthsFromApi != null ? monthsFromApi : 0;
      return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return formatAgeText(child.dobRaw);
  };

  // Align internal loading state with global loadingChildren
  useEffect(() => {
    if (loadingChildren && !children.length) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [loadingChildren, children.length]);

  // Validation helpers
  const numOrEmpty = (t) => t.replace(/[^0-9.]/g,'');
  const sanitizeInt = (t) => t.replace(/[^0-9]/g,'').replace(/^0+(?=\d)/, '');
  const sanitizeFloat = (t) => {
    const cleaned = t.replace(/[^0-9.]/g,'');
    const parts = cleaned.split('.');
    if (parts.length <= 1) return cleaned;
    return parts[0] + '.' + parts.slice(1).join('').replace(/\./g,'');
  };

  const validate = () => {
    const hStr = String(heightCm || '').trim();
    const wStr = String(weightKg || '').trim();
    const sStr = String(sleepHours || '').trim();
    const mStr = String(muacCm || '').trim();
    const h = parseFloat(hStr);
    const w = parseFloat(wStr);
    const s = parseFloat(sStr);
    const m = showMuac ? parseFloat(mStr) : null;
    const errs = [];
    // Required checks
    if (!hStr) errs.push('Height is required.');
    if (!wStr) errs.push('Weight is required.');
    if (showMuac && !mStr) errs.push('MUAC is required for children older than 6 months.');
    if (!sStr) errs.push('Average sleep hours is required.');
    // Range/validity checks
    if (hStr && (!Number.isFinite(h) || h <= 0 || h < 30 || h > 200)) errs.push('Height must be between 30 and 200 cm.');
    if (wStr && (!Number.isFinite(w) || w <= 0 || w < 1 || w > 80)) errs.push('Weight must be between 1 and 80 kg.');
    if (showMuac && mStr && (!Number.isFinite(m) || m <= 0 || m < 8 || m > 30)) errs.push('MUAC must be between 8 and 30 cm.');
    if (sStr && (!Number.isFinite(s) || s <= 0 || s > 24)) errs.push('Average sleep hours must be between 0 and 24 (greater than 0).');
    return errs;
  };

  const handleSave = async () => {
    try {
      const child = currentChild;
      if (!child?.id) {
        Alert.alert('Missing child', 'Please select a child first.');
        return;
      }
      const errs = validate();
      if (errs.length) {
        Alert.alert('Please fix the following', errs.join('\n'));
        return;
      }
      const payload = {
        height_cm: parseFloat(heightCm),
        weight_kg: parseFloat(weightKg),
        avg_sleep_hours_per_day: parseFloat(sleepHours),
        ...(showMuac && muacCm?.trim() ? { muac_cm: parseFloat(muacCm) } : {}),
      };
      setSubmitting(true);
      await measurementsService.postChildMeasurements(child.id, payload);
      Alert.alert('Success', 'Measurements submitted successfully.');
      setHeightCm(''); setWeightKg(''); setMuacCm(''); setSleepHours('');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Submission failed', e?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Add Measurement"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <LoadingState fullScreen />
      ) : (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Child Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Child</Text>
          <TouchableOpacity
            style={styles.childSelector}
            onPress={() => setShowChildModal(true)}
            disabled={loadingChildren || switchingChild || !children.length}
          >
            <View style={styles.childInfo}>
              {currentChild?.avatar ? (
                <Image source={{ uri: currentChild.avatar }} style={styles.childAvatarImg} />
              ) : (
                <View style={[styles.childAvatar, { backgroundColor: '#eef2ff' }]}> 
                  <Text style={[styles.childInitial, { color: '#667eea' }]}>{(currentChild?.name || '?').charAt(0)}</Text>
                </View>
              )}
              <View>
                <Text style={styles.childName}>{currentChild?.name || 'Child'}</Text>
                <Text style={styles.childAge}>{getAgeTextForChild(currentChild)}</Text>
              </View>
            </View>
            {switchingChild ? (
              <ActivityIndicator size="small" color="#7f8c8d" />
            ) : (
              <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
            )}
          </TouchableOpacity>
        </View>

        {/* Info banner */}
        <View style={styles.section}>
          <LinearGradient colors={["#a78bfa", "#6366f1"]} style={styles.banner}>
            <Text style={styles.bannerTitle}>Measurement Guide</Text>
            <Text style={styles.bannerHint}>Enter height (cm), weight (kg){showMuac ? ', MUAC (cm),' : ''} and average sleep hours per day. MUAC is shown for children older than 6 months.</Text>
          </LinearGradient>
        </View>

        {/* Measurement Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Metrics</Text>
          
          <View style={styles.inputRow}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.inputIconContainer}>
              <Ionicons name="man-outline" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Height</Text>
              <TextInput
                style={styles.textInput}
                value={heightCm}
                onChangeText={(text) => setHeightCm(sanitizeFloat(text))}
                placeholder="Enter height"
                placeholderTextColor="#7f8c8d"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.unitLabel}>cm</Text>
          </View>

          <View style={styles.inputRow}>
            <LinearGradient colors={['#10ac84', '#06d6a0']} style={styles.inputIconContainer}>
              <Ionicons name="scale-outline" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                style={styles.textInput}
                value={weightKg}
                onChangeText={(text) => setWeightKg(sanitizeFloat(text))}
                placeholder="Enter weight"
                placeholderTextColor="#7f8c8d"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.unitLabel}>kg</Text>
          </View>

          {showMuac && (
          <View style={styles.inputRow}>
            <LinearGradient colors={['#ffa726', '#f7b733']} style={styles.inputIconContainer}>
              <Ionicons name="fitness-outline" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>MUAC</Text>
              <TextInput
                style={styles.textInput}
                value={muacCm}
                onChangeText={(text) => setMuacCm(sanitizeFloat(text))}
                placeholder="Enter MUAC"
                placeholderTextColor="#7f8c8d"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.unitLabel}>cm</Text>
          </View>
          )}

          <View style={styles.inputRow}>
            <LinearGradient colors={['#06b6d4', '#0ea5e9']} style={styles.inputIconContainer}>
              <Ionicons name="moon-outline" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Average Sleep</Text>
              <TextInput
                style={styles.textInput}
                value={sleepHours}
                onChangeText={(text) => setSleepHours(sanitizeFloat(text))}
                placeholder="Enter hours per day"
                placeholderTextColor="#7f8c8d"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.unitLabel}>hrs</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      )}

      {/* Bottom Save Bar */}
      <View style={styles.saveBar}>
        <TouchableOpacity style={{ flex: 1 }} disabled={submitting} onPress={handleSave}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.saveBtn}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Measurements</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Child Switcher Modal */}
      <Modal visible={showChildModal} transparent animationType="fade" onRequestClose={() => setShowChildModal(false)}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setShowChildModal(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalCardBottom, { maxHeight: '55%' }]}> 
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Switch Child</Text>
              <TouchableOpacity onPress={() => setShowChildModal(false)}>
                <Ionicons name="close" size={22} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {children.map((c, idx) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.childRow}
                  onPress={async () => {
                    await selectChild(c.id);
                    setShowChildModal(false);
                  }}
                >
                  {c.avatar ? (
                    <Image source={{ uri: c.avatar }} style={styles.childRowAvatar} />
                  ) : (
                    <View style={[styles.childRowAvatar, { backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }]}> 
                      <Ionicons name="person" size={16} color="#667eea" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childRowName}>{c.name}</Text>
                    <Text style={styles.childRowAge}>{getAgeTextForChild(c)}</Text>
                  </View>
                  {idx === currentChildIndex && (
                    <Ionicons name="checkmark-circle" size={22} color="#667eea" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  banner: { borderRadius: 16, padding: 14 },
  bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 6 },
  bannerHint: { color: '#eef2ff', fontSize: 12 },
  childSelector: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childAvatarImg: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  childInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  childAge: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  dateText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  multilineInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  modalOverlay: { flex: 1 },
  modalCardBottom: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  childRowAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  childRowName: { fontSize: 14, color: '#1f2937', fontWeight: '600' },
  childRowAge: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#eef2ff' },
  saveBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveBtnText: { color: '#fff', fontWeight: '800', marginLeft: 8 },
});

export default AddMeasurementScreen;
