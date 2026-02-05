import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
	Platform,
	ActivityIndicator,
	KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { userService } from '../../services/userService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');

const AddSymptomsScreen = ({ navigation }) => {
  const {
    children,
    selectedChild,
    selectedChildId,
    loadingChildren,
    switchingChild,
    error: childrenError,
    selectChild,
  } = useSelectedChild();

  const [formData, setFormData] = useState({
    childName: '',
    symptoms: {
      fever: false,
      cold: false,
      cough: false,
      sore_throat: false,
      headache: false,
      stomach_ache: false,
      nausea: false,
      vomiting: false,
      diarrhea: false,
      rash: false,
      fatigue: false,
      loss_of_appetite: false,
    },
    severity: 'Mild',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    temperatureC: '37.0',
    temperatureAt: new Date().toISOString(),
    startTimeAt: new Date().toISOString(),
    resolvedTimeAt: new Date().toISOString(),
    description: '',
    notes: '',
    resolved: false,
    resolvedBy: 'Parent',
  });

  const symptomMeta = [
    { key: 'fever', label: 'Fever', icon: 'thermometer', color: '#ff6b6b' },
    { key: 'cold', label: 'Cold', icon: 'water', color: '#26c6da' },
    { key: 'cough', label: 'Cough', icon: 'medical', color: '#ffa726' },
    { key: 'sore_throat', label: 'Sore Throat', icon: 'sad', color: '#ab47bc' },
    { key: 'headache', label: 'Headache', icon: 'skull', color: '#667eea' },
    { key: 'stomach_ache', label: 'Stomach Ache', icon: 'body', color: '#10ac84' },
    { key: 'nausea', label: 'Nausea', icon: 'sad-outline', color: '#ffa726' },
    { key: 'vomiting', label: 'Vomiting', icon: 'warning', color: '#ff6b6b' },
    { key: 'diarrhea', label: 'Diarrhea', icon: 'warning-outline', color: '#ff9800' },
    { key: 'rash', label: 'Rash', icon: 'bandage', color: '#e91e63' },
    { key: 'fatigue', label: 'Fatigue', icon: 'bed', color: '#9c27b0' },
    { key: 'loss_of_appetite', label: 'Loss of Appetite', icon: 'restaurant', color: '#795548' },
  ];

  // Children & selection (same behavior as AddVaccinationScreen)
  const currentChild = selectedChild;
  const currentChildIndex = useMemo(
    () => children.findIndex(c => String(c.id) === String(selectedChildId)),
    [children, selectedChildId]
  );
  const [showChildModal, setShowChildModal] = useState(false);
  const [illnesses, setIllnesses] = useState([]);
  const [illnessesLoading, setIllnessesLoading] = useState(false);
  const [illnessesError, setIllnessesError] = useState('');
  const [showIllnessModal, setShowIllnessModal] = useState(false);

  // Centralized refresh for illnesses list with loading + error alert
  const refreshIllnesses = useCallback(async (childId) => {
    if (!childId) return;
    try {
      setIllnessesLoading(true);
      setIllnessesError('');
      const data = await userService.listIllnesses(childId);
      const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const sorted = [...list].sort((a, b) => {
        if ((a?.is_current ? 1 : 0) !== (b?.is_current ? 1 : 0)) return a?.is_current ? -1 : 1;
        const at = new Date(a?.symptom_start_date || 0).getTime();
        const bt = new Date(b?.symptom_start_date || 0).getTime();
        return bt - at;
      });
      setIllnesses(sorted);
    } catch (e) {
      const msg = e?.message || 'Failed to load illnesses';
      setIllnessesError(msg);
      Alert.alert('Error', msg);
    } finally {
      setIllnessesLoading(false);
    }
  }, []);
  const [modalIllness, setModalIllness] = useState(null);
  const [resolveMethod, setResolveMethod] = useState('Home remedy');
  const [resolveTimeISO, setResolveTimeISO] = useState(new Date().toISOString());
  const [showResolveTimeModal, setShowResolveTimeModal] = useState(false);
  const [resolveSelHour, setResolveSelHour] = useState(12);
  const [resolveSelMinute, setResolveSelMinute] = useState(0);
  const [resolveSelAmPm, setResolveSelAmPm] = useState('AM');
  const [showResolveDateModal, setShowResolveDateModal] = useState(false);

  // Date picker modal state (shared for start/end/temperature dates)
  const [showDateModal, setShowDateModal] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('startDate');
  const [selYear, setSelYear] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const [selDay, setSelDay] = useState(null);
  // Temperature modal state
  const [showTempModal, setShowTempModal] = useState(false);
  const [tempInt, setTempInt] = useState(37);
  const [tempDec, setTempDec] = useState(0);
  const [selHour, setSelHour] = useState(12); // 1-12
  const [selMinute, setSelMinute] = useState(0); // 0-59
  const [selAmPm, setSelAmPm] = useState('AM');
  const [showTempDateModal, setShowTempDateModal] = useState(false);
  const [showTempTimeModal, setShowTempTimeModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showResolvedTimeModal, setShowResolvedTimeModal] = useState(false);

  const today = new Date();
  const tenYearsAgo = new Date(new Date().setFullYear(today.getFullYear() - 10));
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const severityLevels = [
    { id: 'Mild', color: '#10ac84', description: 'Minor discomfort' },
    { id: 'Moderate', color: '#ffa726', description: 'Noticeable symptoms' },
    { id: 'Severe', color: '#ff6b6b', description: 'Significant distress' },
    { id: 'Critical', color: '#e74c3c', description: 'Requires immediate attention' },
  ];

  const severityStyles = {
    Mild: { icon: 'happy-outline', tint: '#10ac84', gradient: ['#dcfce7', '#bbf7d0'] },
    Moderate: { icon: 'alert-circle-outline', tint: '#f59e0b', gradient: ['#fff7ed', '#ffedd5'] },
    Severe: { icon: 'warning-outline', tint: '#ef4444', gradient: ['#fee2e2', '#fecaca'] },
    Critical: { icon: 'medical-outline', tint: '#dc2626', gradient: ['#ffe4e6', '#fecdd3'] },
  };

  // Helpers: format age, date utilities, load children
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

  const getHourOptions = () => Array.from({ length: 12 }, (_, i) => i + 1);
  const getMinuteOptions = () => Array.from({ length: 60 }, (_, i) => i);
  const getTempIntOptions = () => Array.from({ length: 12 }, (_, i) => 34 + i); // 34-45
  const getTempDecOptions = () => Array.from({ length: 10 }, (_, i) => i); // 0-9

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
  const fmtDisplayDateTime = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    const dd = String(dt.getDate()).padStart(2,'0');
    const mon = monthNames[dt.getMonth()];
    const yyyy = dt.getFullYear();
    let hrs = dt.getHours();
    const mins = dt.getMinutes();
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12; if (hrs === 0) hrs = 12;
    const mm = String(mins).padStart(2,'0');
    return `${dd}- ${mon}-${yyyy}, ${hrs}:${mm} ${ampm}`;
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
    const minMonth = selYear === tenYearsAgo.getFullYear() ? tenYearsAgo.getMonth() + 1 : 1;
    const maxMonth = selYear === today.getFullYear() ? (today.getMonth() + 1) : 12;
    const arr = [];
    for (let m = minMonth; m <= maxMonth; m++) arr.push(m);
    return arr;
  };
  const getDayOptions = () => {
    if (!selYear || !selMonth) return [];
    const total = daysInMonth(selYear, selMonth);
    let minDay = 1;
    let maxDay = total;
    // Lower bound for earliest allowed year/month
    if (selYear === tenYearsAgo.getFullYear() && selMonth === (tenYearsAgo.getMonth() + 1)) {
      minDay = Math.max(minDay, tenYearsAgo.getDate());
    }
    // Upper bound: if current year/month, do not allow future days
    if (selYear === today.getFullYear() && selMonth === (today.getMonth() + 1)) {
      maxDay = Math.min(maxDay, today.getDate());
    }
    const arr = [];
    for (let d = minDay; d <= maxDay; d++) arr.push(d);
    return arr;
  };
  useEffect(() => {
    if (selectedChild?.name) {
      setFormData(prev => ({ ...prev, childName: selectedChild.name }));
    }
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedChildId) {
      setIllnesses([]);
      return;
    }
    // Single source of truth for fetching illnesses when the selected child changes
    refreshIllnesses(selectedChildId);
  }, [selectedChildId, refreshIllnesses]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ...
  const toggleSymptom = (key) => {
    setFormData(prev => ({
      ...prev,
      symptoms: { ...prev.symptoms, [key]: !prev.symptoms[key] }
    }));
  };

  const handleResolveFromModal = async () => {
    if (!modalIllness) return;
    if (!modalIllness.is_current) { setShowIllnessModal(false); return; }
    try {
      // Validate resolved_on >= symptom_start_date
      const start = new Date(modalIllness.symptom_start_date);
      const resolved = new Date(resolveTimeISO);
      if (!(resolved.getTime() >= start.getTime())) {
        Alert.alert('Invalid time', 'Resolved time cannot be earlier than the start time.');
        return;
      }
      const resolved_by = resolveMethod === 'Doctor consult' ? 'Doctor' : 'Parent';
      const payload = { resolved_on: resolved.toISOString(), resolved_by };
      const id = modalIllness.id ?? modalIllness.log_id ?? modalIllness.entry_id;
      if (!id) { Alert.alert('Error', 'Cannot resolve: missing illness ID.'); return; }
      await userService.resolveIllness(id, payload);
      // Update UI
      setIllnesses(prev => prev.map(it => (it.id === id ? { ...it, is_current: false, resolved_on: payload.resolved_on, resolved_by } : it)));
      await refreshIllnesses(selectedChildId || modalIllness.child_id);
      setShowIllnessModal(false);
      Alert.alert('Resolved', `Marked as resolved${resolveMethod ? ` (${resolveMethod})` : ''}.`);
    } catch (err) {
      const msg = err?.data?.message || err?.data?.detail || err?.message || 'Failed to resolve illness.';
      Alert.alert('Error', msg);
    }
  };

  const handleSave = async () => {
    // Validation
    const anySelected = Object.values(formData.symptoms || {}).some(Boolean);
    if (!anySelected) {
      Alert.alert('Missing Information', 'Please select at least one symptom.');
      return;
    }
    const childId = selectedChildId;
    if (!childId) {
      Alert.alert('Error', 'No child selected.');
      return;
    }

    // Build payload (embed times into date fields as ISO datetimes, same as temperature_time)
    const isCurrent = !formData.resolved;
    const temperature_c = Number.isFinite(parseFloat(formData.temperatureC))
      ? parseFloat(formData.temperatureC)
      : 37.0;

    const buildIso = (dateStr, timeIso) => {
      const baseDate = parseISO(dateStr);
      const time = timeIso ? new Date(timeIso) : new Date();
      const h = time.getHours();
      const m = time.getMinutes();
      const dt = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        h,
        m,
        0
      );
      return dt.toISOString();
    };

    const symptom_start_iso = buildIso(formData.startDate, formData.startTimeAt);
    const resolved_on_iso = isCurrent ? null : buildIso(formData.endDate, formData.resolvedTimeAt);

    const payload = {
      ...formData.symptoms,
      temperature_c,
      temperature_time: formData.temperatureAt,
      symptom_start_date: symptom_start_iso,
      severity: formData.severity,
      is_current: isCurrent,
      resolved_on: resolved_on_iso,
      resolved_by: isCurrent
        ? null
        : (formData.resolvedBy === 'Doctor consult' ? 'Doctor' : 'Parent'),
      notes: formData.notes || '',
    };

    try {
      const res = await userService.createIllness(childId, payload);
      await refreshIllnesses(childId);
      Alert.alert(
        'Symptoms Recorded',
        'Symptoms have been logged successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const status = err?.status;
      const data = err?.data;
      let message = 'Failed to log symptoms';
      if (status === 422) {
        // Validation error formatting
        const details =
          typeof data === 'object'
            ? (data.detail || data.message || JSON.stringify(data))
            : String(data || 'Validation Error');
        message = `Validation Error${details ? `: ${details}` : ''}`;
      } else if (data?.message || data?.detail) {
        message = data.message || data.detail;
      } else if (err?.message) {
        message = err.message;
      }

      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Log Symptoms"
        onBackPress={() => navigation.goBack()}
      />

      {(loadingChildren && !children.length) ? (
        <LoadingState fullScreen />
      ) : (
        <>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Error */}
              {childrenError ? (
                <ErrorState
                  message={childrenError}
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
                      <View style={styles.childAvatar}>
                        <Text style={styles.childInitial}>
                          {(currentChild?.name || formData.childName || '?').charAt(0)}
                        </Text>
                      </View>
                    )}

                    <View>
                      <Text style={styles.childName}>
                        {currentChild?.name || formData.childName || 'Child'}
                      </Text>
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

              {/* Illness History */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Illness History</Text>
                {illnessesLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color="#667eea" />
                    <Text style={{ marginLeft: 8, color: '#7f8c8d' }}>Loading illnesses...</Text>
                  </View>
                ) : illnessesError ? (
                  <ErrorState
                    message={illnessesError}
                    fullWidth
                  />
                ) : illnesses.length === 0 ? (
                  <Text style={styles.sectionSubtitle}>No current illnesses.</Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ paddingVertical: 4 }}
                    contentContainerStyle={{ paddingRight: 8 }}
                  >
                    {illnesses.map((it, idx) => {
                      const sev = it?.severity || 'Mild';
                      const meta = severityStyles[sev] || severityStyles.Mild;
                      const trueSymptoms = Object.keys(formData.symptoms).filter(k => it[k]);
                      const shown = trueSymptoms.slice(0, 3).map(k => (symptomMeta.find(s => s.key === k)?.label || k));
                      const extra = trueSymptoms.length - shown.length;
                      const statusPillBg = it.is_current ? '#eef2ff' : '#e6f7f0';
                      const statusPillText = it.is_current ? '#667eea' : '#10ac84';
                      const statusText = it.is_current ? 'Ongoing' : 'Resolved';
                      return (
                        <TouchableOpacity key={String(it.id ?? idx)} activeOpacity={1} onPress={() => { setModalIllness(it); setResolveMethod('Home remedy'); setResolveTimeISO(new Date().toISOString()); setShowIllnessModal(true); }}>
                          <LinearGradient colors={meta.gradient} style={{ borderRadius: 16, padding: 14, marginRight: 12, width: 280, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: meta.tint, borderWidth: 2, borderColor: '#ffffffcc' }}>
                                  <Ionicons name={meta.icon} size={20} color="#fff" />
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937' }}>{sev}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ backgroundColor: statusPillBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, borderWidth: 1, borderColor: '#ffffff66' }}>
                                  <Text style={{ fontSize: 12, color: statusPillText, fontWeight: '700' }}>{statusText}</Text>
                                </View>
                                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#ffffffb3', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name="chevron-forward" size={16} color="#374151" />
                                </View>
                              </View>
                            </View>
                            <Text style={{ marginTop: 6, fontSize: 12, color: '#4b5563' }}>
                              {(() => {
                                const timePart = it.symptom_start_date ? `, ${fmtDisplayDateTime(it.symptom_start_date).split(', ')[1]}` : '';
                                return `Started: ${fmtDisplay(it.symptom_start_date)}${timePart}`;
                              })()}
                            </Text>
                            {/* Removed resolved-by badge on cards for consistent layout */}
                            {!!it.temperature_c && (
                              <Text style={{ marginTop: 4, fontSize: 12, color: '#4b5563' }}>Temp: {it.temperature_c} °C • {fmtDisplayDateTime(it.temperature_time)}</Text>
                            )}
                            {shown.length > 0 && (
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                                {shown.map((label, i) => (
                                  <View key={`${label}-${i}`} style={{ backgroundColor: '#ffffffaa', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 6, marginBottom: 6 }}>
                                    <Text style={{ fontSize: 11, color: '#111827' }}>{label}</Text>
                                  </View>
                                ))}
                                {extra > 0 && (
                                  <View style={{ backgroundColor: '#ffffffaa', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                                    <Text style={{ fontSize: 11, color: '#111827' }}>{`+${extra} more`}</Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Symptoms Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add Symptoms</Text>
                <Text style={styles.sectionSubtitle}>Select all that apply</Text>
                <View style={styles.symptomsGrid}>
                  {symptomMeta.map((symptom) => (
                    <TouchableOpacity
                      key={symptom.key}
                      style={[styles.symptomCard, formData.symptoms[symptom.key] && styles.activeSymptomCard]}
                      onPress={() => toggleSymptom(symptom.key)}
                    >
                      <LinearGradient
                        colors={formData.symptoms[symptom.key] ? [symptom.color, symptom.color + '80'] : ['#f8f9ff', '#f8f9ff']}
                        style={styles.symptomIcon}
                      >
                        <Ionicons 
                          name={symptom.icon}
                          size={20} 
                          color={formData.symptoms[symptom.key] ? '#fff' : symptom.color}
                        />
                      </LinearGradient>
                      <Text style={[styles.symptomText, formData.symptoms[symptom.key] && styles.activeSymptomText]}>
                        {symptom.label}
                      </Text>
                      {formData.symptoms[symptom.key] && (
                        <Ionicons name="checkmark-circle" size={16} color="#10ac84" style={styles.checkmark} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Severity Level */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Severity Level</Text>
                <View style={styles.severityContainer}>
                  {severityLevels.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      style={[styles.severityCard, formData.severity === level.id && styles.activeSeverityCard]}
                      onPress={() => updateFormData('severity', level.id)}
                    >
                      <View style={[styles.severityIndicator, { backgroundColor: level.color }]} />
                      <Text style={[styles.severityTitle, formData.severity === level.id && styles.activeSeverityTitle]}>
                        {level.id}
                      </Text>
                      <Text style={styles.severityDescription}>{level.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Temperature (three rows: value, measured date, measured time) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Temperature</Text>
                {/* Row 1: Numeric temperature */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Value (°C)</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      const curr = parseFloat(formData.temperatureC);
                      if (!Number.isNaN(curr)) {
                        const i = Math.floor(curr);
                        const d = Math.round((curr - i) * 10);
                        setTempInt(i);
                        setTempDec(Number.isFinite(d) ? d : 0);
                      } else {
                        setTempInt(37); setTempDec(0);
                      }
                      setShowTempModal(true);
                    }}
                  >
                    <Ionicons name="speedometer-outline" size={20} color="#667eea" />
                    <Text style={styles.dateText}>{formData.temperatureC ? `${formData.temperatureC} °C` : 'Select temperature'}</Text>
                  </TouchableOpacity>
                </View>
                {/* Row 2: Measured Date */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Measured Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      const base = formData.temperatureAt ? new Date(formData.temperatureAt) : new Date();
                      setSelYear(base.getFullYear());
                      setSelMonth(base.getMonth() + 1);
                      setSelDay(base.getDate());
                      setShowTempDateModal(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#667eea" />
                    <Text style={styles.dateText}>{fmtDisplay(formData.temperatureAt)}</Text>
                  </TouchableOpacity>
                </View>
                {/* Row 3: Measured Time */}
                <View>
                  <Text style={styles.inputLabel}>Measured Time</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      const base = formData.temperatureAt ? new Date(formData.temperatureAt) : new Date();
                      let hr = base.getHours();
                      const ap = hr >= 12 ? 'PM' : 'AM';
                      hr = hr % 12; if (hr === 0) hr = 12;
                      setSelHour(hr);
                      setSelMinute(base.getMinutes());
                      setSelAmPm(ap);
                      setShowTempTimeModal(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color="#667eea" />
                    <Text style={styles.dateText}>{fmtDisplayDateTime(formData.temperatureAt).split(', ')[1] || ''}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Duration & Timeline */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Symptoms Timeline</Text>
                {/* Row 1: Start Date */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => { setDatePickerTarget('startDate'); setSelectionsFromISO(formData.startDate); setShowDateModal(true); }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#667eea" />
                    <Text style={styles.dateText}>{fmtDisplay(formData.startDate)}</Text>
                  </TouchableOpacity>
                </View>
                {/* Row 1b: Start Time */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      const base = formData.startTimeAt ? new Date(formData.startTimeAt) : new Date();
                      let hr = base.getHours();
                      const ap = hr >= 12 ? 'PM' : 'AM';
                      hr = hr % 12; if (hr === 0) hr = 12;
                      setSelHour(hr);
                      setSelMinute(base.getMinutes());
                      setSelAmPm(ap);
                      setShowStartTimeModal(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color="#667eea" />
                    <Text style={styles.dateText}>{fmtDisplayDateTime(formData.startTimeAt).split(', ')[1] || ''}</Text>
                  </TouchableOpacity>
                </View>
          </View>

        {/* Symptoms Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Symptoms</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          <View style={styles.symptomsGrid}>
            {symptomMeta.map((symptom) => (
              <TouchableOpacity
                key={symptom.key}
                style={[styles.symptomCard, formData.symptoms[symptom.key] && styles.activeSymptomCard]}
                onPress={() => toggleSymptom(symptom.key)}
              >
                <LinearGradient
                  colors={formData.symptoms[symptom.key] ? [symptom.color, symptom.color + '80'] : ['#f8f9ff', '#f8f9ff']}
                  style={styles.symptomIcon}
                >
                  <Ionicons 
                    name={symptom.icon}
                    size={20} 
                    color={formData.symptoms[symptom.key] ? '#fff' : symptom.color}
                  />
                </LinearGradient>
                <Text style={[styles.symptomText, formData.symptoms[symptom.key] && styles.activeSymptomText]}>
                  {symptom.label}
                </Text>
                {formData.symptoms[symptom.key] && (
                  <Ionicons name="checkmark-circle" size={16} color="#10ac84" style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityContainer}>
            {severityLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[styles.severityCard, formData.severity === level.id && styles.activeSeverityCard]}
                onPress={() => updateFormData('severity', level.id)}
              >
                <View style={[styles.severityIndicator, { backgroundColor: level.color }]} />
                <Text style={[styles.severityTitle, formData.severity === level.id && styles.activeSeverityTitle]}>
                  {level.id}
                </Text>
                <Text style={styles.severityDescription}>{level.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Temperature (three rows: value, measured date, measured time) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temperature</Text>
          {/* Row 1: Numeric temperature */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Value (°C)</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                const curr = parseFloat(formData.temperatureC);
                if (!Number.isNaN(curr)) {
                  const i = Math.floor(curr);
                  const d = Math.round((curr - i) * 10);
                  setTempInt(i);
                  setTempDec(Number.isFinite(d) ? d : 0);
                } else {
                  setTempInt(37); setTempDec(0);
                }
                setShowTempModal(true);
              }}
            >
              <Ionicons name="speedometer-outline" size={20} color="#667eea" />
              <Text style={styles.dateText}>{formData.temperatureC ? `${formData.temperatureC} °C` : 'Select temperature'}</Text>
            </TouchableOpacity>
          </View>
          {/* Row 2: Measured Date */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Measured Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                const base = formData.temperatureAt ? new Date(formData.temperatureAt) : new Date();
                setSelYear(base.getFullYear());
                setSelMonth(base.getMonth() + 1);
                setSelDay(base.getDate());
                setShowTempDateModal(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#667eea" />
              <Text style={styles.dateText}>{fmtDisplay(formData.temperatureAt)}</Text>
            </TouchableOpacity>
          </View>
          {/* Row 3: Measured Time */}
          <View>
            <Text style={styles.inputLabel}>Measured Time</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                const base = formData.temperatureAt ? new Date(formData.temperatureAt) : new Date();
                let hr = base.getHours();
                const ap = hr >= 12 ? 'PM' : 'AM';
                hr = hr % 12; if (hr === 0) hr = 12;
                setSelHour(hr);
                setSelMinute(base.getMinutes());
                setSelAmPm(ap);
                setShowTempTimeModal(true);
              }}
            >
              <Ionicons name="time-outline" size={20} color="#667eea" />
              <Text style={styles.dateText}>{fmtDisplayDateTime(formData.temperatureAt).split(', ')[1] || ''}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration & Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms Timeline</Text>
          {/* Row 1: Start Date */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => { setDatePickerTarget('startDate'); setSelectionsFromISO(formData.startDate); setShowDateModal(true); }}
            >
              <Ionicons name="calendar-outline" size={20} color="#667eea" />
              <Text style={styles.dateText}>{fmtDisplay(formData.startDate)}</Text>
            </TouchableOpacity>
          </View>
          {/* Row 1b: Start Time */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                const base = formData.startTimeAt ? new Date(formData.startTimeAt) : new Date();
                let hr = base.getHours();
                const ap = hr >= 12 ? 'PM' : 'AM';
                hr = hr % 12; if (hr === 0) hr = 12;
                setSelHour(hr);
                setSelMinute(base.getMinutes());
                setSelAmPm(ap);
                setShowStartTimeModal(true);
              }}
            >
              <Ionicons name="time-outline" size={20} color="#667eea" />
              <Text style={styles.dateText}>{fmtDisplayDateTime(formData.startTimeAt).split(', ')[1] || ''}</Text>
            </TouchableOpacity>
          </View>
          {/* Row 2: Old Status Card UI */}
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.statusCard, formData.resolved && styles.activeStatusCard]}
              onPress={() => updateFormData('resolved', !formData.resolved)}
            >
              <LinearGradient
                colors={formData.resolved ? ['#10ac84', '#06d6a0'] : ['#f8f9ff', '#f8f9ff']}
                style={styles.statusIcon}
              >
                <Ionicons 
                  name={formData.resolved ? "checkmark-circle" : "time"} 
                  size={24} 
                  color={formData.resolved ? '#fff' : '#667eea'} 
                />
              </LinearGradient>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusTitle, formData.resolved && styles.activeStatusTitle]}>
                  {formData.resolved ? 'Symptoms Resolved' : 'Symptoms Ongoing'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {formData.resolved ? 'Child is feeling better' : 'Still experiencing symptoms'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Row 3: Resolved On (conditional) */}
          {formData.resolved && (
            <View>
              <Text style={styles.inputLabel}>Resolved On</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => { setDatePickerTarget('endDate'); setSelectionsFromISO(formData.endDate); setShowDateModal(true); }}
              >
                <Ionicons name="calendar-outline" size={20} color="#667eea" />
                <Text style={styles.dateText}>{fmtDisplay(formData.endDate)}</Text>
              </TouchableOpacity>
              {/* Row 3b: Resolved Time */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Resolved Time</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    const base = formData.resolvedTimeAt ? new Date(formData.resolvedTimeAt) : new Date();
                    let hr = base.getHours();
                    const ap = hr >= 12 ? 'PM' : 'AM';
                    hr = hr % 12; if (hr === 0) hr = 12;
                    setSelHour(hr);
                    setSelMinute(base.getMinutes());
                    setSelAmPm(ap);
                    setShowResolvedTimeModal(true);
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#667eea" />
                  <Text style={styles.dateText}>{fmtDisplayDateTime(formData.resolvedTimeAt).split(', ')[1] || ''}</Text>
                </TouchableOpacity>
                {/* Row 3c: Resolved Method */}
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>Resolved Method</Text>
                  <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    {['Home remedy','Doctor consult'].map((opt) => (
                      <TouchableOpacity key={`cr-${opt}`} onPress={() => updateFormData('resolvedBy', opt === 'Home remedy' ? 'Parent' : 'Doctor')} style={{ marginRight: 8 }}>
                        <View style={[{ borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderColor: '#e5e7eb', backgroundColor: '#fff' }, ((formData.resolvedBy === 'Parent' && opt==='Home remedy') || (formData.resolvedBy === 'Doctor' && opt==='Doctor consult')) && { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
                          <Text style={[{ fontSize: 12, color: '#374151' }, ((formData.resolvedBy === 'Parent' && opt==='Home remedy') || (formData.resolvedBy === 'Doctor' && opt==='Doctor consult')) && { color: '#4338ca', fontWeight: '700' }]}>{opt}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Old temperature section removed; handled above with modal */}

        {/* Detailed Description removed as requested */}

        {/* Triggers and Treatments sections removed as requested */}

        {/* Status section removed; handled as inline banner in Duration */}

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={formData.notes}
              onChangeText={(text) => updateFormData('notes', text)}
              placeholder="Any other observations or notes..."
              placeholderTextColor="#7f8c8d"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Submit */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.submitButtonGradient}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Child Switcher Modal - bottom sheet with lower height */}
      <Modal visible={showChildModal} transparent animationType="fade" onRequestClose={() => setShowChildModal(false)}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setShowChildModal(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalCardBottom, { maxHeight: '55%', paddingBottom: 16 }]}> 
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Switch Child</Text>
              <TouchableOpacity onPress={() => setShowChildModal(false)}>
                <Ionicons name="close" size={22} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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
                  {idx === currentChildIndex && <Ionicons name="checkmark-circle" size={22} color="#667eea" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Shared Date Picker Modal for Start/End Dates - lower height */}
      {showDateModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {
              const y = selYear || today.getFullYear();
              const m = (selMonth || (today.getMonth()+1)) - 1;
              const d = selDay || today.getDate();
              const dateObj = new Date(y, m, d, 0, 0, 0);
              updateFormData(datePickerTarget, fmt(dateObj));
              setShowDateModal(false);
            }}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '55%', paddingBottom: 16 }]}> 
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Date</Text>
              </View>
              <View style={styles.dateColumnsRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Day</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getDayOptions().map((d) => (
                      <TouchableOpacity key={`sd-d-${d}`} style={[styles.optionItem, selDay === d && styles.optionSelected]} onPress={() => setSelDay(d)}>
                        <Text style={[styles.optionText, selDay === d && styles.optionTextSelected]}>{String(d).padStart(2,'0')}</Text>
                        {selDay === d && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Month</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getMonthOptions().map((m) => (
                      <TouchableOpacity key={`sd-m-${m}`} style={[styles.optionItem, selMonth === m && styles.optionSelected]} onPress={() => { setSelMonth(m); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); }}>
                        <Text style={[styles.optionText, selMonth === m && styles.optionTextSelected]}>{monthNames[m-1]}</Text>
                        {selMonth === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Year</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getYearOptions().map((y) => (
                      <TouchableOpacity key={`sd-y-${y}`} style={[styles.optionItem, selYear === y && styles.optionSelected]} onPress={() => { setSelYear(y); if (selMonth && !getMonthOptions().includes(selMonth)) setSelMonth(null); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); }}>
                        <Text style={[styles.optionText, selYear === y && styles.optionTextSelected]}>{y}</Text>
                        {selYear === y && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Illness Details Modal */}
      {showIllnessModal && modalIllness && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowIllnessModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => setShowIllnessModal(false)}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '65%', padding: 0, overflow: 'hidden', backgroundColor: '#fff' }]}> 
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Illness Details</Text>
                <TouchableOpacity onPress={() => setShowIllnessModal(false)}>
                  <Ionicons name="close" size={22} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              {(() => {
                const sev = modalIllness?.severity || 'Mild';
                const meta = severityStyles[sev] || severityStyles.Mild;
                const timeIso = modalIllness.symptom_start_time || modalIllness.symptom_start_date;
                const trueSymptoms = Object.keys(formData.symptoms).filter(k => modalIllness[k]);
                return (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 64 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: meta.tint, borderWidth: 2, borderColor: '#ffffffcc' }}>
                        <Ionicons name={meta.icon} size={22} color="#fff" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1f2937' }}>{sev}</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>{modalIllness.is_current ? 'Ongoing' : 'Resolved'}</Text>
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#f8f9ff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="calendar-outline" size={16} color="#667eea" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2c3e50' }}>Started</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#374151' }}>{fmtDisplay(modalIllness.symptom_start_date)}{timeIso ? `, ${fmtDisplayDateTime(timeIso).split(', ')[1]}` : ''}</Text>
                      {!modalIllness.is_current && (
                        <>
                          <Text style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>
                            {(() => {
                              const dt = modalIllness.resolved_on ? fmtDisplayDateTime(modalIllness.resolved_on) : '';
                              return `Resolved${dt ? `: ${dt}` : ''}`;
                            })()}
                          </Text>
                          {!!modalIllness.resolved_by && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                              {`Resolved by: ${modalIllness.resolved_by === 'Doctor' ? 'Doctor consult' : 'Home remedy'}`}
                            </Text>
                          )}
                        </>
                      )}
                    </View>

                    {!!modalIllness.temperature_c && (
                      <View style={{ backgroundColor: '#f8f9ff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name="thermometer-outline" size={16} color="#e11d48" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2c3e50' }}>Temperature</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#374151' }}>{modalIllness.temperature_c} °C</Text>
                        {(() => {
                          const tc = modalIllness.temperature_c;
                          let status = 'Normal';
                          let color = '#10ac84';
                          if (tc >= 38.5) { status = 'High fever'; color = '#ef4444'; }
                          else if (tc >= 37.5) { status = 'Fever'; color = '#f59e0b'; }
                          return <Text style={{ fontSize: 12, color, marginTop: 2 }}>{status}</Text>;
                        })()}
                        {modalIllness.temperature_time && (
                          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {`Recorded: ${fmtDisplayDateTime(modalIllness.temperature_time)}`}
                          </Text>
                        )}
                      </View>
                    )}

                    {trueSymptoms.length > 0 && (
                      <View style={{ backgroundColor: '#f8f9ff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name="list-circle-outline" size={16} color="#0ea5e9" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2c3e50' }}>Symptoms</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {trueSymptoms.map((key) => (
                            <View key={key} style={{ backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eef2ff' }}>
                              <Text style={{ fontSize: 12, color: '#111827' }}>{symptomMeta.find(s => s.key === key)?.label || key}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {modalIllness.notes ? (
                      <View style={{ backgroundColor: '#f8f9ff', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name="document-text-outline" size={16} color="#64748b" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2c3e50' }}>Notes</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#374151' }}>{modalIllness.notes}</Text>
                      </View>
                    ) : null}

                    {modalIllness.is_current ? (
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2c3e50', marginBottom: 8 }}>Resolve Method</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                          {['Home remedy','Doctor consult'].map((opt) => (
                            <TouchableOpacity key={opt} onPress={() => setResolveMethod(opt)} style={{ marginRight: 8 }}>
                              <View style={[{ borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderColor: '#e5e7eb', backgroundColor: '#fff' }, resolveMethod === opt && { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
                                <Text style={[{ fontSize: 12, color: '#374151' }, resolveMethod === opt && { color: '#4338ca', fontWeight: '700' }]}>{opt}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2c3e50', marginBottom: 8 }}>Resolved Date</Text>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginBottom: 12 }}
                          onPress={() => {
                            const base = new Date(resolveTimeISO);
                            setSelYear(base.getFullYear());
                            setSelMonth(base.getMonth() + 1);
                            setSelDay(base.getDate());
                            setShowResolveDateModal(true);
                          }}
                        >
                          <Ionicons name="calendar-outline" size={18} color="#667eea" style={{ marginRight: 8 }} />
                          <Text style={{ fontSize: 13, color: '#374151' }}>{fmtDisplay(resolveTimeISO)}</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2c3e50', marginBottom: 8 }}>Resolved Time</Text>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginBottom: 12 }}
                          onPress={() => {
                            const base = new Date(resolveTimeISO);
                            let hr = base.getHours();
                            const ap = hr >= 12 ? 'PM' : 'AM';
                            hr = hr % 12; if (hr === 0) hr = 12;
                            setResolveSelHour(hr);
                            setResolveSelMinute(base.getMinutes());
                            setResolveSelAmPm(ap);
                            setShowResolveTimeModal(true);
                          }}
                        >
                          <Ionicons name="time-outline" size={18} color="#667eea" style={{ marginRight: 8 }} />
                          <Text style={{ fontSize: 13, color: '#374151' }}>{fmtDisplayDateTime(resolveTimeISO).split(', ')[1]}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleResolveFromModal}>
                          <LinearGradient colors={['#10ac84', '#06d6a0']} style={{ borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#fff', fontWeight: '700' }}>Mark as Resolved</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: '#e6f7f0', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#10ac84', fontWeight: '700' }}>Resolved</Text>
                      </View>
                    )}

                    <View style={{ height: 8 }} />
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}

      {/* Temperature Modal (numeric only) */}
      {showTempModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowTempModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {
              const tempVal = `${tempInt}.${tempDec}`;
              updateFormData('temperatureC', tempVal);
              setShowTempModal(false);
            }}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '55%', paddingBottom: 16 }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Record Temperature</Text>
              </View>
              <View style={styles.dateColumnsRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Temp (°C)</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
                    {getTempIntOptions().map((v) => (
                      <TouchableOpacity key={`ti-${v}`} style={[styles.optionItem, tempInt === v && styles.optionSelected]} onPress={() => setTempInt(v)}>
                        <Text style={[styles.optionText, tempInt === v && styles.optionTextSelected]}>{v}</Text>
                        {tempInt === v && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Decimal</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
                    {getTempDecOptions().map((v) => (
                      <TouchableOpacity key={`td-${v}`} style={[styles.optionItem, tempDec === v && styles.optionSelected]} onPress={() => setTempDec(v)}>
                        <Text style={[styles.optionText, tempDec === v && styles.optionTextSelected]}>.{v}</Text>
                        {tempDec === v && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Temperature Date Modal */}
      {showTempDateModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowTempDateModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {
              const base = formData.temperatureAt ? new Date(formData.temperatureAt) : new Date();
              const hour24 = base.getHours();
              const min = base.getMinutes();
              const dateObj = new Date(selYear || today.getFullYear(), (selMonth || (today.getMonth()+1)) - 1, selDay || today.getDate(), hour24, min, 0);
              updateFormData('temperatureAt', dateObj.toISOString());
              setShowTempDateModal(false);
            }}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '55%', paddingBottom: 16 }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Date</Text>
              </View>
              <View style={styles.dateColumnsRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Day</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getDayOptions().map((d) => (
                      <TouchableOpacity key={`td-d-${d}`} style={[styles.optionItem, selDay === d && styles.optionSelected]} onPress={() => setSelDay(d)}>
                        <Text style={[styles.optionText, selDay === d && styles.optionTextSelected]}>{String(d).padStart(2,'0')}</Text>
                        {selDay === d && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Month</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getMonthOptions().map((m) => (
                      <TouchableOpacity key={`td-m-${m}`} style={[styles.optionItem, selMonth === m && styles.optionSelected]} onPress={() => { setSelMonth(m); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); }}>
                        <Text style={[styles.optionText, selMonth === m && styles.optionTextSelected]}>{monthNames[m-1]}</Text>
                        {selMonth === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Year</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getYearOptions().map((y) => (
                      <TouchableOpacity key={`td-y-${y}`} style={[styles.optionItem, selYear === y && styles.optionSelected]} onPress={() => { setSelYear(y); if (selMonth && !getMonthOptions().includes(selMonth)) setSelMonth(null); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); }}>
                        <Text style={[styles.optionText, selYear === y && styles.optionTextSelected]}>{y}</Text>
                        {selYear === y && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Temperature Time Modal */}
      {showTempTimeModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowTempTimeModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {
              const base = formData.temperatureAt ? new Date(formData.temperatureAt) : new Date();
              let hour24 = (selHour % 12) + (selAmPm === 'PM' ? 12 : 0); if (selAmPm === 'AM' && selHour === 12) hour24 = 0;
              const dateObj = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour24, selMinute, 0);
              updateFormData('temperatureAt', dateObj.toISOString());
              setShowTempTimeModal(false);
            }}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '55%', paddingBottom: 16 }]}> 
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Time</Text>
              </View>
              <View style={styles.dateColumnsRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Hour</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getHourOptions().map((h) => (
                      <TouchableOpacity key={`th-${h}`} style={[styles.optionItem, selHour === h && styles.optionSelected]} onPress={() => setSelHour(h)}>
                        <Text style={[styles.optionText, selHour === h && styles.optionTextSelected]}>{String(h).padStart(2,'0')}</Text>
                        {selHour === h && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Minute</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getMinuteOptions().map((m) => (
                      <TouchableOpacity key={`tm-${m}`} style={[styles.optionItem, selMinute === m && styles.optionSelected]} onPress={() => setSelMinute(m)}>
                        <Text style={[styles.optionText, selMinute === m && styles.optionTextSelected]}>{String(m).padStart(2,'0')}</Text>
                        {selMinute === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>AM/PM</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {['AM','PM'].map((ap) => (
                      <TouchableOpacity key={`tap-${ap}`} style={[styles.optionItem, selAmPm === ap && styles.optionSelected]} onPress={() => setSelAmPm(ap)}>
                        <Text style={[styles.optionText, selAmPm === ap && styles.optionTextSelected]}>{ap}</Text>
                        {selAmPm === ap && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Start Time Modal */}
      {showStartTimeModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowStartTimeModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {
              const baseDate = parseISO(formData.startDate);
              let hour24 = (selHour % 12) + (selAmPm === 'PM' ? 12 : 0); if (selAmPm === 'AM' && selHour === 12) hour24 = 0;
              const dateObj = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour24, selMinute, 0);
              updateFormData('startTimeAt', dateObj.toISOString());
              setShowStartTimeModal(false);
            }}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '55%', paddingBottom: 16 }]}> 
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Start Time</Text>
              </View>
              <View style={styles.dateColumnsRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Hour</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getHourOptions().map((h) => (
                      <TouchableOpacity key={`sh-${h}`} style={[styles.optionItem, selHour === h && styles.optionSelected]} onPress={() => setSelHour(h)}>
                        <Text style={[styles.optionText, selHour === h && styles.optionTextSelected]}>{String(h).padStart(2,'0')}</Text>
                        {selHour === h && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Minute</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getMinuteOptions().map((m) => (
                      <TouchableOpacity key={`sm-${m}`} style={[styles.optionItem, selMinute === m && styles.optionSelected]} onPress={() => setSelMinute(m)}>
                        <Text style={[styles.optionText, selMinute === m && styles.optionTextSelected]}>{String(m).padStart(2,'0')}</Text>
                        {selMinute === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>AM/PM</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {['AM','PM'].map((ap) => (
                      <TouchableOpacity key={`sap-${ap}`} style={[styles.optionItem, selAmPm === ap && styles.optionSelected]} onPress={() => setSelAmPm(ap)}>
                        <Text style={[styles.optionText, selAmPm === ap && styles.optionTextSelected]}>{ap}</Text>
                        {selAmPm === ap && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Resolved Time Modal */}
      {showResolvedTimeModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowResolvedTimeModal(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {
              const baseDate = parseISO(formData.endDate);
              let hour24 = (selHour % 12) + (selAmPm === 'PM' ? 12 : 0); if (selAmPm === 'AM' && selHour === 12) hour24 = 0;
              const dateObj = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour24, selMinute, 0);
              updateFormData('resolvedTimeAt', dateObj.toISOString());
              setShowResolvedTimeModal(false);
            }}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCardBottom, { maxHeight: '55%', paddingBottom: 16 }]}> 
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Resolved Time</Text>
              </View>
              <View style={styles.dateColumnsRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Hour</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getHourOptions().map((h) => (
                      <TouchableOpacity key={`rh-${h}`} style={[styles.optionItem, selHour === h && styles.optionSelected]} onPress={() => setSelHour(h)}>
                        <Text style={[styles.optionText, selHour === h && styles.optionTextSelected]}>{String(h).padStart(2,'0')}</Text>
                        {selHour === h && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>Minute</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {getMinuteOptions().map((m) => (
                      <TouchableOpacity key={`rm-${m}`} style={[styles.optionItem, selMinute === m && styles.optionSelected]} onPress={() => setSelMinute(m)}>
                        <Text style={[styles.optionText, selMinute === m && styles.optionTextSelected]}>{String(m).padStart(2,'0')}</Text>
                        {selMinute === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColLabel}>AM/PM</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
                    {['AM','PM'].map((ap) => (
                      <TouchableOpacity key={`rap-${ap}`} style={[styles.optionItem, selAmPm === ap && styles.optionSelected]} onPress={() => setSelAmPm(ap)}>
                        <Text style={[styles.optionText, selAmPm === ap && styles.optionTextSelected]}>{ap}</Text>
                        {selAmPm === ap && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 16 }} />
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
      </>
    )}
  </SafeAreaView>
);
}
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
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
  childInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  childAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  symptomCard: {
    width: (width - 60) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
    position: 'relative',
  },
  activeSymptomCard: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  symptomIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeSymptomText: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  severityCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  activeSeverityCard: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  severityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  activeSeverityTitle: {
    color: '#667eea',
  },
  severityDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationGroup: {
    flex: 0.48,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
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
  durationInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  // submit button styles
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperatureInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    flex: 1,
    marginRight: 12,
  },
  temperatureUnit: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
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
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  activeStatusCard: {
    borderColor: '#10ac84',
    backgroundColor: '#f0fdf4',
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  activeStatusTitle: {
    color: '#10ac84',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  // error box
  errorBox: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fdecea',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBoxText: {
    color: '#d93025',
    flex: 1,
    fontSize: 13,
  },
  // modal styles copied to match AddVaccinationScreen
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCardBottom: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  childRowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  childRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  childRowAge: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  dateColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dateColLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  optionItem: {
    backgroundColor: '#f8f9ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  optionText: {
    color: '#2c3e50',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
});


export default AddSymptomsScreen;
