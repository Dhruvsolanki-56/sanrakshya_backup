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
	Modal,
	TouchableWithoutFeedback,
	Image,
	Platform,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { milestonesService } from '../../services/milestonesService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');

const AddMilestoneScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    childName: '',
    milestoneName: '', // selected category is milestone_name
    date: new Date().toISOString().split('T')[0],
    notes: '',
    subFeatures: [], // selected sub features
    special: false,
    difficulty: 'Normal',
  });

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

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [disabledNames, setDisabledNames] = useState([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [readyToFetch, setReadyToFetch] = useState(false);
  const [selYear, setSelYear] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const [selDay, setSelDay] = useState(null);
  const today = new Date();
  const tenYearsAgo = new Date(new Date().setFullYear(today.getFullYear() - 10));
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const itemGradients = [
    ['#667eea', '#764ba2'],
    ['#ff6b6b', '#ee609c'],
    ['#10ac84', '#06d6a0'],
    ['#f59e0b', '#f97316'],
    ['#22c55e', '#16a34a'],
    ['#06b6d4', '#0ea5e9'],
  ];

  const updateFormData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

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

  const loadMilestones = useCallback(async (childId) => {
    if (!childId) return;
    setListLoading(true);
    setError('');
    try {
      const data = await milestonesService.getByChild(childId);
      const arr = Array.isArray(data) ? data : [];
      setMilestones(arr);
    } catch (err) {
      setError(err?.message || 'Failed to load milestones');
      Alert.alert('Something went wrong', err?.message || 'Failed to load milestones');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedChildId) {
      setMilestones([]);
      setReadyToFetch(false);
      return;
    }
    setReadyToFetch(true);
    loadMilestones(selectedChildId);
  }, [selectedChildId, loadMilestones]);
  useEffect(() => {
    const t = setTimeout(() => setBootLoading(false), 500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!readyToFetch) return;
    const child = currentChild;
    if (child) {
      updateFormData('childName', child.name);
      // reset selection state on child change
      setShowChildModal(false);
      setShowDateModal(false);
      setDisabledNames([]);
      setFormData(prev => ({
        ...prev,
        milestoneName: '',
        subFeatures: [],
        date: new Date().toISOString().split('T')[0],
        special: false,
        difficulty: 'Normal',
      }));
    }
  }, [currentChild, readyToFetch]);

  const groupedByName = useMemo(() => {
    const map = new Map();
    milestones.forEach(item => {
      const m = item?.milestone || {};
      const name = m.milestone_name || 'Milestone';
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(item);
    });
    // Flatten to unique milestones by name, keeping first for sub-features/flags
    const grouped = Array.from(map.entries()).map(([name, items]) => ({ name, items }));
    return grouped.map(g => {
      const first = map.get(g.name)[0] || {};
      const m = first?.milestone || {};
      return {
        milestone_name: g.name,
        id: m.id || m.milestone_id || m.milestoneId || null,
        key: g.name + '_' + (m.category || 'general'),
        category: m.category || '',
        sub1: m.sub_feature_1 || null,
        sub2: m.sub_feature_2 || null,
        sub3: m.sub_feature_3 || null,
        is_archived: !!first.is_archived,
        special_milestone: !!first.special_milestone,
      };
    });
  }, [milestones]);

  useEffect(() => {
    if (!formData.milestoneName && groupedByName.length) {
      const first = groupedByName.find(m => !m.is_archived);
      if (first) {
        updateFormData('milestoneName', first.milestone_name);
      }
    }
  }, [groupedByName]);

  useEffect(() => {
    if (formData.milestoneName) {
      updateFormData('difficulty', 'Normal');
    }
  }, [formData.milestoneName]);

  const hasNonArchived = useMemo(() => groupedByName.some(m => !m.is_archived), [groupedByName]);
  const allArchived = useMemo(() => groupedByName.length > 0 && groupedByName.every(m => m.is_archived), [groupedByName]);

  const selectMilestone = (name, disabled) => {
    if (disabled) return;
    updateFormData('milestoneName', name);
    updateFormData('subFeatures', []);
    updateFormData('special', false);
    updateFormData('difficulty', 'Normal');
  };

  const toggleSubFeature = (sf) => {
    if (!sf) return;
    setFormData(prev => {
      const base = Array.isArray(prev.subFeatures) ? prev.subFeatures : [];
      const exists = base.includes(sf);
      const next = exists ? base.filter(x => x !== sf) : [...base, sf];
      return { ...prev, subFeatures: next };
    });
  };

  const handleSave = async () => {
    if (submitting) return;
    if (!currentChild) {
      Alert.alert('Missing Child', 'Please select a child first.');
      return;
    }
    if (!formData.milestoneName) {
      Alert.alert('Select Milestone', 'Please select a milestone to continue.');
      return;
    }
    if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      Alert.alert('Invalid Date', 'Please select a valid date.');
      return;
    }
    if (!formData.difficulty) {
      Alert.alert('Select Difficulty', 'Please select a difficulty for this milestone.');
      return;
    }
    const selected = groupedByName.find(x => x.milestone_name === formData.milestoneName);
    const milestoneId = selected?.id;
    if (!milestoneId) {
      Alert.alert('Missing Milestone ID', 'Unable to determine milestone ID. Please try again.');
      return;
    }
    const payload = {
      milestone_id: milestoneId,
      achieved_date: formData.date,
      difficulty: formData.difficulty,
      special_milestone: !!formData.special,
    };
    try {
      setSubmitting(true);
      const res = await milestonesService.create(currentChild.id || currentChild.child_id, payload);
      const r = (res && typeof res === 'object' && 'data' in res) ? res.data : res;
      const ok = r && typeof r.id !== 'undefined';
      if (ok) {
        const niceName = currentChild?.name || 'Child';
        const niceMilestone = formData?.milestoneName || 'milestone';
        const prefix = 'Congrats';
        const successMsg = `${prefix} ${niceName} achieved ${niceMilestone} milestone${r.special_milestone ? ' (Special)' : ''}.`;
        Alert.alert('Saved', successMsg, [
          { text: 'OK', onPress: async () => {
              try { await loadMilestones(currentChild.id || currentChild.child_id); } catch(_) {}
              setFormData(prev => ({
                ...prev,
                milestoneName: '',
                subFeatures: [],
                date: new Date().toISOString().split('T')[0],
                special: false,
                difficulty: 'Normal',
              }));
              setSubmitting(false);
            } },
        ]);
      } else {
        setSubmitting(false);
        Alert.alert('Unexpected Response', 'The server returned an unexpected response. Please try again.');
      }
    } catch (e) {
      setSubmitting(false);
      let title = 'Error';
      let message = 'Failed to save milestone.';
      const status = e?.response?.status;
      if (status === 422) {
        const detail = e?.response?.data?.detail;
        if (Array.isArray(detail) && detail.length) {
          const lines = detail.map(d => {
            const loc = Array.isArray(d?.loc) ? d.loc.join('.') : '';
            const msg = d?.msg || 'Invalid input';
            return loc ? `${loc}: ${msg}` : msg;
          });
          title = 'Validation Error';
          message = lines.join('\n');
        } else {
          title = 'Validation Error';
          message = 'Please review the inputs and try again.';
        }
      } else if (status >= 500) {
        title = 'Server Error';
        message = 'The server encountered an error. Please try again later.';
      } else if (e?.response?.data) {
        const data = e.response.data;
        message = data?.message || data?.detail || JSON.stringify(data);
      } else if (e?.message) {
        message = e.message;
      }
      Alert.alert(title, message);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Record Milestone"
        onBackPress={() => navigation.goBack()}
      />

      {(loading || bootLoading || listLoading || submitting) ? (
        <LoadingState fullScreen />
      ) : (
        <>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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
                disabled={loadingChildren || switchingChild || !children.length}
              >
                <View style={styles.childInfo}>
                  {currentChild?.avatar ? (
                    <Image source={{ uri: currentChild.avatar }} style={styles.childAvatarImg} />
                  ) : (
                    <View style={styles.childAvatar}>
                      <Text style={styles.childInitial}>{(currentChild?.name || '?').charAt(0)}</Text>
                    </View>
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

            {/* Milestones as Categories (by milestone_name) in grid cards */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Milestones</Text>
              {listLoading ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <ActivityIndicator color="#667eea" />
                  <Text style={{ marginTop: 6, color: '#7f8c8d' }}>Loading milestones...</Text>
                </View>
              ) : groupedByName.length === 0 ? (
                <View style={[styles.vaccineCard, { alignItems: 'center', justifyContent: 'center', width: '100%' }]}>
                  <Text style={{ color: '#7f8c8d' }}>No milestones available.</Text>
                </View>
              ) : (
                <View style={[styles.typeGrid, groupedByName.length === 2 && { justifyContent: 'space-between' }]}>
                  {groupedByName.map((m, idx) => {
                    const isDisabled = m.is_archived || disabledNames.includes(m.milestone_name);
                    const icons = ['trophy-outline', 'bulb-outline', 'ribbon-outline', 'star-outline', 'heart-outline', 'medkit-outline'];
                    const iconName = icons[idx % icons.length] || 'trophy-outline';
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[
                          styles.typeCard,
                          { width: groupedByName.length === 2 ? (width - 52) / 2 : (width - 60) / 3 },
                          formData.milestoneName === m.milestone_name && styles.activeTypeCard,
                          allArchived && styles.outlinedTypeCard,
                        ]}
                        onPress={() => selectMilestone(m.milestone_name, isDisabled || allArchived)}
                        disabled={isDisabled || allArchived}
                        activeOpacity={0.9}
                      >
                        <LinearGradient colors={itemGradients[idx % itemGradients.length]} style={styles.typeIcon}>
                          <Ionicons name={iconName} size={20} color="#fff" />
                        </LinearGradient>
                        <Text style={[
                          styles.typeText,
                          formData.milestoneName === m.milestone_name && styles.activeTypeText,
                        ]} numberOfLines={2} ellipsizeMode="tail">
                          {m.milestone_name}
                        </Text>
                        {m.is_archived && (
                          <View style={[styles.ribbon, styles.ribbonArchived]} pointerEvents="none">
                            <Text style={styles.ribbonText}>Archived</Text>
                          </View>
                        )}
                        <View style={styles.chipRow} pointerEvents="none">
                          {(m.special_milestone || (formData.milestoneName === m.milestone_name && formData.special)) && (
                            <View style={[styles.chip, styles.chipSpecialOutline]}>
                              <Ionicons name="star" size={9} color="#f59e0b" />
                              <Text style={[styles.chipText, { color: '#b45309' }]} numberOfLines={1} ellipsizeMode="tail">Special</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Sub-features / Characteristics and other fields */}

            <View style={styles.section}>
                {!allArchived && (
                  <Text style={styles.sectionTitle}>Milestone Characteristics</Text>
                )}
                {!allArchived && (
                  <View style={[styles.charBadgeGrid, styles.subSectionStable]}>
                    {(() => {
                      const sel = groupedByName.find(x => x.milestone_name === formData.milestoneName);
                      const items = [sel?.sub1, sel?.sub2, sel?.sub3].filter(Boolean);
                      return items.length ? items.map(sf => (
                        <View key={sf} style={styles.charBadge}>
                          <Ionicons name="checkbox-outline" size={14} color="#667eea" />
                          <Text style={styles.charBadgeText} numberOfLines={1}>{sf}</Text>
                        </View>
                      )) : (
                        <Text style={{ color: '#7f8c8d' }}>No characteristics listed.</Text>
                      );
                    })()}
                  </View>
                )}
                {allArchived ? (
                  <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.bannerBorder}>
                    <View style={styles.bannerInner}>
                      <View style={styles.bannerTopIcon}><Ionicons name="sparkles" size={18} color="#f59e0b" /></View>
                      <Text style={styles.bannerTitle}>Hooray!</Text>
                      <Text style={styles.bannerSub} numberOfLines={2}>
                        {(currentChild?.name || 'Your child')} has achieved all milestones. Celebrate this moment!
                      </Text>
                      <View style={styles.bannerEmojis}>
                        <Text style={styles.emoji}>🎉</Text>
                        <Text style={styles.emoji}>🏆</Text>
                        <Text style={styles.emoji}>🌟</Text>
                      </View>
                    </View>
                  </LinearGradient>
                ) : (
                  <>
                    <View style={{ marginTop: 16 }}>
                      <Text style={styles.inputLabel}>Date</Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => { setSelectionsFromISO(formData.date); setShowDateModal(true); }}
                      >
                        <Ionicons name="calendar-outline" size={20} color="#667eea" />
                        <Text style={styles.dateText}>{fmtDisplay(formData.date)}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionTitle}>Achievement Difficulty</Text>
                      <View style={styles.diffMilestoneGrid}>
                        {[
                          { key: 'Easy', icon: 'leaf-outline' },
                          { key: 'Normal', icon: 'speedometer-outline' },
                          { key: 'Challenging', icon: 'flash-outline' },
                          { key: 'Difficult', icon: 'flame-outline' },
                        ].map((opt, idx) => {
                          const selected = formData.difficulty === opt.key;
                          const grad = itemGradients[idx % itemGradients.length];
                          return (
                            <TouchableOpacity
                              key={opt.key}
                              onPress={() => updateFormData('difficulty', opt.key)}
                              activeOpacity={0.9}
                              style={styles.diffMilestoneCardWrap}
                            >
                              <View style={[styles.diffMilestoneCard, selected && styles.activeTypeCard, { backgroundColor: '#fff' }]}>
                                <LinearGradient colors={grad} style={styles.typeIcon}>
                                  <Ionicons name={opt.icon} size={20} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.typeText} numberOfLines={1}>{opt.key}</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {(() => {
                      const eligible = !!formData.date;
                      const onPress = () => {
                        if (!eligible && !formData.special) {
                          Alert.alert('Requirements', 'Select a date before marking as special.');
                          return;
                        }
                        updateFormData('special', !formData.special);
                      };
                      if (!formData.milestoneName && !formData.special) {
                        return (
                          <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginTop: 16 }}>
                            <View style={[styles.specialCard, styles.specialCardOutlined]}>
                              <View style={[styles.specialCardLeftIcon, { backgroundColor: 'rgba(79,70,229,0.08)' }]}>
                                <Ionicons name="star-outline" size={18} color="#4f46e5" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.specialCardTitle, { color: '#4f46e5' }]} numberOfLines={1}>
                                  Mark milestone as Special
                                </Text>
                                <Text style={[styles.specialCardSub, { color: '#6b7280' }]} numberOfLines={1}>
                                  Select a milestone first
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }
                      const colors = formData.special
                        ? ['#f59e0b', '#f97316']
                        : (eligible ? ['#a78bfa', '#6366f1'] : ['#e5e7eb', '#d1d5db']);
                      return (
                        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginTop: 16 }}>
                          <LinearGradient colors={colors} style={styles.specialCard}>
                            <View style={styles.specialCardLeftIcon}>
                              <Ionicons name={formData.special ? 'star' : 'star-outline'} size={18} color={formData.special ? '#fff' : (eligible ? '#fff' : '#6b7280')} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.specialCardTitle, !eligible && !formData.special && { color: '#6b7280' }]} numberOfLines={1}>
                                {formData.special ? 'Special milestone selected' : 'Mark milestone as Special'}
                              </Text>
                              <Text style={[styles.specialCardSub, !eligible && !formData.special && { color: '#6b7280' }]} numberOfLines={1}>
                                {eligible || formData.special ? 'Will be highlighted prominently' : 'Requires date selection'}
                              </Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })()}
                  </>
                )}
              </View>

            {/* Notes removed as per request */}

            {/* Submit */}
            {!allArchived && (
              <View style={styles.section}>
                <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
                  <LinearGradient colors={['#667eea', '#764ba2']} style={styles.submitButtonGradient}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          

          {showDateModal && (
            <Modal transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={() => { if (selYear && selMonth && selDay) { const dateObj = new Date(selYear, selMonth - 1, selDay); updateFormData('date', fmt(dateObj)); } setShowDateModal(false); }}>
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                <View style={[styles.modalCardBottom, { maxHeight: '48%', paddingBottom: 20 }]}
                >
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Select Date</Text>
                  </View>
                  <View style={styles.dateColumnsRow}>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColLabel}>Day</Text>
                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {getDayOptions().map((d) => (
                          <TouchableOpacity key={d} style={[styles.optionItem, selDay === d && styles.optionSelected]} onPress={() => setSelDay(d)}>
                            <Text style={[styles.optionText, selDay === d && styles.optionTextActive]}>{d}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColLabel}>Month</Text>
                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {getMonthOptions().map((m) => (
                          <TouchableOpacity key={m} style={[styles.optionItem, selMonth === m && styles.optionSelected]} onPress={() => setSelMonth(m)}>
                            <Text style={[styles.optionText, selMonth === m && styles.optionTextActive]}>{monthNames[m - 1]}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColLabel}>Year</Text>
                      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {getYearOptions().map((y) => (
                          <TouchableOpacity key={y} style={[styles.optionItem, selYear === y && styles.optionSelected]} onPress={() => setSelYear(y)}>
                            <Text style={[styles.optionText, selYear === y && styles.optionTextActive]}>{y}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Child Switcher Modal as bottom sheet */}
          <Modal
            visible={showChildModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowChildModal(false)}
          >
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
        </>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
  },
  errorBoxText: {
    color: '#b00020',
    flex: 1,
    fontSize: 13,
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
  childAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
    width: (width - 60) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    paddingTop: 34,
    paddingBottom: 28,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
    position: 'relative',
  },
  activeTypeCard: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  outlinedTypeCard: {
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTypeText: {
    color: '#2c3e50',
  },
  badgeCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSpecial: {
    backgroundColor: '#f59e0b',
  },
  badgeArchived: {
    backgroundColor: '#d93025',
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
  vaccineScroll: {
    paddingLeft: 4,
  },
  vaccineTouchable: {
    marginRight: 12,
  },
  vaccineCard: {
    width: width * 0.7,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#eef2ff',
  },
  activeVaccineCard: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  vaccineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vaccineTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  activeVaccineName: {
    color: '#3b5bdb',
  },
  vaccineFullName: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pendingPill: {
    backgroundColor: '#eef2ff',
  },
  pendingPillText: {
    color: '#667eea',
    fontWeight: '600',
  },
  archivedPill: {
    backgroundColor: '#fdecec',
  },
  archivedPillText: {
    color: '#d93025',
    fontWeight: '600',
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  specialBadgeText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '700',
  },
  selectedBannerBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe4ff',
  },
  selectedBannerTextDark: {
    color: '#2c3e50',
    fontWeight: '600',
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
  subSectionStable: {
    minHeight: 48,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  tagRowAbs: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  tagSpecial: {
    backgroundColor: '#f59e0b',
  },
  tagArchived: {
    backgroundColor: '#d93025',
  },
  archivedTypeCard: {
    backgroundColor: '#fafafa',
    borderColor: '#eee',
    opacity: 0.9,
  },
  archivedTypeText: {
    color: '#9aa0a6',
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonSpecial: {
    backgroundColor: '#f59e0b',
  },
  ribbonArchived: {
    backgroundColor: '#16a34a',
  },
  ribbonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  chipArchivedOutline: {
    borderWidth: 1,
    borderColor: '#ef9a9a',
    backgroundColor: '#fff',
  },
  chipSpecialOutline: {
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#fff',
  },
  cornerRibbonLeft: {
    position: 'absolute',
    top: 10,
    left: -30,
    backgroundColor: '#d93025',
    paddingVertical: 2,
    paddingHorizontal: 32,
    transform: [{ rotate: '-45deg' }],
    borderRadius: 2,
    zIndex: 5,
    elevation: 5,
  },
  cornerRibbonRight: {
    position: 'absolute',
    top: 10,
    right: -30,
    backgroundColor: '#f59e0b',
    paddingVertical: 2,
    paddingHorizontal: 28,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
    elevation: 5,
  },
  cornerRibbonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  specialPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  specialPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  specialBanner: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  specialBannerSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  specialBannerDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  specialBannerText: {
    marginLeft: 8,
    color: '#4f46e5',
    fontWeight: '700',
  },
  specialBannerTextSelected: {
    color: '#fff',
  },
  specialBannerTextDisabled: {
    color: '#9ca3af',
  },
  specialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  specialCardLeftIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 10,
  },
  specialCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  specialCardSub: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  characteristicsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
    padding: 12,
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  charText: {
    color: '#2c3e50',
    fontSize: 13,
    flexShrink: 1,
  },
  diffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  diffMilestoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  diffMilestoneCardWrap: {
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  diffMilestoneCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  diffMilestoneActive: {
    borderColor: '#6366f1',
  },
  diffMilestoneCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  charBadgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  charBadge: {
    width: (width - 60) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef2f7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  charBadgeText: {
    marginLeft: 8,
    color: '#334155',
    fontSize: 12,
    flexShrink: 1,
  },
  diffTileWrap: {
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  diffTile: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef2f7',
    overflow: 'hidden',
    minHeight: 76,
    justifyContent: 'center',
  },
  diffAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  diffTileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
  },
  diffTileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  diffCheckBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  charChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef2f7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  charChipText: {
    marginLeft: 6,
    color: '#334155',
    fontSize: 12,
    maxWidth: (width - 60) / 2,
  },
  diffCardWrap: {
    width: (width - 60) / 2,
    marginBottom: 10,
  },
  diffCardWrapActive: {
    transform: [{ scale: 1.0 }],
  },
  diffCard: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 56,
    position: 'relative',
  },
  diffCardActive: {
    borderColor: '#6366f1',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  diffIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginRight: 8,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
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
  allArchivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginTop: 12,
  },
  allArchivedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  allArchivedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  allArchivedSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#374151',
  },
  bannerBorder: {
    borderRadius: 16,
    padding: 1,
    marginTop: 12,
  },
  bannerInner: {
    backgroundColor: '#f6f8ffff',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
  },
  bannerTopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  bannerTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  bannerSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  bannerEmojis: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  emoji: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  loadingText: {
    marginTop: 8,
    color: '#2c3e50',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal styles copied from vaccination screen for consistency
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalCardBottom: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  dateColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateColumn: {
    flex: 1,
    marginHorizontal: 6,
  },
  dateColLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    borderRadius: 10,
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
  },
  optionTextSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  childRowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
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
});

export default AddMilestoneScreen;
