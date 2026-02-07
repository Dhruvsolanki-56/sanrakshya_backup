import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LoadingState from '../../components/LoadingState';
import { measurementsService } from '../../services/measurementsService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 60; // Taller items for premium feel

const AddMeasurementScreen = ({ navigation }) => {
  const {
    children,
    selectedChild,
    selectedChildId,
    loadingChildren,
    selectChild,
  } = useSelectedChild();

  const currentChild = selectedChild;
  const currentChildIndex = useMemo(
    () => children.findIndex(c => String(c.id) === String(selectedChildId)),
    [children, selectedChildId]
  );
  const [showChildModal, setShowChildModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [muacCm, setMuacCm] = useState('');
  const [sleepHours, setSleepHours] = useState('');

  // Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [activePicker, setActivePicker] = useState(null); // 'height', 'weight', etc.

  // Refs for tracking scroll index for haptics
  const intScrollRef = useRef(null);
  const decScrollRef = useRef(null);
  const lastIntIndex = useRef(-1);
  const lastDecIndex = useRef(-1);

  // Temporary selection state for picker
  const [pickerInt, setPickerInt] = useState(0);
  const [pickerDec, setPickerDec] = useState(0);

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

  const getAgeTextForChild = (child) => {
    if (!child) return '';
    const yearsFromApi = typeof child.ageYears === 'number' ? child.ageYears : null;
    const monthsFromApi = typeof child.ageMonths === 'number' ? child.ageMonths : null;
    if (yearsFromApi != null || monthsFromApi != null) {
      const years = yearsFromApi ?? 0;
      const months = monthsFromApi ?? 0;
      return `${years}y ${months}m`;
    }
    return '';
  };

  useEffect(() => {
    if (loadingChildren && !children.length) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [loadingChildren, children.length]);

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
    if (!hStr) errs.push('Height is required.');
    if (!wStr) errs.push('Weight is required.');
    if (showMuac && !mStr) errs.push('MUAC is required for children older than 6 months.');
    if (!sStr) errs.push('Average sleep hours is required.');
    if (hStr && (!Number.isFinite(h) || h < 30 || h > 200)) errs.push('Height must be between 30 and 200 cm.');
    if (wStr && (!Number.isFinite(w) || w < 1 || w > 80)) errs.push('Weight must be between 1 and 80 kg.');
    if (showMuac && mStr && (!Number.isFinite(m) || m < 8 || m > 30)) errs.push('MUAC must be between 8 and 30 cm.');
    if (sStr && (!Number.isFinite(s) || s <= 0 || s > 24)) errs.push('Average sleep hours must be between 0 and 24.');
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
      Alert.alert('Success', 'Measurements saved successfully.');
      setHeightCm(''); setWeightKg(''); setMuacCm(''); setSleepHours('');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Submission failed', e?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Picker config per field
  const pickerConfigs = {
    height: { min: 30, max: 200, decimals: 1, unit: 'cm', label: 'Height' },
    weight: { min: 1, max: 80, decimals: 1, unit: 'kg', label: 'Weight' },
    muac: { min: 8, max: 30, decimals: 1, unit: 'cm', label: 'MUAC' },
    sleep: { min: 0, max: 24, decimals: 1, unit: 'hrs', label: 'Sleep Hours' },
  };

  const getIntOptions = (config) => {
    const arr = [];
    for (let i = config.min; i <= config.max; i++) arr.push(i);
    return arr;
  };

  const getDecOptions = () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const openPicker = (fieldKey, currentValue) => {
    const config = pickerConfigs[fieldKey];
    const val = parseFloat(currentValue) || config.min;
    const intPart = Math.floor(val);
    const decPart = Math.round((val - intPart) * 10);

    setPickerInt(Math.max(config.min, Math.min(config.max, intPart)));
    setPickerDec(decPart);

    // Reset refs logic
    lastIntIndex.current = -1;
    lastDecIndex.current = -1;

    setActivePicker(fieldKey);
    setShowPicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Initial Scroll
    setTimeout(() => {
      if (intScrollRef.current) {
        const intIndex = Math.max(config.min, Math.min(config.max, intPart)) - config.min;
        intScrollRef.current.scrollTo({ y: intIndex * ITEM_HEIGHT, animated: false });
      }
      if (decScrollRef.current) {
        decScrollRef.current.scrollTo({ y: decPart * ITEM_HEIGHT, animated: false });
      }
    }, 50);
  };

  const confirmPicker = () => {
    if (!activePicker) return;
    const value = pickerInt + pickerDec / 10;
    const valueStr = value.toFixed(1);

    switch (activePicker) {
      case 'height': setHeightCm(valueStr); break;
      case 'weight': setWeightKg(valueStr); break;
      case 'muac': setMuacCm(valueStr); break;
      case 'sleep': setSleepHours(valueStr); break;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPicker(false);
    setActivePicker(null);
  };

  // Scroll Handler with Haptics and State Update
  const handleScroll = (event, type) => {
    if (!activePicker) return;

    const y = event.nativeEvent.contentOffset.y;
    // Calculate index based on scroll position - center aligned
    // Since we snap to item height, simple division works
    const index = Math.round(y / ITEM_HEIGHT);
    const config = pickerConfigs[activePicker];

    if (type === 'int') {
      if (index !== lastIntIndex.current) {
        const options = getIntOptions(config);
        if (options[index] !== undefined) {
          setPickerInt(options[index]);
          Haptics.selectionAsync();
        }
        lastIntIndex.current = index;
      }
    } else {
      if (index !== lastDecIndex.current) {
        const options = getDecOptions();
        if (options[index] !== undefined) {
          setPickerDec(options[index]);
          Haptics.selectionAsync();
        }
        lastDecIndex.current = index;
      }
    }
  };

  const measurementFields = [
    { key: 'height', label: 'Height', value: heightCm, setValue: setHeightCm, unit: 'cm', icon: 'human-male-height', color: ['#6366F1', '#4F46E5'] },
    { key: 'weight', label: 'Weight', value: weightKg, setValue: setWeightKg, unit: 'kg', icon: 'weight', color: ['#10B981', '#059669'] },
    ...(showMuac ? [{ key: 'muac', label: 'MUAC', value: muacCm, setValue: setMuacCm, unit: 'cm', label: 'MUAC', icon: 'tape-measure', color: ['#F59E0B', '#D97706'] }] : []),
    { key: 'sleep', label: 'Sleep', value: sleepHours, setValue: setSleepHours, unit: 'hrs', icon: 'moon-waning-crescent', color: ['#8B5CF6', '#7C3AED'] },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={StyleSheet.absoluteFill} />

        {/* Background Artifacts */}
        <View style={styles.bgArtifactTop}>
          <MaterialCommunityIcons name="tape-measure" size={200} color="#6366F1" style={{ opacity: 0.03, transform: [{ rotate: '-15deg' }] }} />
        </View>
        <View style={styles.bgArtifactBottom}>
          <MaterialCommunityIcons name="scale" size={240} color="#10B981" style={{ opacity: 0.03, transform: [{ rotate: '15deg' }] }} />
        </View>

        <SafeAreaView style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Measurement</Text>
            <View style={{ width: 40 }} />
          </View>

          {loading ? (
            <LoadingState fullScreen />
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>

              {/* Child Card - Glassmorphism */}
              <TouchableOpacity style={styles.childCard} onPress={() => setShowChildModal(true)} activeOpacity={0.9}>
                <View style={styles.childRow}>
                  {currentChild?.avatar ? (
                    <Image source={{ uri: currentChild.avatar }} style={styles.childAvatar} />
                  ) : (
                    <View style={[styles.childAvatar, { backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6' }}>{(currentChild?.name || '?').charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.childName}>{currentChild?.name || 'Select Child'}</Text>
                    <Text style={styles.childDetail}>{getAgeTextForChild(currentChild) || 'Profile'}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-down-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>

              {/* Measurement Cards */}
              <View style={styles.cardsContainer}>
                {measurementFields.map((field) => (
                  <TouchableOpacity
                    key={field.key}
                    style={styles.measureCard}
                    onPress={() => openPicker(field.key, field.value)}
                    activeOpacity={0.95}
                  >
                    <MaterialCommunityIcons
                      name={field.icon}
                      size={120}
                      color={field.color[0]}
                      style={styles.cardArtifact}
                    />

                    <LinearGradient colors={field.color} style={styles.cardIconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <MaterialCommunityIcons name={field.icon} size={28} color="#FFF" />
                    </LinearGradient>

                    <View style={styles.cardContent}>
                      <Text style={styles.cardLabel}>{field.label}</Text>
                      <View style={styles.valueRow}>
                        {field.value ? (
                          <Text style={styles.valueText}>{field.value}</Text>
                        ) : (
                          <Text style={styles.placeholderText}>Set {field.label}</Text>
                        )}
                        <Text style={styles.unitText}>{field.unit}</Text>
                      </View>
                    </View>
                    <View style={styles.pickerIcon}>
                      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tips Section */}
              <View style={styles.tipsCard}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#D97706" style={{ marginBottom: 8 }} />
                <Text style={styles.tipItem}>• Weigh at the same time daily for accuracy</Text>
                <Text style={styles.tipItem}>• Measure height first thing in the morning</Text>
                <Text style={styles.tipItem}>• Track sleep patterns for better insights</Text>
              </View>

            </ScrollView>
          )}

          {/* Save Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting} activeOpacity={0.9}>
              <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFF" />
                    <Text style={styles.saveText}>Save Measurements</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Premium Scroll Picker Modal - Apple Style */}
          <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
            <View style={styles.pickerOverlay}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowPicker(false)} />
              <View style={styles.pickerCard}>

                {/* Header */}
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>{activePicker ? pickerConfigs[activePicker].label : ''}</Text>
                  <TouchableOpacity onPress={confirmPicker}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Main Picker Body */}
                <View style={styles.pickerBody}>
                  <View style={styles.selectionHighlight} pointerEvents="none" />

                  {/* Gradient Masks */}
                  <LinearGradient colors={['#FFF', 'rgba(255,255,255,0)']} style={styles.pickerGradientTop} pointerEvents="none" />
                  <LinearGradient colors={['rgba(255,255,255,0)', '#FFF']} style={styles.pickerGradientBottom} pointerEvents="none" />

                  {/* Integer Column */}
                  <ScrollView
                    ref={intScrollRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={(e) => handleScroll(e, 'int')}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                    style={styles.pickerColumn}
                  >
                    {activePicker && getIntOptions(pickerConfigs[activePicker]).map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={styles.pickerItem}
                        onPress={() => {
                          // Tap to snap
                          const idx = num - pickerConfigs[activePicker].min;
                          intScrollRef.current.scrollTo({ y: idx * ITEM_HEIGHT });
                        }}
                      >
                        <Text style={[styles.pickerItemText, pickerInt === num && styles.pickerItemTextActive]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.decimalPoint}>.</Text>

                  {/* Decimal Column */}
                  <ScrollView
                    ref={decScrollRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={(e) => handleScroll(e, 'dec')}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                    style={styles.pickerColumn}
                  >
                    {getDecOptions().map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={styles.pickerItem}
                        onPress={() => {
                          // Tap to snap
                          decScrollRef.current.scrollTo({ y: num * ITEM_HEIGHT });
                        }}
                      >
                        <Text style={[styles.pickerItemText, pickerDec === num && styles.pickerItemTextActive]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.pickerUnit}>{activePicker ? pickerConfigs[activePicker].unit : ''}</Text>
                </View>
              </View>
            </View>
          </Modal>

          {/* Child Modal */}
          <Modal visible={showChildModal} transparent animationType="fade" onRequestClose={() => setShowChildModal(false)}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowChildModal(false)}>
              <View style={styles.bottomSheet}>
                <Text style={styles.sheetTitle}>Switch Child</Text>
                {children.map((c, idx) => (
                  <TouchableOpacity key={c.id} style={styles.sheetRow} onPress={async () => { await selectChild(c.id); setShowChildModal(false); }}>
                    {c.avatar ? <Image source={{ uri: c.avatar }} style={styles.sheetAvatar} /> : <View style={[styles.sheetAvatar, { backgroundColor: '#E0E7FF' }]} />}
                    <Text style={styles.sheetName}>{c.name}</Text>
                    {idx === currentChildIndex && <Ionicons name="checkmark" size={20} color="#6366F1" />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: '#FFF' },

  bgArtifactTop: { position: 'absolute', top: -40, right: -40, zIndex: 0 },
  bgArtifactBottom: { position: 'absolute', bottom: -60, left: -60, zIndex: 0 },

  scrollView: { flex: 1, paddingTop: 10 },

  childCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4,
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)'
  },
  childRow: { flexDirection: 'row', alignItems: 'center' },
  childAvatar: { width: 48, height: 48, borderRadius: 24 },
  childName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  childDetail: { fontSize: 13, color: '#64748B', marginTop: 2 },

  cardsContainer: { paddingHorizontal: 20 },
  measureCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 16,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    overflow: 'hidden', height: 90
  },
  cardArtifact: { position: 'absolute', right: -20, bottom: -30, opacity: 0.08, transform: [{ rotate: '-15deg' }] },

  cardIconCircle: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 16 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  valueText: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#CBD5E1' },
  unitText: { fontSize: 15, fontWeight: '600', color: '#94A3B8', marginLeft: 6 },
  pickerIcon: { padding: 8 },

  tipsCard: {
    marginHorizontal: 20, marginTop: 10,
    backgroundColor: 'rgba(255, 251, 235, 0.8)',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#FEF3C7',
  },
  tipItem: { fontSize: 13, color: '#B45309', marginBottom: 6, fontWeight: '500' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(248,250,252,0.95)' },
  saveBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginLeft: 8 },

  // Picker Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerCard: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, height: 400 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderColor: '#E2E8F0' },
  pickerCancel: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  pickerDone: { fontSize: 16, color: '#4F46E5', fontWeight: '700' },

  pickerBody: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 300, position: 'relative' },
  pickerColumn: { width: 80, flexGrow: 0 },
  pickerItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  pickerItemText: { fontSize: 24, color: '#94A3B8', fontWeight: '400' }, // Unselected lighter/thinner
  pickerItemTextActive: { color: '#1E293B', fontWeight: '700', fontSize: 30, transform: [{ scale: 1.05 }] }, // Selected darker/bolder
  decimalPoint: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  pickerUnit: { fontSize: 18, fontWeight: '600', color: '#94A3B8', marginLeft: 12, position: 'absolute', right: 40 },

  selectionHighlight: {
    position: 'absolute',
    top: 150 - (ITEM_HEIGHT / 2),
    left: 20, right: 20,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)', // Subtle highlight
    zIndex: -1,
  },
  pickerGradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, zIndex: 1 },
  pickerGradientBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, zIndex: 1 },

  // Child Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1E293B' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  sheetAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  sheetName: { flex: 1, fontSize: 16, color: '#1E293B' },
});

export default AddMeasurementScreen;
