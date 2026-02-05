import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StatusBar,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../../services/storage';
import { nutritionService } from '../../services/nutritionService';

const { width } = Dimensions.get('window');

const NutritionLifestyleScreen = ({ navigation }) => {
  const [selectedAge, setSelectedAge] = useState('3 years');
  const [selectedTab, setSelectedTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [childId, setChildId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({});

  const ageGroups = ['6 months', '1 year', '2 years', '3 years', '4-5 years', '6+ years'];

  const tabs = [
    { id: 'summary', title: 'Summary', icon: 'stats-chart' },
    { id: 'recipes', title: 'Recipes', icon: 'restaurant' },
    { id: 'meals', title: 'Meal Plans', icon: 'calendar' },
    { id: 'nutrition', title: 'Tips', icon: 'leaf' },
    { id: 'lifestyle', title: 'Lifestyle', icon: 'fitness' },
  ];

  const nutrientLabels = useMemo(() => ({
    energy_kcal: 'Energy',
    protein_g: 'Protein',
    carb_g: 'Carbs',
    fat_g: 'Fat',
    iron_mg: 'Iron',
    calcium_mg: 'Calcium',
    vitamin_a_mcg: 'Vitamin A',
    vitamin_c_mg: 'Vitamin C',
  }), []);

  const statusColor = (s) => (s === 'adequate' ? '#10B981' : s === 'excess' ? '#F59E0B' : s === 'not_applicable' ? '#94A3B8' : '#EF4444');

  const adequacyMeta = useMemo(() => ({
    adequate: { color: '#10B981', icon: 'checkmark-circle' },
    deficit: { color: '#EF4444', icon: 'alert-circle' },
    excess: { color: '#F59E0B', icon: 'warning' },
    not_applicable: { color: '#94A3B8', icon: 'remove-circle' },
  }), []);

  const progressColors = useMemo(() => ({
    adequate: ['#10B981', '#34D399'],
    deficit: ['#EF4444', '#F87171'],
    excess: ['#F59E0B', '#FBBF24'],
    not_applicable: ['#94A3B8', '#CBD5E1'],
    default: ['#3B82F6', '#60A5FA'],
  }), []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const storedId = await storage.getSelectedChildId();
      const cid = storedId || '1';
      setChildId(cid);
      const data = await nutritionService.getWeeklySummary(cid);
      setSummary(data || null);
    } catch (err) {
      setError(err?.message || 'Failed to load nutrition summary');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSummary();
  }, [loadSummary]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
      return () => { };
    }, [loadSummary])
  );

  // --- RENDERING ---

  const renderSummary = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Analyzing nutrition data...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSummary}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const perc = summary?.percent_of_requirement || {};
    const adequacy = summary?.adequacy || {};
    const needed = Array.from(new Set(summary?.needed_nutrients || []));
    const topFoods = summary?.top_foods_by_nutrient || {};
    const hasData = !!summary?.has_data;

    return (
      <View style={styles.contentContainer}>
        {/* Info Banner */}
        {typeof summary?.age_months === 'number' && (
          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#059669" style={{ marginRight: 8 }} />
            <Text style={[styles.infoText, { color: '#065F46' }]}>
              {summary.age_months >= 6
                ? 'At 6+ months, continue breastfeeding and introduce age-appropriate complementary foods.'
                : 'Exclusive breastfeeding is recommended for infants under 6 months. Consult your pediatrician before introducing other foods.'}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.glassCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="shield-checkmark" size={18} color="#3B82F6" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Daily Intake Analysis</Text>
          </View>

          {!hasData ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Data Logged</Text>
              <Text style={styles.emptySubtitle}>Log meals for the last 7 days to see specific insights here.</Text>
            </View>
          ) : (
            <>
              {Object.keys(perc).map((key) => {
                const val = Number(perc[key] || 0);
                const pct = Math.max(0, Math.min(100, val));
                const state = adequacy[key];
                const colors = progressColors[state] || progressColors.default;
                return (
                  <View key={key} style={styles.progressRow}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={styles.progressLabel}>{nutrientLabels[key] || key}</Text>
                      <Text style={[styles.progressValue, { color: colors[0] }]}>{pct.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}

              <View style={styles.divider} />

              <Text style={styles.subTitle}>Nutrient Status</Text>
              <View style={styles.chipWrap}>
                {Object.keys(adequacy).map((key) => {
                  const s = adequacy[key];
                  const meta = adequacyMeta[s] || adequacyMeta.not_applicable;
                  return (
                    <View key={key} style={[styles.statusChip, { backgroundColor: meta.color + '15', borderColor: meta.color + '30' }]}>
                      <Ionicons name={meta.icon} size={14} color={meta.color} style={styles.statusIcon} />
                      <Text style={[styles.statusChipText, { color: meta.color }]}>{nutrientLabels[key] || key}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Needed Nutrients */}
        {!!needed.length && hasData && (
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Focus Nutrients</Text>
            <Text style={styles.cardSub}>Try to include more sources of these:</Text>
            <View style={styles.chipWrap}>
              {needed.map((n) => (
                <View key={n} style={styles.needChip}>
                  <Text style={styles.needChipText}>{nutrientLabels[n] || n}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Foods Logic */}
        {(() => {
          const aggregatedFoodsMap = {};
          needed.forEach((n) => {
            (topFoods[n] || []).forEach((f) => {
              const k = String(f.food_id ?? f.food_name);
              if (!aggregatedFoodsMap[k]) aggregatedFoodsMap[k] = { ...f, nutrients: new Set() };
              aggregatedFoodsMap[k].nutrients.add(n);
            });
          });
          const aggregatedFoods = Object.values(aggregatedFoodsMap)
            .map((f) => ({ ...f, nutrients: Array.from(f.nutrients) }))
            .sort((a, b) => (b.nutrients.length - a.nutrients.length) || a.food_name.localeCompare(b.food_name));

          return (!!aggregatedFoods.length && hasData) ? (
            <View style={styles.glassCard}>
              <Text style={styles.cardTitle}>Recommended Foods</Text>
              <Text style={styles.cardSub}>Based on current deficits:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {aggregatedFoods.map((f) => (
                  <View key={String(f.food_id ?? f.food_name)} style={styles.foodCardWide}>
                    <View style={styles.foodIconCircle}>
                      <Text style={{ fontSize: 20 }}>🥗</Text>
                    </View>
                    <Text style={styles.foodName}>{f.food_name}</Text>
                    <Text style={styles.foodGroup}>{f.food_group}</Text>
                    <View style={styles.nutrientTagRow}>
                      {f.nutrients.slice(0, 2).map((n) => (
                        <View key={`${String(f.food_id ?? f.food_name)}-${n}`} style={styles.nutrientTag}>
                          <Text style={styles.nutrientTagText}>{nutrientLabels[n] || n}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null;
        })()}

      </View>
    );
  };

  const mealPlans = {
    '3 years': {
      breakfast: [
        { meal: 'Banana Oat Pancakes', time: '8:00 AM', calories: 180 },
        { meal: 'Greek Yogurt with Berries', time: '8:00 AM', calories: 120 },
        { meal: 'Whole Grain Toast with Avocado', time: '8:00 AM', calories: 160 }
      ],
      lunch: [
        { meal: 'Rainbow Veggie Wraps', time: '12:30 PM', calories: 220 },
        { meal: 'Mini Meatballs with Rice', time: '12:30 PM', calories: 280 },
        { meal: 'Grilled Chicken Strips', time: '12:30 PM', calories: 200 }
      ],
      dinner: [
        { meal: 'Veggie Mac & Cheese', time: '6:00 PM', calories: 280 },
        { meal: 'Baked Salmon with Sweet Potato', time: '6:00 PM', calories: 320 },
        { meal: 'Turkey and Veggie Meatballs', time: '6:00 PM', calories: 250 }
      ],
      snacks: [
        { meal: 'Apple slices with Peanut Butter', calories: 150 },
        { meal: 'Cheese cubes and Crackers', calories: 120 },
        { meal: 'Homemade Trail Mix', calories: 140 }
      ]
    }
  };

  const nutritionTips = {
    '3 years': [
      {
        title: 'Portion Control',
        tip: 'A 3-year-old\'s stomach is about the size of their fist. Serve appropriate portions.',
        icon: '✋'
      },
      {
        title: 'Variety is Key',
        tip: 'Offer different colors, textures, and flavors to ensure balanced nutrition.',
        icon: '🌈'
      },
      {
        title: 'Healthy Snacking',
        tip: 'Choose nutrient-dense snacks like fruits, vegetables, and whole grains.',
        icon: '🍎'
      },
      {
        title: 'Hydration',
        tip: 'Encourage water intake. Limit sugary drinks and offer milk with meals.',
        icon: '💧'
      },
      {
        title: 'Family Meals',
        tip: 'Eat together as a family to model healthy eating behaviors.',
        icon: '👨‍👩‍👧‍👦'
      }
    ]
  };

  const lifestyleTips = {
    '3 years': [
      {
        title: 'Active Play',
        description: 'Encourage 3+ hours of physical activity throughout the day',
        activities: ['Dancing', 'Playground time', 'Ball games', 'Nature walks'],
        icon: '🏃‍♂️'
      },
      {
        title: 'Sleep Schedule',
        description: '11-14 hours of sleep per day including naps',
        tips: ['Consistent bedtime routine', 'Dark, quiet room', 'No screens before bed'],
        icon: '😴'
      },
      {
        title: 'Screen Time',
        description: 'Limit to 1 hour of high-quality programming per day',
        guidelines: ['Watch together', 'Educational content', 'No screens during meals'],
        icon: '📱'
      },
      {
        title: 'Social Development',
        description: 'Encourage interaction with peers and family',
        activities: ['Playdates', 'Family games', 'Story time', 'Pretend play'],
        icon: '👫'
      }
    ]
  };

  const renderRecipes = () => {
    const list = Array.from(
      new Map((summary?.recommended_recipes || []).map((r) => [r.id, r])).values()
    );

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>;
    if (error) return <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>;

    return (
      <View style={styles.contentContainer}>
        <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.infoBanner}>
          <Ionicons name="restaurant" size={20} color="#EA580C" style={{ marginRight: 8 }} />
          <Text style={[styles.infoText, { color: '#9A3412' }]}>Recipes are suggestions. Check for allergies and adapt to your child's preferences.</Text>
        </LinearGradient>

        {!list.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Recommendations</Text>
            <Text style={styles.emptySubtitle}>Track meals to get personalized recipes.</Text>
          </View>
        ) : (
          list.map((recipe) => (
            <View key={recipe.id} style={styles.glassCard}>
              <TouchableOpacity
                style={styles.recipeHeader}
                onPress={() => setExpanded((p) => ({ ...p, [recipe.id]: !p[recipe.id] }))}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.recipeIconBox}>
                    <Text style={{ fontSize: 24 }}>🍽️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipeName}>{recipe.recipe_name}</Text>
                    <View style={styles.tagRow}>
                      <View style={[styles.tag, recipe.veg_nonveg === 'veg' ? styles.tagVeg : styles.tagNonVeg]}>
                        <Text style={[styles.tagText, recipe.veg_nonveg === 'veg' ? { color: '#166534' } : { color: '#991B1B' }]}>{recipe.veg_nonveg}</Text>
                      </View>
                      <View style={styles.tag}><Text style={styles.tagText}>{recipe.meal_type}</Text></View>
                    </View>
                  </View>
                </View>
                <Ionicons name={expanded[recipe.id] ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Nutrition Grid */}
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Core Nutrient</Text>
                  <Text style={styles.nutritionValue}>{nutrientLabels[recipe.primary_nutrient] || recipe.primary_nutrient}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Prep Time</Text>
                  <Text style={styles.nutritionValue}>{recipe.prep_time_mins} mins</Text>
                </View>
              </View>


              {expanded[recipe.id] && (
                <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  {!!recipe.ingredients && (
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailTitle}>Ingredients</Text>
                      <Text style={styles.detailText}>{recipe.ingredients}</Text>
                    </View>
                  )}
                  {!!recipe.instructions && (
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailTitle}>Instructions</Text>
                      <Text style={styles.detailText}>{recipe.instructions}</Text>
                    </View>
                  )}
                  {!!recipe.youtube_url && (
                    <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(recipe.youtube_url)}>
                      <Ionicons name="logo-youtube" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text style={styles.linkButtonText}>Watch Recipe Video</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderMealPlans = () => (
    <View style={styles.contentContainer}>
      <View style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={22} color="#4F46E5" style={{ marginRight: 10 }} />
          <Text style={styles.cardTitle}>Plan for {selectedAge}</Text>
        </View>

        {Object.entries(mealPlans[selectedAge] || {}).map(([mealType, meals]) => (
          <View key={mealType} style={{ marginBottom: 20 }}>
            <Text style={styles.mealTypeTitle}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
            {meals.map((meal, index) => (
              <View key={index} style={styles.mealItem}>
                <View style={styles.mealDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>{meal.meal}</Text>
                  <Text style={styles.mealTime}>{meal.time || 'Flexible'}</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );

  const renderNutritionTips = () => (
    <View style={styles.contentContainer}>
      <View style={styles.glassCard}>
        <Text style={styles.cardTitle}>Expert Advice</Text>
        <Text style={styles.cardSub}>Tailored for {selectedAge}</Text>

        <View style={{ marginTop: 10 }}>
          {nutritionTips[selectedAge]?.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipIconBox}>
                <Text style={{ fontSize: 20 }}>{tip.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipText}>{tip.tip}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderLifestyle = () => (
    <View style={styles.contentContainer}>
      {lifestyleTips[selectedAge]?.map((tip, index) => (
        <View key={index} style={styles.glassCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={[styles.tipIconBox, { backgroundColor: '#F0F9FF', marginRight: 12 }]}>
              <Text style={{ fontSize: 22 }}>{tip.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{tip.title}</Text>
              <Text style={styles.cardSub}>{tip.description}</Text>
            </View>
          </View>

          {/* Lists */}
          <View style={styles.bulletList}>
            {(tip.activities || tip.tips || tip.guidelines)?.map((item, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <Ionicons name="ellipse" size={6} color="#3B82F6" style={{ marginTop: 6, marginRight: 8 }} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'summary': return renderSummary();
      case 'recipes': return renderRecipes();
      case 'meals': return renderMealPlans();
      case 'nutrition': return renderNutritionTips();
      case 'lifestyle': return renderLifestyle();
      default: return renderSummary();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Nutrition & Health</Text>
            <Text style={styles.headerSub}>Tracking & Insights</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Tab Scroller */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {tabs.map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => setSelectedTab(tab.id)}
                >
                  {isActive && (
                    <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  )}
                  <Ionicons name={tab.icon} size={16} color={isActive ? '#fff' : '#64748B'} style={{ marginRight: 6 }} />
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
        >
          {renderContent()}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#64748B', textAlign: 'center', fontWeight: '500' },

  /* Tabs */
  tabContainer: { paddingVertical: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  activeTab: { borderColor: '#3B82F6', backgroundColor: '#3B82F6', borderWidth: 0 },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  activeTabText: { color: '#FFF' },

  /* Layout */
  contentContainer: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 12, color: '#64748B' },
  errorContainer: { backgroundColor: '#FEE2E2', padding: 16, borderRadius: 16, alignItems: 'center', margin: 20 },
  errorText: { color: '#B91C1C', marginTop: 8, textAlign: 'center' },
  retryButton: { marginTop: 12, backgroundColor: '#B91C1C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600' },

  /* Glass Cards */
  glassCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#EFF6FF', shadowColor: '#64748B', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  cardSub: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },

  /* Info Banner */
  infoBanner: { flexDirection: 'row', padding: 14, borderRadius: 16, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  /* Progress Bars */
  progressRow: { marginBottom: 14 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#475569', fontWeight: '600' },
  progressValue: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  /* Chips */
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  subTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  statusChipText: { fontSize: 12, fontWeight: '700', marginLeft: 6 },
  needChip: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 6 },
  needChipText: { color: '#3B82F6', fontWeight: '600', fontSize: 12 },

  /* Empty States */
  emptyState: { alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 4 },

  /* Recipes */
  recipeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recipeIconBox: { width: 48, height: 48, backgroundColor: '#FFF7ED', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  recipeName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  tagRow: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F1F5F9' },
  tagVeg: { backgroundColor: '#DCFCE7' },
  tagNonVeg: { backgroundColor: '#FEE2E2' },
  tagText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  nutritionGrid: { flexDirection: 'row', marginTop: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
  nutritionItem: { flex: 1 },
  nutritionLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  nutritionValue: { fontSize: 13, fontWeight: '700', color: '#334155' },

  detailBlock: { marginBottom: 16 },
  detailTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  detailText: { fontSize: 13, color: '#64748B', lineHeight: 20 },
  linkButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFF1F2', borderRadius: 10, alignSelf: 'flex-start' },
  linkButtonText: { color: '#E11D48', fontWeight: '600', fontSize: 13 },

  /* Foods Horizontal */
  foodCardWide: { backgroundColor: '#FFF', width: 200, padding: 16, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  foodIconCircle: { textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, marginBottom: 10 },
  foodName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  foodGroup: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  nutrientTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  nutrientTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  nutrientTagText: { fontSize: 10, color: '#475569', fontWeight: '600' },

  /* Meal Plans */
  mealTypeTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 12, marginTop: 4, letterSpacing: 0.5 },
  mealItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  mealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginRight: 12 },
  mealName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  mealTime: { fontSize: 12, color: '#94A3B8' },
  mealCalories: { fontSize: 13, fontWeight: '700', color: '#10B981' },

  /* Tips */
  tipRow: { flexDirection: 'row', marginBottom: 20 },
  tipIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  tipText: { fontSize: 13, color: '#64748B', lineHeight: 18 },

  /* Lifestyle */
  bulletList: { marginTop: 4 },
  bulletItem: { flexDirection: 'row', marginBottom: 6 },
  bulletText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 19 },

});

export default NutritionLifestyleScreen;
