import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	Image,
	Modal,
	TouchableWithoutFeedback,
	Platform,
	ActivityIndicator,
	TextInput,
	Alert,
	Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { foodService } from '../../services/foodService';
import { mealLogService } from '../../services/mealLogService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');

const AddMealsScreen = ({ navigation }) => {
  const {
    children,
    selectedChild,
    selectedChildId,
    loadingChildren,
    switchingChild,
    selectChild,
  } = useSelectedChild();

  const currentChild = selectedChild;
  const currentChildIndex = React.useMemo(
    () => children.findIndex(c => String(c.id) === String(selectedChildId)),
    [children, selectedChildId]
  );
  const [showChildModal, setShowChildModal] = useState(false);

  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [bootLoading, setBootLoading] = useState(true);
  const [foods, setFoods] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [latestMeals, setLatestMeals] = useState(null);
  const [latestMealsLoading, setLatestMealsLoading] = useState(false);
  const [latestMealsNotFound, setLatestMealsNotFound] = useState(false);
  const [daysUntilNextAllowed, setDaysUntilNextAllowed] = useState(0);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1) - day; // move to Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0,0,0,0);
    return monday;
  });
  const MEAL_SECTIONS = [
    { key: 'breakfast', title: 'Breakfast', icon: 'sunny-outline', grad: ['#f59e0b', '#f97316'] },
    { key: 'mid_morning', title: 'Mid-morning', icon: 'cafe-outline', grad: ['#06b6d4', '#0ea5e9'] },
    { key: 'lunch', title: 'Lunch', icon: 'restaurant-outline', grad: ['#22c55e', '#16a34a'] },
    { key: 'evening_snack', title: 'Evening Snack', icon: 'ice-cream-outline', grad: ['#a78bfa', '#6366f1'] },
    { key: 'dinner', title: 'Dinner', icon: 'moon-outline', grad: ['#667eea', '#764ba2'] },
  ];

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const fmtDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const dd = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  };
  const fmtDisplayDate = (raw) => {
    if (!raw) return '-';
    let d = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(d.getTime()) && typeof raw === 'string') {
      const parts = raw.split('-');
      if (parts.length === 3) {
        const [yy, mm, dd] = parts.map(v => parseInt(v, 10));
        if (Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd)) {
          d = new Date(yy, mm - 1, dd);
        }
      }
    }
    if (Number.isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = monthNames[d.getMonth()] || '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const weekRangeText = () => {
    const start = weekStart;
    const end = addDays(start, 6);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const s = `${String(start.getDate()).padStart(2,'0')} ${monthNames[start.getMonth()]}`;
    const e = `${String(end.getDate()).padStart(2,'0')} ${monthNames[end.getMonth()]}`;
    return `${s} - ${e}`;
  };

  const [selectedGroupByMeal, setSelectedGroupByMeal] = useState({}); // deprecated in simplified UI
  const [selectionsByMeal, setSelectionsByMeal] = useState({});
  const [customByMeal, setCustomByMeal] = useState({});
  const [searchByMeal, setSearchByMeal] = useState({});
  const [notesCommon, setNotesCommon] = useState('');
  const scrollRef = useRef(null);
  const [notesFocused, setNotesFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const itemGradients = [
    ['#667eea', '#764ba2'],
    ['#ff6b6b', '#ee609c'],
    ['#10ac84', '#06d6a0'],
    ['#f59e0b', '#f97316'],
    ['#22c55e', '#16a34a'],
    ['#06b6d4', '#0ea5e9'],
  ];

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

  const loadFoods = useCallback(async (childId) => {
    if (!childId) return;
    setListLoading(true);
    setError('');
    try {
      const data = await foodService.getByChild(childId);
      const arr = Array.isArray(data) ? data : [];
      setFoods(arr);
    } catch (err) {
      setError(err?.message || 'Failed to load foods');
      Alert.alert('Something went wrong', err?.message || 'Failed to load foods');
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadLatestMeals = useCallback(async (childId) => {
    if (!childId) return;
    setLatestMealsLoading(true);
    setLatestMealsNotFound(false);
    try {
      const data = await mealLogService.getLatestMeals(childId);
      setLatestMeals(data || null);
      const d = Number(data?.days_until_next_allowed ?? 0);
      setDaysUntilNextAllowed(Number.isFinite(d) ? d : 0);
    } catch (err) {
      if (err?.status === 404) {
        setLatestMeals(null);
        setDaysUntilNextAllowed(0);
        setLatestMealsNotFound(true);
      } else {
        const msg = err?.message || 'Failed to load latest meals';
        Alert.alert('Something went wrong', msg);
        setLatestMeals(null);
        setDaysUntilNextAllowed(0);
      }
    } finally {
      setLatestMealsLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setBootLoading(false), 500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      const h = e?.endCoordinates?.height || 0;
      setKeyboardHeight(h);
      if (notesFocused) {
        try { scrollRef.current?.scrollToEnd({ animated: true }); } catch (err) {}
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
    };
  }, [notesFocused]);
  useEffect(() => {
    if (!selectedChildId) return;
    loadFoods(selectedChildId);
    loadLatestMeals(selectedChildId);
    setSelectedGroupByMeal({});
    setSelectionsByMeal({});
    setCustomByMeal({});
    setSearchByMeal({});
    setNotesCommon('');
  }, [selectedChildId, loadFoods, loadLatestMeals]);

  const grouped = useMemo(() => {
    const map = new Map();
    foods.forEach(f => {
      const group = f.food_group || 'General';
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(f);
    });
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }, [foods]);

  const canLogMeals = daysUntilNextAllowed === 0;

  const getMealState = (mealKey) => {
    const selections = selectionsByMeal[mealKey] || {};
    const custom = customByMeal[mealKey] || { name: '', grams: '' };
    const q = (searchByMeal[mealKey] || '').trim().toLowerCase();
    const pool = foods.filter(f => !selections[String(f.food_id)]);
    let priority = [];
    let remainder = pool;
    if (q) {
      priority = pool.filter(f => String(f.food_name || '').toLowerCase().includes(q));
      const ids = new Set(priority.map(f => String(f.food_id)));
      remainder = pool.filter(f => !ids.has(String(f.food_id)));
    }
    // Combine and sort: matches first; within each partition, 'all' group goes last
    const combined = priority.concat(remainder);
    const matchSet = new Set(priority.map(f => String(f.food_id)));
    combined.sort((a, b) => {
      const aMatch = matchSet.has(String(a.food_id));
      const bMatch = matchSet.has(String(b.food_id));
      if (aMatch !== bMatch) return aMatch ? -1 : 1; // matches first
      const aAll = String(a.category_age_group || '').toLowerCase() === 'all';
      const bAll = String(b.category_age_group || '').toLowerCase() === 'all';
      if (aAll !== bAll) return aAll ? 1 : -1; // 'all' last within partition
      // optional tiebreaker by name for stable order
      const an = String(a.food_name || '').toLowerCase();
      const bn = String(b.food_name || '').toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
    const matches = combined.slice(0, 100);
    return { selections, custom, matches, query: q };
  };

  const toggleMealSelection = (mealKey, item) => {
    setSelectionsByMeal(prev => {
      const base = prev[mealKey] || {};
      const exists = !!base[item.food_id];
      const next = { ...base };
      if (exists) {
        delete next[item.food_id];
      } else {
        next[item.food_id] = { frequency_num: '', grams: '' };
      }
      return { ...prev, [mealKey]: next };
    });
  };
  const removeMealSelection = (mealKey, foodId) => {
    setSelectionsByMeal(prev => {
      const base = prev[mealKey] || {};
      if (!base[foodId]) return prev;
      const next = { ...base };
      delete next[foodId];
      return { ...prev, [mealKey]: next };
    });
  };
  const updateMealSelection = (mealKey, foodId, patch) => {
    setSelectionsByMeal(prev => {
      const base = prev[mealKey] || {};
      const cur = base[foodId] || { frequency_num: '', grams: '' };
      return { ...prev, [mealKey]: { ...base, [foodId]: { ...cur, ...patch } } };
    });
  };
  const updateCustomForMeal = (mealKey, patch) => setCustomByMeal(prev => ({ ...prev, [mealKey]: { ...(prev[mealKey] || { name: '', grams: '' }), ...patch } }));
  const addCustomForMeal = (mealKey) => {
    const c = customByMeal[mealKey] || { name: '', grams: '' };
    const name = String(c.name || '').trim();
    const freq = parseInt(String(c.frequency_num || '').trim(), 10);
    const grams = parseInt(String(c.grams || '').trim(), 10);
    if (!name) {
      Alert.alert('Missing name', 'Please enter a custom food name.');
      return;
    }
    if (!Number.isFinite(freq) || freq <= 0) {
      Alert.alert('Missing times/week', 'Please enter times per week (> 0).');
      return;
    }
    if (!Number.isFinite(grams) || grams <= 0) {
      Alert.alert('Missing grams', 'Please enter grams (> 0).');
      return;
    }
    const fakeId = `custom_${mealKey}_${Date.now()}`;
    setSelectionsByMeal(prev => {
      const base = prev[mealKey] || {};
      return { ...prev, [mealKey]: { ...base, [fakeId]: { frequency_num: String(freq), grams: String(grams), is_custom: true, name } } };
    });
    setCustomByMeal(prev => ({ ...prev, [mealKey]: { name: '', grams: '' } }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Add Meals"
        onBackPress={() => navigation.goBack()}
      />

      {(((loadingChildren && !children.length) || bootLoading)) ? (
        <LoadingState fullScreen />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {error ? (
              <ErrorState
                message={error}
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

            {/* Weekly intake banner (info only) */}
            <View style={[styles.section, { marginTop: 12 }]}>
              <LinearGradient colors={["#a78bfa", "#6366f1"]} style={styles.weekBanner}>
                <View style={[styles.weekBannerRow, { justifyContent: 'center' }]}>
                  <Text style={styles.weekTitle}>Weekly Intake</Text>
                </View>
                <Text style={styles.weekHint}>Select foods, enter how many times per week and approx grams per time, then confirm each item.</Text>
              </LinearGradient>
            </View>

            <View style={[styles.section, { marginTop: 12 }]}>
              {latestMealsLoading ? (
                <View style={[styles.vaccineCard, { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' }]}>
                  <ActivityIndicator size="small" color="#667eea" />
                  <Text style={{ marginLeft: 8, color: '#4b5563', fontSize: 12 }}>Checking latest meal log...</Text>
                </View>
              ) : (
                <>
                  {latestMeals && canLogMeals && (
                    <View style={[styles.vaccineCard, { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' }]}>
                      <Ionicons name="time-outline" size={18} color="#6366f1" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Last week's meals</Text>
                        <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                          {`Last log date: ${fmtDisplayDate(latestMeals.log_date)}. You can add a new weekly log now.`}
                        </Text>
                      </View>
                    </View>
                  )}
                  {latestMeals && !canLogMeals && (
                    <View style={[styles.vaccineCard, { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}> 
                      <Ionicons name="lock-closed-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Weekly logging locked</Text>
                        <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                          {`You can add the next weekly meals log on or after ${fmtDisplayDate(addDays(new Date(), daysUntilNextAllowed))} (${daysUntilNextAllowed} ${daysUntilNextAllowed === 1 ? 'day' : 'days'} left).`}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          {`Latest log date: ${fmtDisplayDate(latestMeals.log_date)}`}
                        </Text>
                      </View>
                    </View>
                  )}
                  {latestMealsNotFound && (
                    <View style={[styles.vaccineCard, { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}> 
                      <Ionicons name="information-circle-outline" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>No previous meal log</Text>
                        <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                          Start by adding this week's meals below.
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Meal Sections */}
            <View style={styles.section}>
              {listLoading ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <ActivityIndicator color="#667eea" />
                  <Text style={{ marginTop: 6, color: '#7f8c8d' }}>Loading foods...</Text>
                </View>
              ) : (!canLogMeals && latestMeals) ? (
                <View style={[styles.vaccineCard, { width: '100%', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' }]}> 
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 }}>Latest meals log</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                    {`Log date: ${fmtDisplayDate(latestMeals.log_date)}`}
                  </Text>
                  {Array.isArray(latestMeals.items) && latestMeals.items.length > 0 ? (
                    MEAL_SECTIONS.map((m) => {
                      const mealItems = latestMeals.items.filter(it => it.meal_type === m.key);
                      if (!mealItems.length) return null;
                      return (
                        <View key={`latest_${m.key}`} style={{ marginBottom: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name={m.icon} size={16} color="#4f46e5" />
                            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '700', color: '#111827' }}>{m.title}</Text>
                          </View>
                          {mealItems.map((it, idx) => {
                            const title = it.food_name || it.custom_food_name || 'Food';
                            return (
                              <View key={`latest_${m.key}_${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                                <Text style={{ fontSize: 12, color: '#374151', flex: 1 }} numberOfLines={1}>{title}</Text>
                                <Text style={{ fontSize: 12, color: '#4b5563', marginLeft: 8 }}>{`${it.meal_frequency || 0}x / wk`}</Text>
                                <Text style={{ fontSize: 12, color: '#4b5563', marginLeft: 8 }}>{`${it.serving_size_g || 0} g`}</Text>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>No items in latest log.</Text>
                  )}
                </View>
              ) : grouped.length === 0 ? (
                <View style={[styles.vaccineCard, { alignItems: 'center', justifyContent: 'center', width: '100%' }]}> 
                  <Text style={{ color: '#7f8c8d' }}>No foods available.</Text>
                </View>
              ) : (
                MEAL_SECTIONS.map((m, mIdx) => {
                  const { selections, custom, matches } = getMealState(m.key);
                  return (
                    <View key={m.key} style={styles.mealCard}>
                      <LinearGradient colors={m.grad} style={styles.mealHeader}>
                        <Ionicons name={m.icon} size={18} color="#fff" />
                        <Text style={styles.mealHeaderText}>{m.title}</Text>
                        {Object.keys(selections).length > 0 && (
                          <View style={styles.mealCountChip}>
                            <Ionicons name="checkmark-done" size={12} color="#22c55e" />
                            <Text style={styles.mealCountText}>{Object.keys(selections).length} selected</Text>
                          </View>
                        )}
                      </LinearGradient>

                      {/* Selected foods mini chips */}
                      {Object.keys(selections).length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                          {Object.keys(selections).filter(fid => !!selections[fid]?.confirmed).map((fid) => {
                            const meta = selections[fid];
                            const item = foods.find(i => String(i.food_id) === String(fid));
                            const title = item?.food_name || meta?.name || 'Custom';
                            return (
                              <View key={`${m.key}_chip_${fid}`} style={[styles.selChip, { backgroundColor: '#e0f2fe' }]}>
                                <Ionicons name={'checkmark-circle'} size={12} color={'#0284c7'} />
                                <Text style={styles.selChipText} numberOfLines={1}>{title}</Text>
                              </View>
                            );
                          })}
                        </ScrollView>
                      )}

                      {/* Selected foods list with inline inputs */}
                      {Object.keys(selections).length > 0 && (
                        <View style={styles.selectedBox}>
                          {Object.keys(selections).map((fid) => {
                            const meta = selections[fid];
                            const item = foods.find(i => String(i.food_id) === String(fid));
                            const title = item?.food_name || meta?.name || 'Custom';
                            return (
                              <View key={`${m.key}_sel_${fid}`} style={styles.selRow}>
                                <Text style={styles.selTitle} numberOfLines={1}>{title}</Text>
                                <View style={styles.inlineInputs}>
                                  {(() => { const fStr = String(meta.frequency_num || ''); const fVal = parseInt(fStr, 10); const fInvalid = fStr !== '' && (!Number.isFinite(fVal) || fVal <= 0); return (
                                  <View style={[styles.freqNumRow, { flex: 1, marginRight: 8 }, fInvalid && styles.inputInvalid]}> 
                                    <Ionicons name="calendar-outline" size={16} color="#667eea" />
                                    <TextInput
                                      value={String(meta.frequency_num || '')}
                                      onChangeText={(t) => updateMealSelection(m.key, fid, { frequency_num: t.replace(/[^0-9]/g,'').replace(/^0+/, '') })}
                                      keyboardType="numeric"
                                      placeholder="/wk"
                                      placeholderTextColor="#9aa7b2"
                                      style={styles.freqNumInput}
                                    />
                                    <Text style={styles.freqNumUnit}>/wk</Text>
                                  </View>
                                  ); })()}
                                  {(() => { const gStr = String(meta.grams || ''); const gVal = parseInt(gStr, 10); const gInvalid = gStr !== '' && (!Number.isFinite(gVal) || gVal <= 0); return (
                                  <View style={[styles.gramsRow, { flex: 1 }, gInvalid && styles.inputInvalid]}> 
                                    <Ionicons name="scale-outline" size={16} color="#667eea" />
                                    <TextInput
                                      value={String(meta.grams || '')}
                                      onChangeText={(t) => updateMealSelection(m.key, fid, { grams: t.replace(/[^0-9]/g,'').replace(/^0+/, '') })}
                                      keyboardType="numeric"
                                      placeholder="grams per time"
                                      placeholderTextColor="#9aa7b2"
                                      style={styles.gramsInput}
                                    />
                                    <Text style={styles.gramsUnit}>g</Text>
                                  </View>
                                  ); })()}
                                  <TouchableOpacity onPress={() => {
                                    if (!meta.confirmed) {
                                      const fRaw = String(meta.frequency_num || '').trim();
                                      const gRaw = String(meta.grams || '').trim();
                                      const f = parseInt(fRaw, 10);
                                      const g = parseInt(gRaw, 10);
                                      if (!Number.isFinite(f) || f <= 0) {
                                        Alert.alert('Missing times/week', 'Please enter times per week (> 0).');
                                        return;
                                      }
                                      if (!Number.isFinite(g) || g <= 0) {
                                        Alert.alert('Missing grams', 'Please enter grams (> 0).');
                                        return;
                                      }
                                    }
                                    updateMealSelection(m.key, fid, { confirmed: !meta.confirmed });
                                  }} style={[styles.confirmBtn, meta.confirmed && styles.confirmBtnActive]}>
                                    <Ionicons name={meta.confirmed ? 'checkmark' : 'add'} size={16} color={meta.confirmed ? '#fff' : '#10b981'} />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => removeMealSelection(m.key, fid)} style={styles.removeBtn}>
                                    <Ionicons name="close" size={16} color="#ef4444" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Search and add foods */}
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.inputLabel}>Add foods</Text>
                        <View style={styles.inputBox}>
                          <Ionicons name="search-outline" size={18} color="#667eea" />
                          <TextInput
                            value={searchByMeal[m.key] || ''}
                            onChangeText={(t) => setSearchByMeal(prev => ({ ...prev, [m.key]: t }))}
                            placeholder={`Search foods for ${m.title}`}
                            placeholderTextColor="#9aa7b2"
                            style={{ flex: 1, marginLeft: 8, color: '#1f2937' }}
                          />
                        </View>
                        <View style={[styles.resultsScrollWrap]}>
                          <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {matches.map((item, idx) => {
                              const selected = !!selections[item.food_id];
                              return (
                                <View key={`${m.key}_rs_${item.food_id}_${idx}`} style={styles.foodRow}>
                                  <View style={styles.foodLeft}>
                                    <View style={styles.foodEmoji}><Ionicons name={item.is_veg ? 'leaf' : 'fast-food'} size={16} color={item.is_veg ? '#16a34a' : '#ef4444'} /></View>
                                    <View>
                                      <Text style={styles.foodName}>{item.food_name}</Text>
                                      <Text style={styles.foodMeta}>{item.category_age_group || 'infant'}</Text>
                                    </View>
                                  </View>
                                  <TouchableOpacity style={styles.addAction} onPress={() => toggleMealSelection(m.key, item)}>
                                    <Ionicons name={selected ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={selected ? '#667eea' : '#64748b'} />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </ScrollView>
                        </View>
                      </View>

                      {/* (Group chips removed in simplified UI) */}

                      {/* Custom food for this meal */}
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.inputLabel}>Custom food (if not listed)</Text>
                        <View style={styles.inputBox}>
                          <Ionicons name="restaurant-outline" size={18} color="#667eea" />
                          <TextInput
                            value={custom.name || ''}
                            onChangeText={(t) => updateCustomForMeal(m.key, { name: t })}
                            placeholder={`e.g., Homemade ${m.title} item`}
                            placeholderTextColor="#9aa7b2"
                            style={{ flex: 1, marginLeft: 8, color: '#1f2937' }}
                          />
                        </View>
                        <View style={[styles.inlineInputs, { marginTop: 10 }]}> 
                          {(() => { const fStr = String(custom.frequency_num || ''); const fVal = parseInt(fStr, 10); const fInvalid = fStr !== '' && (!Number.isFinite(fVal) || fVal <= 0); return (
                          <View style={[styles.freqNumRow, { flex: 1, marginRight: 8 }, fInvalid && styles.inputInvalid]}> 
                            <Ionicons name="calendar-outline" size={16} color="#667eea" />
                            <TextInput
                              value={String(custom.frequency_num || '')}
                              onChangeText={(t) => updateCustomForMeal(m.key, { frequency_num: t.replace(/[^0-9]/g,'').replace(/^0+/, '') })}
                              keyboardType="numeric"
                              placeholder="/wk"
                              placeholderTextColor="#9aa7b2"
                              style={styles.freqNumInput}
                            />
                            <Text style={styles.freqNumUnit}>/wk</Text>
                          </View>
                          ); })()}
                          {(() => { const gStr = String(custom.grams || ''); const gVal = parseInt(gStr, 10); const gInvalid = gStr !== '' && (!Number.isFinite(gVal) || gVal <= 0); return (
                          <View style={[styles.gramsRow, { flex: 1 }, gInvalid && styles.inputInvalid]}> 
                            <Ionicons name="scale-outline" size={16} color="#667eea" />
                            <TextInput
                              value={String(custom.grams || '')}
                              onChangeText={(t) => updateCustomForMeal(m.key, { grams: t.replace(/[^0-9]/g,'').replace(/^0+/, '') })}
                              keyboardType="numeric"
                              placeholder="grams per time"
                              placeholderTextColor="#9aa7b2"
                              style={styles.gramsInput}
                            />
                            <Text style={styles.gramsUnit}>g</Text>
                          </View>
                          ); })()}
                          <TouchableOpacity onPress={() => addCustomForMeal(m.key)} style={styles.addCustomWrap}>
                            <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.addCustomBtn}>
                              <Ionicons name="add" size={16} color="#fff" />
                              <Text style={styles.addBtnText}>Add</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Notes removed per section; using a common notes field below */}
                    </View>
                  );
                })
              )}
            </View>

            {/* Common Notes Section */}
            {canLogMeals && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="create-outline" size={18} color="#667eea" />
                  <TextInput
                    value={notesCommon}
                    onChangeText={setNotesCommon}
                    placeholder="Any notes for this week's meals"
                    placeholderTextColor="#9aa7b2"
                    style={{ flex: 1, marginLeft: 8, color: '#1f2937' }}
                    multiline
                    onFocus={() => { setNotesFocused(true); try { scrollRef.current?.scrollToEnd({ animated: true }); } catch (e) {} }}
                    onBlur={() => setNotesFocused(false)}
                  />
                </View>
              </View>
            )}

            <View style={{ height: notesFocused && keyboardHeight > 0 ? keyboardHeight + 24 : 100 }} />
          </ScrollView>

          {/* Save Weekly Log */}
          {canLogMeals && (
          <View style={styles.saveBar}>
            <TouchableOpacity style={{ flex: 1 }} disabled={submitting} onPress={async () => {
            try {
                if (!selectedChildId) {
                  Alert.alert('Missing child', 'Please select a child first.');
                  return;
                }
                const items = [];
                const errors = [];
                MEAL_SECTIONS.forEach(m => {
                  const sel = selectionsByMeal[m.key] || {};
                  Object.keys(sel).forEach(fid => {
                    const meta = sel[fid] || {};
                    if (!meta.confirmed) return;
                    const gramsRaw = String(meta.grams || '').trim();
                    const gramsInt = parseInt(gramsRaw, 10);
                    const freqRaw = String(meta.frequency_num || '').trim();
                    const freqInt = parseInt(freqRaw, 10);
                    if (!freqRaw || !Number.isFinite(freqInt) || freqInt <= 0) {
                      const title = foods.find(i => String(i.food_id) === String(fid))?.food_name || meta?.name || 'Item';
                      errors.push(`• ${m.title}: "${title}" must have times/week > 0`);
                      return;
                    }
                    if (!gramsRaw || !Number.isFinite(gramsInt) || gramsInt <= 0) {
                      const title = foods.find(i => String(i.food_id) === String(fid))?.food_name || meta?.name || 'Item';
                      errors.push(`• ${m.title}: "${title}" must have grams > 0`);
                      return;
                    }
                    if (meta.is_custom || String(fid).startsWith('custom_')) {
                      const nm = String(meta.name || '').trim();
                      if (!nm) {
                        errors.push(`• ${m.title}: Custom item must have a name`);
                        return;
                      }
                      items.push({ meal_type: m.key, custom_food_name: nm, serving_size_g: gramsInt, meal_frequency: freqInt });
                    } else {
                      const idNum = Number(fid);
                      if (!Number.isFinite(idNum) || idNum <= 0) {
                        errors.push(`• ${m.title}: Invalid food selection`);
                        return;
                      }
                      items.push({ meal_type: m.key, food_id: idNum, serving_size_g: gramsInt, meal_frequency: freqInt });
                    }
                  });
                });
                if (errors.length) {
                  Alert.alert('Please fix the following', errors.slice(0, 12).join('\n'));
                  return;
                }
                if (!items.length) {
                  Alert.alert('Nothing to submit', 'Please confirm at least one item with grams > 0.');
                  return;
                }
                // Require at least one item for each meal section
                const missingSections = MEAL_SECTIONS.filter(m => !items.some(it => it.meal_type === m.key));
                if (missingSections.length) {
                  const names = missingSections.map(m => m.title).join(', ');
                  Alert.alert('Missing meals', `Please add at least one item for: ${names}.`);
                  return;
                }
                const d = new Date();
                const payload = {
                  log_date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
                  ...(notesCommon?.trim() ? { notes: notesCommon.trim() } : {}),
                  items,
                };
                setSubmitting(true);
                await mealLogService.postMeals(selectedChildId, payload);
                Alert.alert('Success', 'Meals submitted successfully.', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
                setSelectionsByMeal({});
                setCustomByMeal({});
                setSearchByMeal({});
                setNotesCommon('');
              } catch (e) {
                const msg = e?.message || 'Failed to submit meals. Please try again.';
                Alert.alert('Submission failed', msg);
              } finally {
                setSubmitting(false);
              }
            }}>
              <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.saveBtn}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Weekly Meals</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          )}

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
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f3f4',
  },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8f9ff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', padding: 10, borderRadius: 10, marginHorizontal: 20, marginTop: 16 },
  errorBoxText: { color: '#b91c1c' },

  childSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#eef2ff' },
  childInfo: { flexDirection: 'row', alignItems: 'center' },
  childAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  childAvatarImg: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  childInitial: { color: '#667eea', fontWeight: '700' },
  childName: { fontSize: 16, color: '#2c3e50', fontWeight: '600' },
  childAge: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },

  weekBanner: { borderRadius: 16, padding: 14 },
  weekBannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  weekTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  weekSub: { color: '#e0e7ff', fontWeight: '700', marginTop: 2 },
  weekHint: { color: '#eef2ff', marginTop: 10, fontSize: 12 },

  mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#eef2ff' },
  mealHeader: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  mealHeaderText: { color: '#fff', fontWeight: '800', marginLeft: 8 },
  groupChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  groupChipActive: { backgroundColor: '#667eea' },
  groupChipText: { marginLeft: 6, fontSize: 12, color: '#64748b', fontWeight: '700', maxWidth: 140 },

  vaccineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },

  foodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eef2ff' },
  foodLeft: { flexDirection: 'row', alignItems: 'center' },
  foodEmoji: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  foodMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addAction: { padding: 6 },

  addBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  addCustomBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  modalOverlay: { flex: 1 },
  modalCardBottom: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },

  childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  childRowAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  childRowName: { fontSize: 14, color: '#1f2937', fontWeight: '600' },
  childRowAge: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  inputLabel: { fontSize: 13, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#eef2ff' },
  switchIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },

  submitButtonGradient: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  selectionMetaRow: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#eef2ff', marginBottom: 8 },
  freqNumRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#eef2ff' },
  freqNumInput: { flex: 1, marginLeft: 8, color: '#1f2937' },
  freqNumUnit: { color: '#64748b', fontWeight: '700', marginLeft: 6 },
  gramsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#eef2ff', marginTop: 8 },
  gramsInput: { flex: 1, marginLeft: 8, color: '#1f2937' },
  gramsUnit: { color: '#64748b', fontWeight: '700', marginLeft: 6 },

  selChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  selChipText: { marginLeft: 6, color: '#4f46e5', fontWeight: '700', maxWidth: 160 },

  selectedBox: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#eef2ff', padding: 10, marginTop: 10 },
  selRow: { marginBottom: 10 },
  selTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  inlineInputs: { flexDirection: 'row', alignItems: 'center' },
  removeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', marginLeft: 8 },
  confirmBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.12)', marginLeft: 8 },
  confirmBtnActive: { backgroundColor: '#10b981' },
  resultsScrollWrap: { borderWidth: 1, borderColor: '#eef2ff', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', marginTop: 8 },
  addCustomWrap: { marginLeft: 10 },

  mealCountChip: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  mealCountText: { color: '#fff', fontWeight: '700', fontSize: 11, marginLeft: 4 },

  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#eef2ff' },
  saveBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveBtnText: { color: '#fff', fontWeight: '800', marginLeft: 8 },
  inputInvalid: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
});

export default AddMealsScreen;

// helper builds weekly payload for preview/save wiring
function buildWeeklyPayload() {
  // this depends on closures in component; so we will redefine inside component via Function, but here we inject via global ref
  return {};
}
