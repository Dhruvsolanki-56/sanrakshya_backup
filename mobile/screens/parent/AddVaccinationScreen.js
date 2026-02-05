import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	TouchableWithoutFeedback,
	ScrollView,
	Switch,
	Dimensions,
	Image,
	Modal,
	Platform,
	ActivityIndicator,
	KeyboardAvoidingView,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vaccinesService } from '../../services/vaccinesService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

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
  const [disabledNames, setDisabledNames] = useState([]); // locally disable after submit
  const today = new Date();
  const tenYearsAgo = new Date(new Date().setFullYear(today.getFullYear() - 10));
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Predefined vaccination types (categories) with descriptions and icons
  const vaccineTypes = [
    { id: 'Core', icon: 'shield-checkmark-outline', description: 'Essential vaccines recommended for all children' },
    { id: 'Regional', icon: 'earth-outline', description: 'Region-specific vaccines as per local guidelines' },
    { id: 'Optional', icon: 'options-outline', description: 'Optional vaccines based on need and preference' },
    { id: 'Supplemental', icon: 'add-circle-outline', description: 'Additional doses or supplemental campaigns' },
  ];
  const typeGradients = [
    ['#667eea', '#764ba2'],
    ['#ff6b6b', '#ee609c'],
    ['#10ac84', '#06d6a0'],
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
      // Ensure we have a default category once statuses are loaded, without
      // causing the effect that calls loadStatuses to re-run.
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
    'No side effects',
    'Mild fever',
    'Soreness at injection site',
    'Fussiness/irritability',
    'Loss of appetite',
    'Mild rash',
    'Drowsiness',
    'Other (specify in notes)',
  ];

  const parseISO = (s) => {
    const [y,m,d] = (s||'').split('-').map(n=>parseInt(n,10));
    if (!y||!m||!d) return new Date();
    return new Date(y, m-1, d);
  };

  const fmt = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  };

  const fmtDisplay = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    const dd = String(dt.getDate()).padStart(2,'0');
    const mon = monthNames[dt.getMonth()];
    const yyyy = dt.getFullYear();
    return `${dd}- ${mon}-${yyyy}`;
  };

  const formatAgeText = (dobRaw) => {
    if (!dobRaw) return '';
    const dob = new Date(dobRaw);
    if (Number.isNaN(dob.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    const dayDiff = now.getDate() - dob.getDate();
    if (dayDiff < 0) months -= 1; // borrow a month if current day is before birth day
    if (months < 0) { years -= 1; months += 12; }
    // Normalize negative values
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

  // single date picker only; no next due date UI per requirement

  const findScheduleIdForSelection = (v) => {
    if (!v) return undefined;
    const pending = (v.entries || []).find(e => String(e.status).toLowerCase() === 'pending');
    const any = (v.entries || [])[0];
    return pending?.schedule?.id ?? pending?.schedule_id ?? any?.schedule?.id ?? any?.schedule_id;
  };

  const computeDoseInfo = (v) => {
    if (!v) return { required: 0, taken: 0 };
    const toNum = (val) => {
      const n = parseInt(val, 10);
      return Number.isFinite(n) ? n : NaN;
    };
    const schedule0 = v.entries?.[0]?.schedule || {};
    const required = Number.isFinite(toNum(schedule0.doses_required))
      ? toNum(schedule0.doses_required)
      : (Number.isFinite(toNum(v.doses_required)) ? toNum(v.doses_required) : ((v.entries ? v.entries.length : 1) || 1));
    const completedCount = (v.entries || []).filter(e => String(e.status).toLowerCase() === 'completed').length;
    const entryWithRemaining = (v.entries || []).find(e => Number.isFinite(toNum(e?.remaining_doses)));
    const apiRemaining = Number.isFinite(toNum(entryWithRemaining?.remaining_doses))
      ? toNum(entryWithRemaining.remaining_doses)
      : (Number.isFinite(toNum(v.remaining_doses)) ? toNum(v.remaining_doses)
        : (Number.isFinite(toNum(schedule0.remaining_doses)) ? toNum(schedule0.remaining_doses) : NaN));
    const remaining = Number.isFinite(apiRemaining) ? apiRemaining : Math.max(required - completedCount, 0);
    const taken = Math.max(0, Math.min(required - remaining, required));
    return { required, taken };
  };

  const friendlyApiError = (err) => {
    const status = err?.status;
    const data = err?.data;
    const detail = (data && (data.detail || data.message)) || '';
    if (!status) {
      // Likely network error or thrown without status
      const msg = err?.message || 'Network error. Please check your connection and try again.';
      return msg;
    }
    if (status === 400) return detail || 'Invalid request. Please review your input and try again.';
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'Endpoint not found. Please try again later.';
    if (status === 409) return detail || 'This vaccination record already exists.';
    if (status === 422) {
      // Validation details
      if (Array.isArray(data?.errors)) {
        return data.errors.map(e => `${e.field || 'field'}: ${e.message}`).join('\n');
      }
      return detail || 'Validation failed. Please correct the highlighted fields.';
    }
    if (status >= 500) return 'Server error. Please try again later.';
    return detail || err?.message || 'Request failed. Please try again.';
  };

  const handleSave = async () => {
    try {
      if (!currentChild) {
        Alert.alert('Missing Child', 'Please select a child first.');
        return;
      }
      if (!formData.vaccineName) {
        Alert.alert('Select Vaccine', 'Please select a vaccine to continue.');
        return;
      }
      if (!formData.dateGiven || !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateGiven)) {
        Alert.alert('Invalid Date', 'Please choose a valid vaccination date.');
        return;
      }

      const selected = listForSelectedCategory.find(v => v.name === formData.vaccineName);
      const schedule_id = findScheduleIdForSelection(selected);
      if (!schedule_id) {
        Alert.alert('Schedule Not Found', 'Could not determine the schedule for this vaccine.');
        return;
      }
      const takenCount = (selected?.entries || []).filter(e => String(e.status).toLowerCase() === 'completed').length;
      const computedDose = takenCount + 1;

      const sideEffectsStr = Array.isArray(formData.sideEffects)
        ? formData.sideEffects.join(', ').trim()
        : String(formData.sideEffects || '').trim();
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
      // Immediately refresh data and reflect in UI
      await loadStatuses(currentChild.id);
      setDisabledNames(prev => (formData.vaccineName && !prev.includes(formData.vaccineName) ? [...prev, formData.vaccineName] : prev));
      updateFormData('vaccineName', '');
      Alert.alert(
        'Vaccination Recorded',
        `${formData.vaccineName} recorded for ${currentChild.name}.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Submit vaccination error', err);
      Alert.alert('Submission failed', friendlyApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectVaccine = (v) => {
    if (!v || v.completed) return;
    updateFormData('vaccineName', v.name);
    // set vaccination type by category
    updateFormData('vaccineType', selectedCategory || '');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Add Vaccination"
          onBackPress={() => navigation.goBack()}
        />
      
        {(loadingChildren && !children.length) ? (
          <LoadingState fullScreen />
        ) : (
        <>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {(childrenError || error) ? (
            <ErrorState
              message={childrenError || error}
              fullWidth
            />
          ) : null}
          {/* Child Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Child</Text>
            <TouchableOpacity
              style={styles.childSelector}
              onPress={() => setShowChildModal(true)}
              disabled={loadingChildren || switchingChild}
            >
              <View style={styles.childInfo}>
                {currentChild?.avatar ? (
                  <Image source={{ uri: currentChild.avatar }} style={styles.childAvatarImg} />
                ) : (
                  <View style={styles.childAvatar}><Text style={styles.childInitial}>{(currentChild?.name || '?').charAt(0)}</Text></View>
                )}
                <View>
                  <Text style={styles.childName}>{currentChild?.name || formData.childName || 'Child'}</Text>
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

          {/* Vaccination Type (predefined 4 cards) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vaccination Type</Text>
            <View style={styles.typeGrid}>
              {vaccineTypes.map((type, idx) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeCard, selectedCategory === type.id && styles.activeTypeCard]}
                  onPress={() => { setSelectedCategory(type.id); updateFormData('vaccineType', type.id); }}
                >
                  <LinearGradient colors={typeGradients[idx % typeGradients.length]} style={styles.typeIcon}>
                    <Ionicons name={type.icon} size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.typeTitle, selectedCategory === type.id && styles.activeTypeTitle]}>{type.id}</Text>
                  <Text style={styles.typeDescription} numberOfLines={2} ellipsizeMode="tail">{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.infoHighlight}>Core vaccines are required to be completed on time as per your child's current age.</Text>
          </View>

          {/* Vaccines for selected category (from API) */}
          {selectedCategory ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vaccines ({selectedCategory})</Text>
              {statusLoading ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <ActivityIndicator color="#667eea" />
                  <Text style={{ marginTop: 6, color: '#7f8c8d' }}>Loading vaccine statuses...</Text>
                </View>
              ) : listForSelectedCategory.length === 0 ? (
                <View style={[styles.vaccineCard, { alignItems: 'center', justifyContent: 'center', width: '100%' }]}>
                  <Text style={{ color: '#7f8c8d' }}>No vaccines for this category.</Text>
                </View>
              ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vaccineScroll}>
                {([...listForSelectedCategory].sort((a, b) => {
                  if (a.completed === b.completed) return 0;
                  return a.completed ? 1 : -1; // push completed to the end
                })).map((v, idx) => {
                  const isCompleted = v.completed;
                  const isLocallyDisabled = disabledNames.includes(v.name);
                  const isDisabled = isCompleted || isLocallyDisabled;
                  const hasMissed = (v.entries || []).some(e => String(e.status).toLowerCase() === 'missed');
                  const hasPending = (v.entries || []).some(e => String(e.status).toLowerCase() === 'pending');
                  const schedule0 = v.entries?.[0]?.schedule || {};
                  const toNum = (val) => {
                    const n = parseInt(val, 10);
                    return Number.isFinite(n) ? n : NaN;
                  };
                  const dosesRequired = Number.isFinite(toNum(schedule0.doses_required))
                    ? toNum(schedule0.doses_required)
                    : (Number.isFinite(toNum(v.doses_required)) ? toNum(v.doses_required) : ((v.entries ? v.entries.length : 1) || 1));
                  const completedCount = (v.entries || []).filter(e => String(e.status).toLowerCase() === 'completed').length;
                  const entryWithRemaining = (v.entries || []).find(e => Number.isFinite(toNum(e?.remaining_doses)));
                  const apiRemaining = Number.isFinite(toNum(entryWithRemaining?.remaining_doses))
                    ? toNum(entryWithRemaining.remaining_doses)
                    : (Number.isFinite(toNum(v.remaining_doses)) ? toNum(v.remaining_doses)
                      : (Number.isFinite(toNum(schedule0.remaining_doses)) ? toNum(schedule0.remaining_doses) : NaN));
                  const remainingDoses = Number.isFinite(apiRemaining) ? apiRemaining : Math.max(dosesRequired - completedCount, 0);
                  const takenDisplayed = Math.max(0, Math.min(dosesRequired - remainingDoses, dosesRequired));
                  return (
                    <TouchableOpacity
                      key={v.name}
                      style={[styles.vaccineTouchable, (isDisabled) && { opacity: 0.6 }]}
                      onPress={() => selectVaccine(v)}
                      disabled={isDisabled}
                      activeOpacity={0.9}
                    >
                      <LinearGradient colors={vaccineGradients[idx % vaccineGradients.length]} style={[styles.vaccineCard, formData.vaccineName === v.name && styles.activeVaccineCard]}>
                        <View style={styles.vaccineHeader}>
                          <View style={styles.vaccineTitleWrap}>
                            <Text style={[styles.vaccineName, formData.vaccineName === v.name && styles.activeVaccineName]} numberOfLines={1} ellipsizeMode="tail">
                              {v.name}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity style={styles.infoTinyBtn} onPress={(e) => { e.stopPropagation?.(); setModalVaccine(v); setShowVaccineModal(true); }}>
                              <Ionicons name="information-circle-outline" size={16} color="#667eea" />
                            </TouchableOpacity>
                            <View style={[styles.doseBadge, isCompleted && { backgroundColor: '#e6f7f0' }]}>
                              <Text style={[styles.doseText, isCompleted && { color: '#10ac84' }]} numberOfLines={1}>
                                {`${takenDisplayed}/${dosesRequired} dose`}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={styles.vaccineFullName} numberOfLines={1} ellipsizeMode="tail">{v.entries?.[0]?.schedule?.disease_prevented || ''}</Text>
                        <Text style={styles.vaccineAge} numberOfLines={1} ellipsizeMode="tail">{v.entries?.[0]?.schedule?.recommended_age || ''}</Text>
                        <View style={[
                            styles.statusPill,
                            isCompleted ? styles.completedPill : (hasMissed ? styles.missedPill : (hasPending ? styles.pendingPill : styles.pendingPill))
                          ]}>
                          <Text
                            style={[
                              styles.statusPillText,
                              isCompleted ? styles.completedPillText : (hasMissed ? styles.missedPillText : (hasPending ? styles.pendingPillText : styles.pendingPillText))
                            ]}
                            numberOfLines={1}
                          >
                            {isCompleted ? 'Completed' : hasMissed ? 'Missed' : 'Pending'}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              )}
            </View>
          ) : null}

          {/* Selected Vaccine */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Vaccine</Text>
            <View style={styles.selectedBannerBox}>
              <Ionicons name="shield-checkmark" size={18} color="#667eea" style={{ marginRight: 8 }} />
              <Text style={styles.selectedBannerTextDark}>{formData.vaccineName || 'No vaccine selected'}</Text>
            </View>
          </View>

          {/* Vaccination Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vaccination Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                setSelectionsFromISO(formData.dateGiven);
                setShowDateModal(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#667eea" />
              <Text style={styles.dateText}>{fmtDisplay(formData.dateGiven)}</Text>
            </TouchableOpacity>
          </View>
          
          {showDateModal && (
            <Modal transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={() => { if (selYear && selMonth && selDay) { const dateObj = new Date(selYear, selMonth - 1, selDay); updateFormData('dateGiven', fmt(dateObj)); } setShowDateModal(false); }}>
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                <View style={[styles.modalCardBottom, { maxHeight: '70%', paddingBottom: 16 }]}>
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Select Vaccination Date</Text>
                  </View>
                  <View style={styles.dateColumnsRow}>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColLabel}>Day</Text>
                      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
                        {getDayOptions().map((d) => (
                          <TouchableOpacity key={d} style={[styles.optionItem, selDay === d && styles.optionSelected]} onPress={() => setSelDay(d)}>
                            <Text style={[styles.optionText, selDay === d && styles.optionTextSelected]}>{String(d).padStart(2,'0')}</Text>
                            {selDay === d && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColLabel}>Month</Text>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {getMonthOptions().map((m) => (
                          <TouchableOpacity key={m} style={[styles.optionItem, selMonth === m && styles.optionSelected]} onPress={() => { setSelMonth(m); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); }}>
                            <Text style={[styles.optionText, selMonth === m && styles.optionTextSelected]}>{monthNames[m-1]}</Text>
                            {selMonth === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColLabel}>Year</Text>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {getYearOptions().map((y) => (
                          <TouchableOpacity key={y} style={[styles.optionItem, selYear === y && styles.optionSelected]} onPress={() => { setSelYear(y); if (selMonth && !getMonthOptions().includes(selMonth)) setSelMonth(null); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); }}>
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
          )}
          

          {/* Healthcare Provider removed per requirement */}

          {/* Vaccine Information removed per requirement */}

          {/* Side Effects */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Side Effects</Text>
            <View style={styles.sideEffectsGrid}>
              {sideEffectOptions.map((effect) => (
                <TouchableOpacity
                  key={effect}
                  style={[styles.sideEffectChip, (formData.sideEffects || []).includes(effect) && styles.activeSideEffectChip]}
                  onPress={() => {
                    setFormData(prev => {
                      const current = Array.isArray(prev.sideEffects) ? prev.sideEffects : [];
                      if (effect === 'No side effects') return { ...prev, sideEffects: ['No side effects'] };
                      const base = current.filter(e => e !== 'No side effects');
                      const exists = base.includes(effect);
                      const next = exists ? base.filter(e => e !== effect) : [...base, effect];
                      return { ...prev, sideEffects: next };
                    });
                  }}
                >
                  <Text style={[styles.sideEffectText, (formData.sideEffects || []).includes(effect) && styles.activeSideEffectText]}>
                    {effect}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={formData.notes}
                onChangeText={(text) => updateFormData('notes', text)}
                placeholder="Any additional notes about the vaccination..."
                placeholderTextColor="#7f8c8d"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Submit */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={submitting}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.submitButtonGradient}>
                <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Child Switcher Modal */}
        <Modal visible={showChildModal} transparent animationType="fade" onRequestClose={() => setShowChildModal(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowChildModal(false)}>
            <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Switch Child</Text>
                <TouchableOpacity onPress={() => setShowChildModal(false)}>
                  <Ionicons name="close" size={22} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {children.map((c, idx) => (
                  <TouchableOpacity key={c.id} style={styles.childRow} onPress={async () => {
                    await selectChild(c.id);
                    setShowChildModal(false);
                  }}>
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
                    {idx === currentChildIndex && <Ionicons name="checkmark-circle" size={22} color="#667eea" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {/* Vaccine Details Modal (no overlay) */}
        <Modal visible={showVaccineModal} transparent animationType="slide" onRequestClose={() => setShowVaccineModal(false)}>
          <View style={styles.vDetailWrapper}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowVaccineModal(false)} />
            <View style={styles.vDetailCard}>
              <View style={styles.vDetailHeader}>
                <Text style={styles.vDetailTitle}>{modalVaccine?.name || 'Vaccine Details'}</Text>
                <TouchableOpacity onPress={() => setShowVaccineModal(false)}>
                  <Ionicons name="close" size={22} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Show full details without truncation */}
                <Text style={styles.vDetailLabel}>Disease Prevented</Text>
                <Text style={styles.vDetailText}>{modalVaccine?.entries?.[0]?.schedule?.disease_prevented || '-'}</Text>
                <Text style={styles.vDetailLabel}>Recommended Age</Text>
                <Text style={styles.vDetailText}>{modalVaccine?.entries?.[0]?.schedule?.recommended_age || '-'}</Text>
                <Text style={styles.vDetailLabel}>Total Doses Required</Text>
                <Text style={styles.vDetailText}>{(() => { const { required } = computeDoseInfo(modalVaccine); return required || '-'; })()}</Text>
                <Text style={styles.vDetailLabel}>Doses Taken</Text>
                <Text style={styles.vDetailText}>{(() => { const { required, taken } = computeDoseInfo(modalVaccine); return `${taken} / ${required}`; })()}</Text>
                <Text style={styles.vDetailLabel}>Category</Text>
                <Text style={styles.vDetailText}>{selectedCategory || modalVaccine?.entries?.[0]?.schedule?.category || '-'}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
        </>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectedBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#dfe3ff',
  },
  selectedBannerTextDark: {
    color: '#2c3e50',
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  childInitial: {
    color: '#fff',
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  activeTypeCard: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  activeTypeTitle: {
    color: '#667eea',
  },
  typeDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  infoLine: {
    marginTop: 8,
    fontSize: 12,
    color: '#7f8c8d',
  },
  infoHighlight: {
    marginTop: 10,
    fontSize: 12,
    color: '#2c3e50',
    backgroundColor: 'rgba(102,126,234,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  vaccineScroll: {
    marginBottom: 8,
  },
  vaccineTouchable: {
    marginRight: 16,
  },
  vaccineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: 180,
    borderWidth: 1,
    borderColor: '#f1f3f4',
    overflow: 'hidden',
  },
  activeVaccineCard: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  vaccineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vaccineTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  activeVaccineName: {
    color: '#667eea',
  },
  doseBadge: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  doseText: {
    fontSize: 10,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  vaccineFullName: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  vaccineAge: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '500',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completedPill: {
    backgroundColor: 'rgba(16,172,132,0.12)',
  },
  completedPillText: {
    color: '#10ac84',
  },
  pendingPill: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  pendingPillText: {
    color: '#f39c12',
  },
  missedPill: {
    backgroundColor: 'rgba(217,48,37,0.12)',
  },
  missedPillText: {
    color: '#d93025',
  },
  infoTinyBtn: {
    padding: 4,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(102,126,234,0.12)'
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  doseContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  doseGroup: {
    flex: 0.4,
  },
  doseOf: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 12,
  },
  doseInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateGroup: {
    flex: 0.48,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  dateText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
  sideEffectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sideEffectChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  activeSideEffectChip: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sideEffectText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeSideEffectText: {
    color: '#fff',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  dateModalHeader: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dateModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  dateModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  dateActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  dateActionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  dateActionPrimary: {
    backgroundColor: '#667eea',
  },
  dateActionPrimaryText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  modalCardBottom: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#f1f3f4',
  },
  dateColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateColumn: {
    flex: 1,
    marginHorizontal: 6,
    maxHeight: 240,
  },
  dateColLabel: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '700',
    marginBottom: 6,
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  optionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  // Vaccine detail modal (no overlay backdrop)
  vDetailWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  vDetailCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  vDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  vDetailLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
  },
  vDetailText: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 4,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  childRowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  childRowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  childRowAge: {
    fontSize: 13,
    color: '#7f8c8d',
  },
});

export default AddVaccinationScreen;
