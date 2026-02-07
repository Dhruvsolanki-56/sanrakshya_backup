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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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
    { key: 'cough', label: 'Cough', icon: 'medical-bag', color: '#ffa726' },
    { key: 'sore_throat', label: 'Sore Throat', icon: 'emoticon-sad', color: '#ab47bc' },
    { key: 'headache', label: 'Headache', icon: 'head-snowflake', color: '#667eea' },
    { key: 'stomach_ache', label: 'Stomach Ache', icon: 'human-handsdown', color: '#10ac84' },
    { key: 'nausea', label: 'Nausea', icon: 'emoticon-sick', color: '#ffa726' },
    { key: 'vomiting', label: 'Vomiting', icon: 'alert-circle', color: '#ff6b6b' },
    { key: 'diarrhea', label: 'Diarrhea', icon: 'alert', color: '#ff9800' },
    { key: 'rash', label: 'Rash', icon: 'bandage', color: '#e91e63' },
    { key: 'fatigue', label: 'Fatigue', icon: 'bed', color: '#9c27b0' },
    { key: 'loss_of_appetite', label: 'Loss of Appetite', icon: 'food-off', color: '#795548' },
  ];

  // Children & selection
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

  // Centralized refresh for illnesses list
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

  // Date picker modal state
  const [showDateModal, setShowDateModal] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('startDate');
  const [selYear, setSelYear] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const [selDay, setSelDay] = useState(null);

  // Temperature/Time modal state
  const [showTempModal, setShowTempModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState('startTimeAt'); // or 'temperatureAt'
  const [tempInt, setTempInt] = useState(37);
  const [tempDec, setTempDec] = useState(0);
  const [selHour, setSelHour] = useState(12);
  const [selMinute, setSelMinute] = useState(0);
  const [selAmPm, setSelAmPm] = useState('AM');

  const today = new Date();
  const tenYearsAgo = new Date(new Date().setFullYear(today.getFullYear() - 10));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const severityLevels = [
    { id: 'Mild', color: '#10ac84', description: 'Minor discomfort' },
    { id: 'Moderate', color: '#ffa726', description: 'Noticeable symptoms' },
    { id: 'Severe', color: '#ff6b6b', description: 'Significant distress' },
    { id: 'Critical', color: '#e74c3c', description: 'Requires immediate attention' },
  ];

  const severityStyles = {
    Mild: { icon: 'emoticon-happy-outline', tint: '#10ac84', gradient: ['#dcfce7', '#bbf7d0'] },
    Moderate: { icon: 'alert-circle-outline', tint: '#f59e0b', gradient: ['#fff7ed', '#ffedd5'] },
    Severe: { icon: 'alert-outline', tint: '#ef4444', gradient: ['#fee2e2', '#fecaca'] },
    Critical: { icon: 'medical-bag', tint: '#dc2626', gradient: ['#ffe4e6', '#fecdd3'] },
  };

  // Helpers
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
    return `${years}y ${months}m`;
  };

  const getAgeTextForChild = (child) => {
    if (!child) return '';
    const years = child.ageYears ?? 0;
    const months = child.ageMonths ?? 0;
    if (child.ageYears != null) return `${years}y ${months}m`;
    return formatAgeText(child.dobRaw);
  };

  const getHourOptions = () => Array.from({ length: 12 }, (_, i) => i + 1);
  const getMinuteOptions = () => Array.from({ length: 60 }, (_, i) => i);
  const getTempIntOptions = () => Array.from({ length: 12 }, (_, i) => 34 + i); // 34-45
  const getTempDecOptions = () => Array.from({ length: 10 }, (_, i) => i); // 0-9

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
  const fmtDisplayDateTime = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mon = monthNames[dt.getMonth()];
    const yyyy = dt.getFullYear();
    let hrs = dt.getHours();
    const mins = dt.getMinutes();
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12; if (hrs === 0) hrs = 12;
    const mm = String(mins).padStart(2, '0');
    return `${dd} ${mon}, ${hrs}:${mm} ${ampm}`;
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
    if (selYear === tenYearsAgo.getFullYear() && selMonth === (tenYearsAgo.getMonth() + 1)) {
      minDay = Math.max(minDay, tenYearsAgo.getDate());
    }
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
    refreshIllnesses(selectedChildId);
  }, [selectedChildId, refreshIllnesses]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => ({
      ...prev,
      symptoms: { ...prev.symptoms, [key]: !prev.symptoms[key] }
    }));
  };

  const handleResolveFromModal = async () => {
    if (!modalIllness) return;
    if (!modalIllness.is_current) { setShowIllnessModal(false); return; }
    try {
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

    const isCurrent = !formData.resolved;
    const temperature_c = Number.isFinite(parseFloat(formData.temperatureC))
      ? parseFloat(formData.temperatureC)
      : 37.0;

    const buildIso = (dateStr, timeIso) => {
      const baseDate = parseISO(dateStr);
      const time = timeIso ? new Date(timeIso) : new Date();
      const h = time.getHours();
      const m = time.getMinutes();
      const dt = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m, 0);
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
      resolved_by: isCurrent ? null : (formData.resolvedBy === 'Doctor consult' ? 'Doctor' : 'Parent'),
      notes: formData.notes || '',
    };

    try {
      await userService.createIllness(childId, payload);
      await refreshIllnesses(childId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Symptoms Recorded', 'Symptoms have been logged successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const status = err?.status;
      const data = err?.data;
      let message = 'Failed to log symptoms';
      if (status === 422) {
        const details = typeof data === 'object' ? (data.detail || data.message || JSON.stringify(data)) : String(data || 'Validation Error');
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={StyleSheet.absoluteFill} />

        {/* Background Artifacts */}
        <MaterialCommunityIcons name="pill" size={240} color="#6366F1" style={styles.bgArtifactTop} />
        <MaterialCommunityIcons name="thermometer" size={280} color="#10ac84" style={styles.bgArtifactBottom} />

        <SafeAreaView style={{ flex: 1 }}>
          <ScreenHeader title="Log Symptoms" onBackPress={() => navigation.goBack()} />

          {(loadingChildren && !children.length) ? (
            <LoadingState fullScreen />
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

              {childrenError && <ErrorState message={childrenError} fullWidth />}

              {/* Child Card */}
              <TouchableOpacity style={styles.childCard} onPress={() => setShowChildModal(true)} activeOpacity={0.9}>
                <View style={styles.childRow}>
                  {currentChild?.avatar ? (
                    <Image source={{ uri: currentChild.avatar }} style={styles.childAvatar} />
                  ) : (
                    <View style={[styles.childAvatar, { backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6' }}>{(currentChild?.name || '').charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.childName}>{currentChild?.name || 'Select Child'}</Text>
                    <Text style={styles.childDetail}>{getAgeTextForChild(currentChild)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-down-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>

              {/* Illness History */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent History</Text>
                {illnessesLoading ? (
                  <ActivityIndicator size="small" color="#6366F1" style={{ alignSelf: 'flex-start', marginLeft: 20 }} />
                ) : illnesses.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateText}>No recent illnesses recorded.</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {illnesses.map((it, idx) => {
                      const sev = it?.severity || 'Mild';
                      const meta = severityStyles[sev] || severityStyles.Mild;
                      const statusPillBg = it.is_current ? '#EEF2FF' : '#ECFDF5';
                      const statusPillText = it.is_current ? '#4F46E5' : '#059669';
                      const statusText = it.is_current ? 'Ongoing' : 'Resolved';

                      // Find matching symptoms
                      const matchedSymptoms = Object.keys(formData.symptoms).filter(k => it[k]);
                      const displaySymptoms = matchedSymptoms.slice(0, 2).map(k => symptomMeta.find(s => s.key === k)?.label || k);
                      const surplus = matchedSymptoms.length - displaySymptoms.length;

                      return (
                        <TouchableOpacity key={String(it.id ?? idx)} activeOpacity={0.9} onPress={() => { setModalIllness(it); setResolveMethod('Home remedy'); setResolveTimeISO(new Date().toISOString()); setShowIllnessModal(true); }}>
                          <View style={styles.historyCard}>
                            <View style={styles.historyCardHeader}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <View style={[styles.sevIcon, { backgroundColor: meta.tint }]}>
                                    <MaterialCommunityIcons name={meta.icon} size={16} color="#FFF" />
                                  </View>
                                  <Text style={[styles.sevText, { marginLeft: 6 }]}>{sev}</Text>
                                </View>
                                <View style={[styles.statusPill, { backgroundColor: statusPillBg, marginTop: 0 }]}>
                                  <Text style={[styles.statusText, { color: statusPillText }]}>{statusText}</Text>
                                </View>
                              </View>

                              <Text style={styles.dateTextSmall}>Started: {fmtDisplayDateTime(it.symptom_start_date)}</Text>
                              {it.temperature_c ? (
                                <Text style={styles.tempTextSmall}>Temp: {it.temperature_c}°C</Text>
                              ) : null}

                              {displaySymptoms.length > 0 && (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                                  {displaySymptoms.map((s, i) => (
                                    <View key={i} style={styles.symptomChip}>
                                      <Text style={styles.symptomChipText}>{s}</Text>
                                    </View>
                                  ))}
                                  {surplus > 0 && (
                                    <View style={styles.symptomChip}>
                                      <Text style={styles.symptomChipText}>+{surplus}</Text>
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Symptom Grid */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Symptoms</Text>
                <View style={styles.symptomsGrid}>
                  {symptomMeta.map((symptom) => {
                    const isActive = formData.symptoms[symptom.key];
                    return (
                      <TouchableOpacity
                        key={symptom.key}
                        style={[styles.symptomCard, isActive && styles.symptomCardActive]}
                        onPress={() => toggleSymptom(symptom.key)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={isActive ? [symptom.color, symptom.color] : ['#FFFFFF', '#FFFFFF']}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                        <MaterialCommunityIcons
                          name={symptom.icon}
                          size={28}
                          color={isActive ? '#FFF' : symptom.color}
                          style={{ marginBottom: 8 }}
                        />
                        <Text style={[styles.symptomText, isActive && styles.symptomTextActive]}>{symptom.label}</Text>
                        {isActive && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={12} color={symptom.color} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Severity */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Severity</Text>
                <View style={styles.severityContainer}>
                  {severityLevels.map((level) => {
                    const isActive = formData.severity === level.id;
                    return (
                      <TouchableOpacity
                        key={level.id}
                        style={[styles.severityBtn, isActive && { backgroundColor: level.color, borderColor: level.color }]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          updateFormData('severity', level.id);
                        }}
                      >
                        <Text style={[styles.severityBtnText, isActive && { color: '#FFF' }]}>{level.id}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Temperature & Dates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Temperature Details</Text>
                <View style={styles.detailCard}>
                  {/* Temperature */}
                  <TouchableOpacity style={styles.detailRow} onPress={() => setShowTempModal(true)}>
                    <View style={styles.detailIconBox}><MaterialCommunityIcons name="thermometer" size={20} color="#F59E0B" /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailLabel}>Temperature</Text>
                      <Text style={styles.detailValue}>{formData.temperatureC} °C</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                  <View style={styles.divider} />

                  {/* Measured Date */}
                  <TouchableOpacity style={styles.detailRow} onPress={() => { setDatePickerTarget('temperatureAt'); setSelectionsFromISO(formData.temperatureAt); setShowDateModal(true); }}>
                    <View style={styles.detailIconBox}><MaterialCommunityIcons name="calendar-month" size={20} color="#6366F1" /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailLabel}>Measured Date</Text>
                      <Text style={styles.detailValue}>{fmtDisplay(formData.temperatureAt)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                  <View style={styles.divider} />

                  {/* Measured Time */}
                  <TouchableOpacity style={styles.detailRow} onPress={() => {
                    const base = formData.temperatureAt ? new Date(formData.temperatureAt) : new Date();
                    let hr = base.getHours(); const ap = hr >= 12 ? 'PM' : 'AM'; hr = hr % 12 || 12;
                    setSelHour(hr); setSelMinute(base.getMinutes()); setSelAmPm(ap);
                    setTimePickerTarget('temperatureAt'); setShowTimeModal(true);
                  }}>
                    <View style={styles.detailIconBox}><MaterialCommunityIcons name="clock-outline" size={20} color="#8B5CF6" /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailLabel}>Measured Time</Text>
                      <Text style={styles.detailValue}>{fmtDisplayDateTime(formData.temperatureAt).split(', ')[1] || ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Illness Timeline</Text>
                <View style={styles.detailCard}>
                  {/* Start Date */}
                  <TouchableOpacity style={styles.detailRow} onPress={() => { setDatePickerTarget('startDate'); setSelectionsFromISO(formData.startDate); setShowDateModal(true); }}>
                    <View style={styles.detailIconBox}><MaterialCommunityIcons name="calendar-start" size={20} color="#10B981" /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailLabel}>Start Date</Text>
                      <Text style={styles.detailValue}>{fmtDisplay(formData.startDate)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                  <View style={styles.divider} />

                  {/* Start Time */}
                  <TouchableOpacity style={styles.detailRow} onPress={() => {
                    const base = formData.startTimeAt ? new Date(formData.startTimeAt) : new Date();
                    let hr = base.getHours(); const ap = hr >= 12 ? 'PM' : 'AM'; hr = hr % 12 || 12;
                    setSelHour(hr); setSelMinute(base.getMinutes()); setSelAmPm(ap);
                    setTimePickerTarget('startTimeAt'); setShowTimeModal(true);
                  }}>
                    <View style={styles.detailIconBox}><MaterialCommunityIcons name="clock-start" size={20} color="#EC4899" /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailLabel}>Start Time</Text>
                      <Text style={styles.detailValue}>{fmtDisplayDateTime(formData.startTimeAt).split(', ')[1] || ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.detailCard, { marginTop: 16 }]}>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add generic notes here..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={formData.notes}
                    onChangeText={(t) => updateFormData('notes', t)}
                  />
                </View>
              </View>

            </ScrollView>
          )}

          {/* Save Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
              <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.saveGradient}>
                <Text style={styles.saveText}>Log Symptoms</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* --- MODALS --- */}

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

          {/* Date Picker Modal */}
          <Modal visible={showDateModal} transparent animationType="slide">
            <View style={styles.modalCenteredOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {datePickerTarget === 'startDate' ? 'Start Date' : datePickerTarget === 'endDate' ? 'End Date' : 'Measured Date'}
                </Text>
                <View style={styles.pickerRow}>
                  {/* Simplified Pickers */}
                  <ScrollView style={{ height: 150, width: 80 }}>
                    {getYearOptions().map(y => (
                      <TouchableOpacity key={y} onPress={() => setSelYear(y)} style={{ padding: 10, backgroundColor: selYear === y ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontWeight: selYear === y ? 'bold' : 'normal' }}>{y}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                  <ScrollView style={{ height: 150, width: 80 }}>
                    {getMonthOptions().map(m => (
                      <TouchableOpacity key={m} onPress={() => setSelMonth(m)} style={{ padding: 10, backgroundColor: selMonth === m ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontWeight: selMonth === m ? 'bold' : 'normal' }}>{monthNames[m - 1]}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                  <ScrollView style={{ height: 150, width: 80 }}>
                    {getDayOptions().map(d => (
                      <TouchableOpacity key={d} onPress={() => setSelDay(d)} style={{ padding: 10, backgroundColor: selDay === d ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontWeight: selDay === d ? 'bold' : 'normal' }}>{d}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <TouchableOpacity style={styles.modalBtn} onPress={() => {
                  const d = new Date(selYear, selMonth - 1, selDay);
                  // If targeting a full ISO field (like temperatureAt), preserve time
                  if (datePickerTarget === 'temperatureAt') {
                    const old = new Date(formData.temperatureAt);
                    d.setHours(old.getHours(), old.getMinutes());
                    updateFormData(datePickerTarget, d.toISOString());
                  } else {
                    updateFormData(datePickerTarget, fmt(d));
                  }
                  setShowDateModal(false);
                }}>
                  <Text style={styles.modalBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Time Picker Modal */}
          <Modal visible={showTimeModal} transparent animationType="slide">
            <View style={styles.modalCenteredOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <View style={styles.pickerRow}>
                  <ScrollView style={{ height: 150, width: 60 }}>
                    {getHourOptions().map(h => (
                      <TouchableOpacity key={h} onPress={() => setSelHour(h)} style={{ padding: 10, backgroundColor: selHour === h ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontWeight: selHour === h ? 'bold' : 'normal' }}>{h}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                  <ScrollView style={{ height: 150, width: 60 }}>
                    {getMinuteOptions().map(m => (
                      <TouchableOpacity key={m} onPress={() => setSelMinute(m)} style={{ padding: 10, backgroundColor: selMinute === m ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontWeight: selMinute === m ? 'bold' : 'normal' }}>{String(m).padStart(2, '0')}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                  <ScrollView style={{ height: 150, width: 60 }}>
                    {['AM', 'PM'].map(ap => (
                      <TouchableOpacity key={ap} onPress={() => setSelAmPm(ap)} style={{ padding: 10, backgroundColor: selAmPm === ap ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontWeight: selAmPm === ap ? 'bold' : 'normal' }}>{ap}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <TouchableOpacity style={styles.modalBtn} onPress={() => {
                  let h = selHour;
                  if (selAmPm === 'PM' && h !== 12) h += 12;
                  if (selAmPm === 'AM' && h === 12) h = 0;

                  const targetIso = formData[timePickerTarget] || new Date().toISOString();
                  const d = new Date(targetIso);
                  d.setHours(h, selMinute);

                  updateFormData(timePickerTarget, d.toISOString());
                  setShowTimeModal(false);
                }}>
                  <Text style={styles.modalBtnText}>Set Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Temp Value Modal */}
          <Modal visible={showTempModal} transparent animationType="slide">
            <View style={styles.modalCenteredOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Body Temperature (°C)</Text>
                <View style={styles.pickerRow}>
                  <ScrollView style={{ height: 150, width: 60 }}>
                    {getTempIntOptions().map(i => (
                      <TouchableOpacity key={i} onPress={() => setTempInt(i)} style={{ padding: 10, backgroundColor: tempInt === i ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontSize: 18, fontWeight: tempInt === i ? 'bold' : 'normal' }}>{i}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={{ fontSize: 24, alignSelf: 'center' }}>.</Text>
                  <ScrollView style={{ height: 150, width: 60 }}>
                    {getTempDecOptions().map(d => (
                      <TouchableOpacity key={d} onPress={() => setTempDec(d)} style={{ padding: 10, backgroundColor: tempDec === d ? '#EEF2FF' : 'transparent' }}><Text style={{ textAlign: 'center', fontSize: 18, fontWeight: tempDec === d ? 'bold' : 'normal' }}>{d}</Text></TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <TouchableOpacity style={styles.modalBtn} onPress={() => {
                  updateFormData('temperatureC', `${tempInt}.${tempDec}`);
                  setShowTempModal(false);
                }}>
                  <Text style={styles.modalBtnText}>Set Temperature</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Resolution Modal */}
          <Modal visible={showIllnessModal} transparent animationType="slide">
            <View style={styles.modalCenteredOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Resolve Symptom?</Text>
                <Text style={{ textAlign: 'center', color: '#64748B', marginBottom: 20 }}>
                  Mark {modalIllness?.is_current ? 'as resolved' : 'status'}
                </Text>
                {modalIllness?.is_current && (
                  <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    <TouchableOpacity style={[styles.optionBtn, resolveMethod === 'Home remedy' && styles.optionBtnActive]} onPress={() => setResolveMethod('Home remedy')}>
                      <Text style={resolveMethod === 'Home remedy' ? styles.optionTextActive : styles.optionText}>Home Remedy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.optionBtn, resolveMethod === 'Doctor consult' && styles.optionBtnActive]} onPress={() => setResolveMethod('Doctor consult')}>
                      <Text style={resolveMethod === 'Doctor consult' ? styles.optionTextActive : styles.optionText}>Doctor</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9', flex: 1 }]} onPress={() => setShowIllnessModal(false)}>
                    <Text style={[styles.modalBtnText, { color: '#64748B' }]}>Cancel</Text>
                  </TouchableOpacity>
                  {modalIllness?.is_current && (
                    <TouchableOpacity style={[styles.modalBtn, { flex: 1 }]} onPress={handleResolveFromModal}>
                      <Text style={styles.modalBtnText}>Resolve</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  bgArtifactTop: { position: 'absolute', top: -50, right: -50, opacity: 0.05, transform: [{ rotate: '-20deg' }] },
  bgArtifactBottom: { position: 'absolute', bottom: -50, left: -50, opacity: 0.05, transform: [{ rotate: '20deg' }] },

  scrollView: { flex: 1 },

  childCard: {
    marginHorizontal: 20, marginVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.85)', padding: 16, borderRadius: 24,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4,
    borderWidth: 1, borderColor: '#FFF'
  },
  childRow: { flexDirection: 'row', alignItems: 'center' },
  childAvatar: { width: 48, height: 48, borderRadius: 24 },
  childName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  childDetail: { fontSize: 13, color: '#64748B', marginTop: 2 },

  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },

  historyCard: {
    width: 220, // Wider for details
    backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginRight: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2
  },
  historyCardHeader: { flex: 1 },
  sevIcon: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sevText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  dateTextSmall: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },
  tempTextSmall: { fontSize: 11, color: '#64748B', marginTop: 0 },
  symptomChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 4, marginTop: 4 },
  symptomChipText: { fontSize: 10, color: '#475569', fontWeight: '500' },

  emptyStateCard: { padding: 20, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, alignItems: 'center' },
  emptyStateText: { color: '#94A3B8' },

  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  symptomCard: {
    width: '31%', aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    overflow: 'hidden', borderWidth: 1, borderColor: 'transparent'
  },
  symptomCardActive: { borderColor: 'rgba(255,255,255,0.5)', transform: [{ scale: 1.02 }] },
  symptomText: { fontSize: 12, color: '#64748B', fontWeight: '600', textAlign: 'center' },
  symptomTextActive: { color: '#FFF' },
  checkBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  severityContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 4, borderRadius: 16 },
  severityBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  severityBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  detailCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  detailIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  detailValue: { fontSize: 16, color: '#1E293B', fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 68 },
  notesInput: { height: 100, padding: 16, fontSize: 15, color: '#1E293B', textAlignVertical: 'top' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(248,250,252,0.95)' },
  saveBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1E293B' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  sheetAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  sheetName: { flex: 1, fontSize: 16, color: '#1E293B' },

  modalCenteredOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 10 },
  modalBtn: { backgroundColor: '#6366F1', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  optionBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  optionBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  optionText: { color: '#64748B', fontWeight: '600' },
  optionTextActive: { color: '#6366F1', fontWeight: '700' },
});

export default AddSymptomsScreen;
