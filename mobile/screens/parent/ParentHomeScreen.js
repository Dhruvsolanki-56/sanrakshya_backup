import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  InteractionManager,
  RefreshControl,
  StatusBar,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G } from 'react-native-svg';
import LoadingState from '../../components/LoadingState';
import { ageInsights } from '../../data/ageInsights';
import { userService } from '../../services/userService';
import { childrenService } from '../../services/childrenService';
import { enums, storage } from '../../services/storage';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);

/* -------------------------------------------------------------------------- */
/*                            CUSTOM COMPONENTS                               */
/* -------------------------------------------------------------------------- */

const CircularProgress = ({ score = 0, color = '#10B981', size = 120, strokeWidth = 10, label = "SCORE" }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false // Text/Path props need JS driver usually
    }).start();
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Percentage Text Center */}
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B' }}>{Math.round(score)}%</Text>
        <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
      </View>
    </View>
  );
};

const ParentHomeScreen = ({ navigation }) => {
  /* -------------------------------------------------------------------------- */
  /*                               Logic Section                                */
  /* -------------------------------------------------------------------------- */
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { selectChild, reloadChildren } = useSelectedChild();

  // Registration Form Logic (Condensed)
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [showInlineReg, setShowInlineReg] = useState(false);

  const mapChildren = async (apiChildren = []) => {
    return Promise.all(apiChildren.map(async (c, idx) => {
      let avatarSource = null;
      try {
        if (c.photo_url && c.photo_url.startsWith('http')) {
          avatarSource = { uri: c.photo_url };
        } else {
          const src = await userService.getChildPhotoSource(c.child_id || c.id, c.photo_url);
          avatarSource = src;
        }
      } catch (_) { }

      if (!avatarSource || !avatarSource.uri) {
        avatarSource = { uri: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png' };
      }

      // Use backend age fields directly
      const years = c.age_years ?? 0;
      const months = c.age_months ?? 0;
      let ageText = years > 0 ? `${years} Yrs, ${months} Mos` : `${months} Mos`;

      return {
        ...c,
        id: String(c.child_id || idx + 1),
        name: c.name || c.full_name || 'Child',
        avatarSource,
        ageText,
        // Real backend fields
        healthScore: c.growth_dev_progress_percent ?? 0,
        growthLabel: c.growth_dev_progress_label || 'Unknown',
        vaccinationStatus: c.vaccination_status || 'Unknown',
        nextVaccineName: c.next_vaccine_name || null,
        nextVaccineAge: c.next_vaccine_recommended_age || null,
        nutritionStatus: c.nutrition_status || 'Unknown',
        riskLevel: c.risk_level || null,
        illnessAlerts: c.illness_alerts || {},
      };
    }));
  };

  const loadData = useCallback(async ({ forceRefresh = false, showSpinner = false } = {}) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await userService.getParentHome({ forceRefresh });
      setParent(data);
      const mapped = await mapChildren(data?.children || []);
      setChildren(mapped);
      if (mapped.length > 0) {
        const storedId = await storage.getSelectedChildId();
        const idx = mapped.findIndex(c => String(c.id) === String(storedId));
        setCurrentChildIndex(idx >= 0 ? idx : 0);
      }
    } catch (e) {
      console.log(e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData({ showSpinner: !parent }); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData({ forceRefresh: true });
    await reloadChildren();
    setRefreshing(false);
  }, [loadData, reloadChildren]);

  const currentChild = children[currentChildIndex];

  // Quick Action Categories
  const categories = [
    { id: '1', name: 'Records', icon: 'document-text-outline', screen: 'HealthProfile', color: '#3B82F6' },
    { id: '2', name: 'AI Report', icon: 'color-wand-outline', screen: 'AIHealthReports', color: '#8B5CF6' },
    { id: '3', name: 'Diet Plan', icon: 'nutrition-outline', screen: 'NutritionLifestyle', color: '#10B981' },
    { id: '4', name: 'Doctors', icon: 'medkit-outline', screen: 'FindDoctors', color: '#EF4444' },
    { id: '5', name: 'Growth', icon: 'bar-chart-outline', screen: 'GrowthChart', color: '#F59E0B' },
    { id: '6', name: 'Chat', icon: 'chatbubbles-outline', screen: 'BalMitraChat', color: '#6366F1' },
    { id: '7', name: 'Vaccines', icon: 'shield-checkmark-outline', screen: 'VaccinePlanner', color: '#0EA5E9' },
    { id: '8', name: 'Symptom', icon: 'thermometer-outline', screen: 'SymptomChecker', color: '#E11D48' },
  ];

  // Dynamic "For You" Suggestions based on child data
  const generateForYouItems = () => {
    const items = [];
    const child = currentChild;
    if (!child) return items;

    // Age-based insight from ageInsights data
    const ageYears = child.age_years || 0;
    const ageInsight = ageInsights.find(a => a.age === ageYears);
    if (ageInsight) {
      items.push({
        id: 'age',
        title: `Age ${ageYears} Milestones`,
        sub: ageInsight.insight.slice(0, 40) + '...',
        icon: ageInsight.icon,
        color: '#E0E7FF',
        textColor: '#4338CA',
        screen: 'GrowthChart'
      });
    }

    // Vaccination suggestion
    if (child.nextVaccineName) {
      items.push({
        id: 'vaccine',
        title: child.nextVaccineName,
        sub: `Recommended at ${child.nextVaccineAge || 'upcoming age'}`,
        icon: 'shield-checkmark-outline',
        color: child.vaccinationStatus === 'Overdue' ? '#FEE2E2' : '#DCFCE7',
        textColor: child.vaccinationStatus === 'Overdue' ? '#EF4444' : '#15803D',
        screen: 'VaccinePlanner'
      });
    }

    // Nutrition suggestion
    if (child.nutritionStatus === 'Nutrition risk') {
      items.push({
        id: 'nutrition',
        title: 'Nutrition Tips',
        sub: 'Improve diet for better growth',
        icon: 'nutrition-outline',
        color: '#FEF3C7',
        textColor: '#D97706',
        screen: 'NutritionLifestyle'
      });
    } else if (child.nutritionStatus === 'Normal') {
      items.push({
        id: 'nutrition',
        title: 'Keep It Up!',
        sub: 'Nutrition is on track',
        icon: 'leaf-outline',
        color: '#DCFCE7',
        textColor: '#15803D',
        screen: 'NutritionLifestyle'
      });
    }

    // Growth suggestion
    if (child.growthLabel === 'Monitor' || child.growthLabel === 'Needs Action') {
      items.push({
        id: 'growth',
        title: 'Growth Tracking',
        sub: child.growthLabel === 'Needs Action' ? 'Immediate attention needed' : 'Keep monitoring regularly',
        icon: 'bar-chart-outline',
        color: child.growthLabel === 'Needs Action' ? '#FEE2E2' : '#FEF3C7',
        textColor: child.growthLabel === 'Needs Action' ? '#EF4444' : '#D97706',
        screen: 'GrowthChart'
      });
    }

    // Fallback if no specific suggestions
    if (items.length === 0) {
      items.push({
        id: 'default',
        title: 'AI Health Report',
        sub: 'Get personalized insights',
        icon: 'sparkles-outline',
        color: '#F3E8FF',
        textColor: '#7C3AED',
        screen: 'AIHealthReports'
      });
    }

    return items;
  };

  const forYouItems = generateForYouItems();

  if (loading && !children.length) return <LoadingState fullScreen />;

  // Empty State Logic
  if (!children || children.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Welcome to Sanrakshya</Text>
          <Text style={styles.emptyText}>Please add a child profile to get started.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Profile', { screen: 'ChildRegistration' })}>
            <Text style={styles.btnText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* TOP BAR */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>Good Morning,</Text>
            <Text style={styles.headerParentName}>{parent?.full_name || 'Parent'}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtnIcon} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* CHILD SELECTOR */}
        <View style={{ marginBottom: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {children.map((child, idx) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childPill, currentChildIndex === idx && styles.childPillActive]}
                onPress={async () => {
                  setCurrentChildIndex(idx);
                  await storage.saveSelectedChildId(child.id);
                  selectChild(child.id);
                }}
              >
                <Image source={child.avatarSource} style={styles.childPillMsg} />
                {currentChildIndex === idx && <Text style={styles.childPillText}>{child.name.split(' ')[0]}</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.childPillAdd} onPress={() => navigation.navigate('Profile', { screen: 'ChildRegistration' })}>
              <Ionicons name="add" size={22} color="#64748B" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 1. HEALTH SCORE CARD */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            {/* Left: Text & Avatar */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Image source={currentChild?.avatarSource} style={styles.mainAvatar} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.summaryChildName}>{currentChild?.name}</Text>
                  <Text style={styles.summaryChildAge}>
                    {currentChild?.ageText}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: currentChild?.growthLabel === 'On Track' ? '#DCFCE7' : '#FEF3C7' }]}>
                <Ionicons
                  name={currentChild?.growthLabel === 'On Track' ? "shield-checkmark" : "alert-circle"}
                  size={14}
                  color={currentChild?.growthLabel === 'On Track' ? "#15803D" : "#D97706"}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.statusBadgeText, { color: currentChild?.growthLabel === 'On Track' ? "#15803D" : "#D97706" }]}>
                  {currentChild?.growthLabel || 'Unknown'}
                </Text>
              </View>
            </View>

            {/* Right: Circular Progress */}
            {/* Showing 'Health Score' calculated from logic */}
            <CircularProgress
              score={currentChild?.healthScore || 0}
              color={currentChild?.healthScore < 70 ? '#EF4444' : '#10B981'}
              size={84}
              strokeWidth={8}
              label="SCORE"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Growth</Text>
              <Text style={[styles.metricValue, {
                color: currentChild?.growthLabel === 'On Track' ? '#15803D'
                  : currentChild?.growthLabel === 'Monitor' ? '#D97706'
                    : '#EF4444'
              }]}>{currentChild?.growthLabel || 'N/A'}</Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Vaccines</Text>
              <Text style={[styles.metricValue, {
                color: currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' ? '#EF4444'
                  : currentChild?.vaccinationStatus === 'Due Soon' ? '#D97706'
                    : '#15803D'
              }]}>
                {currentChild?.vaccinationStatus || 'Up to Date'}
              </Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Nutrition</Text>
              <Text style={[styles.metricValue, {
                color: currentChild?.nutritionStatus === 'Normal' ? '#15803D'
                  : currentChild?.nutritionStatus === 'Nutrition risk' ? '#EF4444'
                    : '#64748B'
              }]}>{currentChild?.nutritionStatus || 'Pending'}</Text>
            </View>
          </View>
        </View>

        {/* 2. RISK & ALERTS SECTION - Color coded: Red (critical), Yellow (warning), Green (info) */}
        {(currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.riskLevel || currentChild?.growthLabel === 'Needs Action' || Object.keys(currentChild?.illnessAlerts || {}).length > 0) && (
          <View style={styles.alertSection}>
            <LinearGradient
              colors={
                (currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action')
                  ? ['#FEF2F2', '#FFF1F2'] // Red theme
                  : currentChild?.growthLabel === 'Monitor'
                    ? ['#FFFBEB', '#FEF3C7'] // Yellow theme
                    : ['#F0FDF4', '#DCFCE7'] // Green theme
              }
              style={styles.alertCard}
            >
              <View style={[styles.alertIconBox, {
                backgroundColor: (currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action')
                  ? '#FEE2E2'
                  : currentChild?.growthLabel === 'Monitor' ? '#FEF3C7' : '#DCFCE7'
              }]}>
                <Ionicons
                  name={(currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action') ? "warning" : "information-circle"}
                  size={24}
                  color={(currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action') ? '#EF4444' : currentChild?.growthLabel === 'Monitor' ? '#D97706' : '#15803D'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, {
                  color: (currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action')
                    ? '#B91C1C'
                    : currentChild?.growthLabel === 'Monitor' ? '#92400E' : '#166534'
                }]}>
                  {(currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action')
                    ? 'Urgent Attention Needed'
                    : currentChild?.growthLabel === 'Monitor' ? 'Monitor Recommended' : 'Health Update'}
                </Text>
                <Text style={[styles.alertText, {
                  color: (currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action')
                    ? '#7F1D1D'
                    : currentChild?.growthLabel === 'Monitor' ? '#78350F' : '#14532D'
                }]}>
                  {(currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed')
                    ? `${currentChild.nextVaccineName || 'Vaccination'} is overdue`
                    : currentChild?.growthLabel === 'Needs Action' ? 'Growth needs immediate attention'
                      : (currentChild?.riskLevel || 'Regular checkup suggested')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.alertActionBtn, {
                  borderColor: (currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action')
                    ? '#FECACA' : currentChild?.growthLabel === 'Monitor' ? '#FDE68A' : '#BBF7D0'
                }]}
                onPress={() => navigation.navigate((currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed') ? 'VaccinePlanner' : 'GrowthChart')}
              >
                <Text style={[styles.alertActionText, {
                  color: (currentChild?.vaccinationStatus === 'Overdue' || currentChild?.vaccinationStatus === 'Missed' || currentChild?.growthLabel === 'Needs Action')
                    ? '#EF4444' : currentChild?.growthLabel === 'Monitor' ? '#D97706' : '#15803D'
                }]}>Check</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* 3. QUICK ACTIONS GRID */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.gridContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.gridItem}
              onPress={() => navigation.navigate(cat.screen)}
            >
              <View style={[styles.gridIcon, { backgroundColor: cat.color + '10' }]}>
                <Ionicons name={cat.icon} size={24} color={cat.color} />
              </View>
              <Text style={styles.gridText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. FOR YOU SUGGESTIONS */}
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.sectionHeader}>For You</Text>
            <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 13 }}>See All</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {forYouItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.forYouCard}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.forYouImageInfo, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={24} color={item.textColor} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.forYouTitle, { color: item.textColor }]}>{item.title}</Text>
                  <Text style={styles.forYouSub} numberOfLines={1}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 100 },

  /* Header */
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerGreeting: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  headerParentName: { fontSize: 24, color: '#1E293B', fontWeight: '700' },
  profileBtnIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

  /* Child Selector */
  childPill: { flexDirection: 'row', alignItems: 'center', padding: 4, marginRight: 10, borderRadius: 30, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  childPillActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF', paddingRight: 12 },
  childPillMsg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  childPillText: { marginLeft: 8, fontWeight: '700', fontSize: 13, color: '#1E293B' },
  childPillAdd: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },

  /* Health Card Redesigned */
  summaryCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9' },
  summaryChildName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  summaryChildAge: { fontSize: 14, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  statusBadgeText: { color: '#15803D', fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '700' },
  verticalLine: { width: 1, height: 30, backgroundColor: '#F1F5F9' },

  /* Risk & Alerts */
  alertSection: { marginBottom: 24 },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  alertIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#B91C1C' },
  alertText: { fontSize: 12, color: '#7F1D1D', marginTop: 2 },
  alertActionBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  alertActionText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },

  /* Grid */
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '23%', alignItems: 'center', marginBottom: 20 },
  gridIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 11, color: '#475569', fontWeight: '600', textAlign: 'center' },

  /* For You */
  forYouCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, marginRight: 16, width: width * 0.7, borderWidth: 1, borderColor: '#F1F5F9' },
  forYouImageInfo: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  forYouTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  forYouSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  /* Empty State */
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#64748B', marginBottom: 30 },
  primaryButton: { backgroundColor: '#3B82F6', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '700' },

});

export default ParentHomeScreen;
