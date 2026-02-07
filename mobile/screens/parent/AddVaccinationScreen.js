import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vaccinesService } from '../../services/vaccinesService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const AddVaccinationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    childName: '',
    vaccineName: '',
    vaccineType: '',
    dateGiven: new Date().toISOString().split('T')[0],
    doseNumber: '',
    totalDoses: '',
    nextDueDate: '',
    doctorName: '',
    clinic: '',
    batchNumber: '',
    manufacturer: '',
    sideEffects: ['No side effects'],
    notes: '',
    reminderSet: true,
    completed: true,
  });

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

  // Vaccine statuses and categories
  const [statuses, setStatuses] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [modalVaccine, setModalVaccine] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selYear, setSelYear] = useState(null);
  const [selMonth, setSelMonth] = useState(null); // 1-12
  const [selDay, setSelDay] = useState(null);
  const today = new Date();
  const tenYearsAgo = new Date(new Date().setFullYear(today.getFullYear() - 10));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Predefined vaccination types (categories) with descriptions and icons
  const vaccineTypes = [
    { id: 'Core', icon: 'shield-check-outline', description: 'Essential' },
    { id: 'Regional', icon: 'earth', description: 'Regional' },
    { id: 'Optional', icon: 'filter-variant', description: 'Optional' },
    { id: 'Supplemental', icon: 'plus-circle-outline', description: 'Extra' },
  ];

  const vaccineGradients = [
    ['#e0e7ff', '#c7d2fe'], // Indigo soft
    ['#ffe4e6', '#fecdd3'], // Rose soft
    ['#dcfce7', '#bbf7d0'], // Green soft
  ];

  // Map vaccines per category with completion status
  const vaccinesByCategory = useMemo(() => {
    const map = {};
    statuses.forEach(s => {
      const cat = s?.schedule?.category || 'Other';
      const name = s?.schedule?.vaccine_name || 'Vaccine';
      const dosesReq = s?.schedule?.doses_required || 1;
      map[cat] = map[cat] || {};
      if (!map[cat][name]) map[cat][name] = { name, doses_required: dosesReq, entries: [] };
      map[cat][name].entries.push(s);
    });
    return map; // {cat: {name: {entries: [...]}}}
  }, [statuses]);

  const listForSelectedCategory = useMemo(() => {
    const obj = vaccinesByCategory[selectedCategory] || {};
    return Object.values(obj).map(v => {
      const completed = v.entries.every(e => String(e.status).toLowerCase() === 'completed');
      return { ...v, completed };
    });
  }, [vaccinesByCategory, selectedCategory]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadStatuses = useCallback(async (childId) => {
    if (!childId) return;
    setStatusLoading(true);
    setError('');
    try {
      const data = await vaccinesService.getStatuses(childId);
      setStatuses(Array.isArray(data) ? data : []);
      setSelectedCategory(prev => prev || vaccineTypes[0].id);
    } catch (err) {
      setError(err?.message || 'Failed to load vaccine statuses');
      Alert.alert('Something went wrong', err?.message || 'Failed to load vaccine statuses');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChild?.name) {
      setFormData(prev => ({ ...prev, childName: selectedChild.name }));
    }
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedChildId) {
      setStatuses([]);
      return;
    }
    loadStatuses(selectedChildId);
  }, [selectedChildId, loadStatuses]);

  const sideEffectOptions = [
    'No side effects', 'Mild fever', 'Soreness', 'Fussiness',
    'Loss of appetite', 'Mild rash', 'Drowsiness', 'Other',
  ];

  const parseISO = (s) => {
    const [y, m, d] = (s || '').split('-').map(n => parseInt(n, 10));
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const fmt = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const fmtDisplay = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mon = monthNames[dt.getMonth()];
    const yyyy = dt.getFullYear();
    return `${dd} ${mon} ${yyyy}`;
  };

  const getAgeTextForChild = (child) => {
    if (!child) return '';
    const yearsFromApi = typeof child.ageYears === 'number' ? child.ageYears : null;
    const monthsFromApi = typeof child.ageMonths === 'number' ? child.ageMonths : null;
    if (yearsFromApi != null || monthsFromApi != null) {
      const years = yearsFromApi != null ? yearsFromApi : 0;
      const months = monthsFromApi != null ? monthsFromApi : 0;
      return `${years}y ${months}m`;
    }
    return '';
  };

  const setSelectionsFromISO = (iso) => {
    const base = iso ? new Date(iso) : today;
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
    for (let d = minDay; d <= maxDay; d++) arr.push(d);
    return arr;
  };

  const findScheduleIdForSelection = (v) => {
    if (!v) return undefined;
    const pending = (v.entries || []).find(e => String(e.status).toLowerCase() === 'pending');
    const any = (v.entries || [])[0];
    return pending?.schedule?.id ?? pending?.schedule_id ?? any?.schedule?.id ?? any?.schedule_id;
  };

  const computeDoseInfo = (v) => {
    if (!v) return { required: 0, taken: 0 };
    // API returns ONE entry per vaccine with 'remaining_doses' field
    const entry = v.entries?.[0];
    const schedule = entry?.schedule || {};
    const required = schedule.doses_required || v.doses_required || 1;
    const remaining = entry?.remaining_doses ?? required; // Use API's remaining_doses
    const taken = Math.max(0, required - remaining);
    return { required, taken };
  };

  const handleSave = async () => {
    try {
      if (!currentChild) { Alert.alert('Missing Child', 'Please select a child first.'); return; }
      if (!formData.vaccineName) { Alert.alert('Select Vaccine', 'Please select a vaccine to continue.'); return; }
      if (!formData.dateGiven || !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateGiven)) { Alert.alert('Invalid Date', 'Please choose a valid vaccination date.'); return; }

      const selected = listForSelectedCategory.find(v => v.name === formData.vaccineName);
      const schedule_id = findScheduleIdForSelection(selected);
      if (!schedule_id) { Alert.alert('Schedule Not Found', 'Could not determine the schedule for this vaccine.'); return; }

      const sideEffectsStr = Array.isArray(formData.sideEffects) ? formData.sideEffects.join(', ').trim() : String(formData.sideEffects || '').trim();
      const normalizedSideEffects = (!sideEffectsStr || sideEffectsStr.toLowerCase() === 'no side effects') ? null : sideEffectsStr;
      const notesVal = (formData.notes && formData.notes.trim().length) ? formData.notes.trim() : null;

      const payload = {
        schedule_id,
        given_date: formData.dateGiven,
        side_effects: normalizedSideEffects,
        notes: notesVal,
      };

      setSubmitting(true);
      await vaccinesService.give(currentChild.id, payload);
      await loadStatuses(currentChild.id);
      const savedVaccineName = formData.vaccineName;
      updateFormData('vaccineName', '');
      Alert.alert('Recorded', `${savedVaccineName} recorded successfully.`, [{ text: 'OK' }]);
    } catch (err) {
      Alert.alert('Submission failed', err?.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectVaccine = (v) => {
    if (!v) return;
    const { required, taken } = computeDoseInfo(v);
    if (taken >= required) return; // All doses completed
    updateFormData('vaccineName', v.name);
    updateFormData('vaccineType', selectedCategory || '');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Vaccination</Text>
            <View style={{ width: 40 }} />
          </View>

          {(loadingChildren && !children.length) ? (
            <LoadingState fullScreen />
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {(childrenError || error) ? <ErrorState message={childrenError || error} fullWidth /> : null}

              {/* Child Selector */}
              <TouchableOpacity
                style={styles.childCard}
                onPress={() => setShowChildModal(true)}
                activeOpacity={0.9}
              >
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

              {/* Category Tabs */}
              <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                  {vaccineTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.tab, selectedCategory === type.id && styles.activeTab]}
                      onPress={() => { setSelectedCategory(type.id); updateFormData('vaccineType', type.id); }}
                    >
                      <MaterialCommunityIcons
                        name={type.icon}
                        size={18}
                        color={selectedCategory === type.id ? '#FFF' : '#64748B'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.tabText, selectedCategory === type.id && styles.activeTabText]}>{type.id}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Vaccine List */}
              <View style={styles.vaccineListContainer}>
                {statusLoading ? (
                  <ActivityIndicator style={{ marginTop: 20 }} color="#6366F1" />
                ) : listForSelectedCategory.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No vaccines found for this category</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}>
                    {([...listForSelectedCategory].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))).map((v, idx) => {
                      const isCompleted = v.completed;
                      const isSelected = formData.vaccineName === v.name;
                      const { required, taken } = computeDoseInfo(v);
                      const hasPendingDoses = taken < required;
                      const isDisabled = isCompleted || !hasPendingDoses; // Disable only if fully completed

                      return (
                        <TouchableOpacity
                          key={v.name}
                          style={[
                            styles.vaccineCard,
                            isSelected && styles.selectedVaccineCard,
                            isDisabled && { opacity: 0.6 }
                          ]}
                          onPress={() => selectVaccine(v)}
                          disabled={isDisabled}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={isSelected ? ['#6366F1', '#4F46E5'] : ['#FFF', '#FFF']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          />
                          <View style={styles.vCardHeader}>
                            <View style={[styles.statusDot, isCompleted ? { backgroundColor: '#10B981' } : { backgroundColor: '#F59E0B' }]} />
                            {isCompleted && <Ionicons name="checkmark" size={16} color="#10B981" />}
                          </View>

                          <View>
                            <Text style={[styles.vCardName, isSelected && { color: '#FFF' }]} numberOfLines={1}>{v.name}</Text>
                            <Text style={[styles.vCardDisease, isSelected && { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={1}>
                              {v.entries?.[0]?.schedule?.disease_prevented || 'General'}
                            </Text>
                          </View>

                          <View style={styles.vCardFooter}>
                            <Text style={[styles.vCardDose, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>{taken}/{required} Doses</Text>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); setModalVaccine(v); setShowVaccineModal(true); }}>
                              <Ionicons name="information-circle-outline" size={20} color={isSelected ? '#FFF' : '#64748B'} />
                            </TouchableOpacity>
                          </View>

                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Form Section */}
              {formData.vaccineName ? (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>Vaccination Details</Text>

                  {/* Selected Item Banner */}
                  <View style={styles.selectedItemBanner}>
                    <MaterialCommunityIcons name="needle" size={20} color="#6366F1" />
                    <Text style={styles.selectedName}>{formData.vaccineName}</Text>
                  </View>

                  {/* Date Picker */}
                  <Text style={styles.label}>Date Given</Text>
                  <TouchableOpacity style={styles.inputField} onPress={() => { setSelectionsFromISO(formData.dateGiven); setShowDateModal(true); }}>
                    <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    <Text style={styles.inputText}>{fmtDisplay(formData.dateGiven)}</Text>
                  </TouchableOpacity>

                  {/* Side Effects */}
                  <Text style={styles.label}>Side Effects</Text>
                  <View style={styles.chipContainer}>
                    {sideEffectOptions.map(option => {
                      const active = (formData.sideEffects || []).includes(option);
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.chip, active && styles.activeChip]}
                          onPress={() => {
                            setFormData(prev => {
                              const current = Array.isArray(prev.sideEffects) ? prev.sideEffects : [];
                              if (option === 'No side effects') return { ...prev, sideEffects: ['No side effects'] };
                              const base = current.filter(e => e !== 'No side effects');
                              const next = base.includes(option) ? base.filter(e => e !== option) : [...base, option];
                              return { ...prev, sideEffects: next };
                            });
                          }}
                        >
                          <Text style={[styles.chipText, active && styles.activeChipText]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Notes */}
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.inputField, { height: 100, alignItems: 'flex-start' }]}
                    multiline
                    placeholder="Add notes..."
                    placeholderTextColor="#94A3B8"
                    value={formData.notes}
                    onChangeText={t => updateFormData('notes', t)}
                  />

                  {/* Submit Button */}
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
                    <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Record</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.selectPrompt}>
                  <Ionicons name="arrow-up" size={24} color="#94A3B8" />
                  <Text style={styles.promptText}>Select a vaccine from above to verify details</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Date Modal */}
          {showDateModal && (
            <Modal transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => setShowDateModal(false)}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
                <View style={styles.datePickerCard}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => {
                      if (selYear && selMonth && selDay) {
                        const dateObj = new Date(selYear, selMonth - 1, selDay);
                        updateFormData('dateGiven', fmt(dateObj));
                      }
                      setShowDateModal(false);
                    }}>
                      <Text style={styles.doneBtn}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pickerColumns}>
                    {[
                      { label: 'Day', options: getDayOptions(), val: selDay, set: setSelDay },
                      { label: 'Month', options: getMonthOptions(), val: selMonth, set: setSelMonth, format: m => monthNames[m - 1] },
                      { label: 'Year', options: getYearOptions(), val: selYear, set: setSelYear }
                    ].map((col, idx) => (
                      <View key={idx} style={styles.pickerCol}>
                        <Text style={styles.colLabel}>{col.label}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {col.options.map(opt => (
                            <TouchableOpacity
                              key={opt}
                              style={[styles.pickerCell, col.val === opt && styles.activePickerCell]}
                              onPress={() => col.set(opt)}
                            >
                              <Text style={[styles.pickerText, col.val === opt && styles.activePickerText]}>
                                {col.format ? col.format(opt) : opt}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Child Switcher Modal */}
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

          {/* Vaccine Info Modal */}
          <Modal visible={showVaccineModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowVaccineModal(false)} />
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>{modalVaccine?.name}</Text>
                <Text style={styles.infoLabel}>Prevents: <Text style={styles.infoVal}>{modalVaccine?.entries?.[0]?.schedule?.disease_prevented || '-'}</Text></Text>
                <Text style={styles.infoLabel}>Rec. Age: <Text style={styles.infoVal}>{modalVaccine?.entries?.[0]?.schedule?.recommended_age || '-'}</Text></Text>
                <TouchableOpacity style={styles.closeInfoBtn} onPress={() => setShowVaccineModal(false)}>
                  <Text style={styles.closeInfoText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
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

  scrollView: { flex: 1, paddingTop: 10 },

  childCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
  },
  childRow: { flexDirection: 'row', alignItems: 'center' },
  childAvatar: { width: 48, height: 48, borderRadius: 24 },
  childName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  childDetail: { fontSize: 13, color: '#64748B', marginTop: 2 },

  tabsContainer: { marginTop: 24, marginBottom: 16 },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: '#FFF', marginRight: 12,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  activeTab: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#FFF' },

  vaccineListContainer: { height: 160 },
  vaccineCard: {
    width: 140, height: 140,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginRight: 12,
    padding: 12, justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9'
  },
  selectedVaccineCard: { borderColor: '#6366F1', borderWidth: 0 },
  vCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  vCardName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  vCardDisease: { fontSize: 11, color: '#6366F1', fontWeight: '500', marginBottom: 8 },
  vCardDose: { fontSize: 11, color: '#64748B' },
  vCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedBadge: { position: 'absolute', top: 8, right: 8 },

  selectPrompt: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  promptText: { marginTop: 10, color: '#64748B', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 40, width: width - 40 },
  emptyText: { color: '#94A3B8' },

  formContainer: { marginHorizontal: 20, marginTop: 20, backgroundColor: '#FFF', borderRadius: 24, padding: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  selectedItemBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF',
    padding: 12, borderRadius: 12, marginBottom: 20
  },
  selectedName: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#4338CA' },

  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  inputField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0'
  },
  inputText: { marginLeft: 10, fontSize: 15, color: '#1E293B' },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9',
    marginRight: 8, marginBottom: 8
  },
  activeChip: { backgroundColor: '#6366F1' },
  chipText: { fontSize: 13, color: '#64748B' },
  activeChipText: { color: '#FFF' },

  submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  datePickerCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, maxHeight: 400 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  doneBtn: { fontSize: 16, fontWeight: '600', color: '#6366F1' },
  pickerColumns: { flexDirection: 'row', height: 200 },
  pickerCol: { flex: 1, marginHorizontal: 4 },
  colLabel: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8 },
  pickerCell: { paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activePickerCell: { backgroundColor: '#EEF2FF' },
  pickerText: { fontSize: 15, color: '#1E293B' },
  activePickerText: { color: '#6366F1', fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1E293B' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  sheetAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  sheetName: { flex: 1, fontSize: 16, color: '#1E293B' },

  infoCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  infoTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  infoVal: { color: '#1E293B', fontWeight: '500' },
  closeInfoBtn: { marginTop: 20, alignItems: 'center', padding: 12, backgroundColor: '#F1F5F9', borderRadius: 12 },
  closeInfoText: { color: '#64748B', fontWeight: '600' },
});

export default AddVaccinationScreen;
