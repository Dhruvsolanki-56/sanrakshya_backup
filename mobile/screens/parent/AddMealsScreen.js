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
  LayoutAnimation,
  UIManager,
  Animated
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
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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

  // Data State
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [bootLoading, setBootLoading] = useState(true);
  const [foods, setFoods] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Logic State (Previous Log)
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
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // UI State
  const [activeTab, setActiveTab] = useState('breakfast');
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState(null); // { item, type: 'food' | 'custom' }
  const [tempFrequency, setTempFrequency] = useState('7');
  const [tempGrams, setTempGrams] = useState('100');

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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()] || '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const [selectionsByMeal, setSelectionsByMeal] = useState({});
  const [customByMeal, setCustomByMeal] = useState({});
  const [searchByMeal, setSearchByMeal] = useState({}); // Kept for logic compatibility, though UI is changed
  const [notesCommon, setNotesCommon] = useState('');

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
    if (!selectedChildId) return;
    loadFoods(selectedChildId);
    loadLatestMeals(selectedChildId);

    setSelectionsByMeal({});
    setCustomByMeal({});
    setSearchByMeal({});
    setNotesCommon('');
  }, [selectedChildId, loadFoods, loadLatestMeals]);

  const canLogMeals = daysUntilNextAllowed === 0;

  // New Helper for Search
  const [searchQuery, setSearchQuery] = useState('');

  const getFilteredFoods = (mealKey) => {
    const q = searchQuery.trim().toLowerCase();
    // Filter out already selected items for this meal so they don't appear in "Add" list?
    // User requested "all data should remain same", so we keep logic.
    // Logic: Pool = All Foods - Selected Foods.
    const selections = selectionsByMeal[mealKey] || {};
    const pool = foods.filter(f => !selections[String(f.food_id)]);

    if (!q) return pool;
    return pool.filter(f => String(f.food_name || '').toLowerCase().includes(q));
  };

  const getSelectedForMeal = (mealKey) => {
    const selections = selectionsByMeal[mealKey] || {};
    const list = [];
    Object.keys(selections).forEach(fid => {
      if (fid.startsWith('custom_')) {
        const meta = selections[fid];
        list.push({ isCustom: true, id: fid, ...meta });
      } else {
        const food = foods.find(f => String(f.food_id) === String(fid));
        const meta = selections[fid];
        if (food) list.push({ ...food, ...meta, id: fid });
      }
    });
    return list;
  };

  // -- Modal / Smart Default Logic --
  const openAddModal = (item, isCustom = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItemToAdd({ item, type: isCustom ? 'custom' : 'food' });
    setTempFrequency('7'); // Smart Default
    setTempGrams('100');   // Smart Default
    setAddItemModalVisible(true);
  };

  const confirmAddItem = () => {
    if (!selectedItemToAdd) return;
    const { item, type } = selectedItemToAdd;

    // Validate
    const f = parseInt(tempFrequency, 10);
    const g = parseInt(tempGrams, 10);

    if (!Number.isFinite(f) || f <= 0) {
      Alert.alert('Invalid Input', 'Times per week must be > 0');
      return;
    }
    if (!Number.isFinite(g) || g <= 0) {
      Alert.alert('Invalid Input', 'Grams must be > 0');
      return;
    }

    if (type === 'custom') {
      // item is just { name: '...' }
      const fakeId = `custom_${activeTab}_${Date.now()}`;
      setSelectionsByMeal(prev => {
        const base = prev[activeTab] || {};
        return { ...prev, [activeTab]: { ...base, [fakeId]: { frequency_num: String(f), grams: String(g), is_custom: true, name: item.name, confirmed: true } } };
      });
    } else {
      // item is a food object
      setSelectionsByMeal(prev => {
        const base = prev[activeTab] || {};
        return { ...prev, [activeTab]: { ...base, [item.food_id]: { frequency_num: String(f), grams: String(g), confirmed: true } } };
      });
    }

    setAddItemModalVisible(false);
    setSelectedItemToAdd(null);
    setSearchQuery(''); // Clear search on add
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeSelection = (mealKey, id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectionsByMeal(prev => {
      const base = prev[mealKey] || {};
      const next = { ...base };
      delete next[id];
      return { ...prev, [mealKey]: next };
    });
  };

  // Custom Food State (Temporary for input)
  const [customFoodName, setCustomFoodName] = useState('');

  const handleSaveCommon = async () => {
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
          if (!meta.confirmed) return; // Should be confirmed if added via modal

          const gramsInt = parseInt(String(meta.grams), 10);
          const freqInt = parseInt(String(meta.frequency_num), 10);

          if (meta.is_custom || String(fid).startsWith('custom_')) {
            items.push({ meal_type: m.key, custom_food_name: meta.name, serving_size_g: gramsInt, meal_frequency: freqInt });
          } else {
            items.push({ meal_type: m.key, food_id: Number(fid), serving_size_g: gramsInt, meal_frequency: freqInt });
          }
        });
      });

      if (!items.length) {
        Alert.alert('Nothing to save', 'Please add at least one meal item.');
        return;
      }

      // Restore validation: Check if items exist for all meal sections
      const missingSections = MEAL_SECTIONS.filter(m => !items.some(it => it.meal_type === m.key));
      if (missingSections.length) {
        const names = missingSections.map(m => m.title).join(', ');
        Alert.alert('Incomplete Log', `Please add at least one item for: ${names}.\n\nA complete weekly log helps track nutrition better.`);
        return;
      }

      const d = new Date();
      const payload = {
        log_date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        ...(notesCommon?.trim() ? { notes: notesCommon.trim() } : {}),
        items,
      };
      setSubmitting(true);
      await mealLogService.postMeals(selectedChildId, payload);
      Alert.alert('Success', 'Weekly meals saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save meals.');
    } finally {
      setSubmitting(false);
    }
  };


  // --- Render ---
  const activeSection = MEAL_SECTIONS.find(s => s.key === activeTab);
  const filteredFoods = getFilteredFoods(activeTab);
  const selectedItems = getSelectedForMeal(activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {/* Header */}
        <ScreenHeader title="Weekly Meals" onBackPress={() => navigation.goBack()} />

        {/* Child Selector */}
        <View style={styles.childHeader}>
          <TouchableOpacity style={styles.childCard} onPress={() => setShowChildModal(true)}>
            {currentChild?.avatar ? (
              <Image source={{ uri: currentChild.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4F46E5' }}>{currentChild?.name?.[0] || 'C'}</Text>
              </View>
            )}
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.childName}>{currentChild?.name || 'Select Child'}</Text>
              <Text style={styles.childDetail}>Updating weekly log</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {(loadingChildren || bootLoading || listLoading) ? (
          <LoadingState fullScreen />
        ) : (
          <View style={{ flex: 1 }}>
            {canLogMeals ? (
              <>
                {/* Tabs */}
                <View style={styles.tabContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                    {MEAL_SECTIONS.map((section) => {
                      const isActive = activeTab === section.key;
                      const count = Object.keys(selectionsByMeal[section.key] || {}).length;
                      return (
                        <TouchableOpacity
                          key={section.key}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setActiveTab(section.key);
                            setSearchQuery('');
                          }}
                          style={[styles.tab, isActive && styles.tabActive]}
                        >
                          <Ionicons name={section.icon} size={16} color={isActive ? '#FFF' : '#64748B'} />
                          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{section.title}</Text>
                          {count > 0 && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{count}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Content Area */}
                <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 100 }}>

                  {/* Selected Items List (Compact) */}
                  {selectedItems.length > 0 && (
                    <View style={styles.selectedContainer}>
                      <Text style={styles.sectionTitle}>Selected for {activeSection.title}</Text>
                      {selectedItems.map((item) => (
                        <View key={item.id} style={styles.selectedCard}>
                          <View style={styles.selectedIcon}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.selectedName}>{item.food_name || item.name}</Text>
                            <Text style={styles.selectedDetail}>{item.frequency_num}x/week • {item.grams}g</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeSelection(activeTab, item.id)} style={styles.removeBtn}>
                            <Ionicons name="close" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Search & Add */}
                  <Text style={[styles.sectionTitle, { marginTop: selectedItems.length ? 24 : 8 }]}>Add to {activeSection.title}</Text>

                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search foods..."
                      placeholderTextColor="#94A3B8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  <View style={styles.grid}>
                    {filteredFoods.slice(0, 50).map((food) => (
                      <TouchableOpacity
                        key={food.food_id}
                        style={styles.foodCard}
                        onPress={() => openAddModal(food)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
                        <View style={styles.foodEmojiCircle}>
                          <Ionicons name={food.is_veg ? 'leaf' : 'fast-food'} size={18} color={food.is_veg ? '#22C55E' : '#EF4444'} />
                        </View>
                        <Text style={styles.foodNameGrid} numberOfLines={2}>{food.food_name}</Text>
                        <Text style={styles.foodCategory}>{food.category_age_group || 'General'}</Text>
                        <View style={styles.addMiniBtn}>
                          <Ionicons name="add" size={16} color="#4F46E5" />
                        </View>
                      </TouchableOpacity>
                    ))}

                    {/* Add Custom Card */}
                    <TouchableOpacity
                      style={[styles.foodCard, { borderColor: '#4F46E5', borderStyle: 'dashed', borderWidth: 1 }]}
                      onPress={() => {
                        Alert.prompt('Custom Food', 'Enter food name:', (text) => {
                          if (text?.trim()) openAddModal({ name: text.trim() }, true);
                        });
                      }}
                    >
                      <View style={[styles.foodEmojiCircle, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name="restaurant" size={18} color="#4F46E5" />
                      </View>
                      <Text style={[styles.foodNameGrid, { color: '#4F46E5' }]}>Add Custom</Text>
                      <Text style={styles.foodCategory}>Write own</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Common Notes */}
                  <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
                    <Text style={styles.sectionTitle}>Weekly Notes</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Any general observations about meals this week..."
                      value={notesCommon}
                      onChangeText={setNotesCommon}
                      multiline
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                </ScrollView>

                {/* Save Button */}
                <View style={styles.floatingSave}>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCommon} disabled={submitting}>
                    <LinearGradient colors={['#4F46E5', '#4338CA']} style={styles.saveGradient}>
                      {submitting ? <ActivityIndicator color="#FFF" /> : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                          <Text style={styles.saveText}>Save Weekly Log</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Locked State (Already Logged) */
              <View style={styles.lockedContainer}>
                <View style={styles.lockedIcon}>
                  <Ionicons name="lock-closed" size={40} color="#EF4444" />
                </View>
                <Text style={styles.lockedTitle}>Weekly Log Complete</Text>
                <Text style={styles.lockedSub}>
                  You have already logged meals for this week. You can log again on {fmtDisplayDate(addDays(new Date(), daysUntilNextAllowed))}.
                </Text>
                {latestMeals && (
                  <TouchableOpacity style={styles.viewLogBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.viewLogText}>Back to Dashboard</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Add Item Modal */}
      <Modal visible={addItemModalVisible} transparent animationType="fade" onRequestClose={() => setAddItemModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItemToAdd?.item?.food_name || selectedItemToAdd?.item?.name}</Text>
              <TouchableOpacity onPress={() => setAddItemModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Frequency (Times per week)</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setTempFrequency(Math.max(1, parseInt(tempFrequency || 0) - 1).toString())}>
                <Ionicons name="remove" size={20} color="#4F46E5" />
              </TouchableOpacity>
              <TextInput style={styles.modalInput} value={tempFrequency} onChangeText={setTempFrequency} keyboardType="numeric" />
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setTempFrequency((parseInt(tempFrequency || 0) + 1).toString())}>
                <Ionicons name="add" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Quantity (Grams per serving)</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setTempGrams(Math.max(10, parseInt(tempGrams || 0) - 10).toString())}>
                <Ionicons name="remove" size={20} color="#4F46E5" />
              </TouchableOpacity>
              <TextInput style={styles.modalInput} value={tempGrams} onChangeText={setTempGrams} keyboardType="numeric" />
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setTempGrams((parseInt(tempGrams || 0) + 10).toString())}>
                <Ionicons name="add" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            <Text style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginBottom: 20 }}>Avg serving: 100g</Text>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmAddItem}>
              <Text style={styles.modalConfirmText}>Add to {activeSection.title}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Child Switcher Modal */}
      <Modal visible={showChildModal} transparent animationType="fade" onRequestClose={() => setShowChildModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowChildModal(false)}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Switch Explorer</Text>
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  childHeader: { paddingHorizontal: 20, paddingVertical: 12 },
  childCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  childName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  childDetail: { fontSize: 12, color: '#64748B' },

  tabContainer: { height: 60 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0', height: 40, marginTop: 10 },
  tabActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B', marginLeft: 6 },
  tabTextActive: { color: '#FFF' },
  badge: { backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  contentScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  selectedContainer: {},
  selectedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  selectedIcon: { marginRight: 12 },
  selectedName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  selectedDetail: { fontSize: 13, color: '#64748B' },
  removeBtn: { padding: 8 },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, height: 48, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1E293B' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  foodCard: { width: (width - 52) / 2, backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', minHeight: 120 },
  foodEmojiCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  foodNameGrid: { fontSize: 14, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  foodCategory: { fontSize: 11, color: '#94A3B8' },
  addMiniBtn: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },

  notesInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14 },

  floatingSave: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  saveBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  lockedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  lockedTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  lockedSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  viewLogBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#F1F5F9' },
  viewLogText: { color: '#475569', fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', flex: 1 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  modalInput: { flex: 1, height: 50, backgroundColor: '#F8FAFC', borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
  stepperBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  modalConfirmBtn: { backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  modalConfirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  sheetName: { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
});

export default AddMealsScreen;
