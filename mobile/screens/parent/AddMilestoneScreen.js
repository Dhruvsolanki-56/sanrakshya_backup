import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  KeyboardAvoidingView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle as SvgCircle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { milestonesService } from '../../services/milestonesService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width, height } = Dimensions.get('window');

// --- Enhanced FX Components ---

const HoldButton = ({ onPress, text, loading }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef(null);
  const HOLD_DURATION = 1200; // Longer for more anticipation

  useEffect(() => {
    // Only run shimmer animation when button is visible in the bottom sheet
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.delay(1000)
      ])
    );
    anim.start();
    return () => anim.stop(); // Cleanup on unmount
  }, []);

  const handlePressIn = () => {
    if (loading) return;
    setIsHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.parallel([
      Animated.spring(scale, { toValue: 0.95, friction: 5, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: HOLD_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: false })
    ]).start();

    holdTimer.current = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPress();
      progress.setValue(0); // Reset immediately after strict success
    }, HOLD_DURATION);
  };

  const handlePressOut = () => {
    if (loading) return;
    setIsHolding(false);
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    Animated.timing(progress, { toValue: 0, duration: 300, easing: Easing.bounce, useNativeDriver: false }).start();
  };

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const shimmerTranslate = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-100, 400] });

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.saveBtnOuter, { transform: [{ scale }] }]}>
        <View style={[styles.saveBtnBg, { backgroundColor: '#4338CA' }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#6366F1', width: progressWidth }]} />
          {/* Shimmer Effect */}
          <Animated.View style={[styles.shimmerBar, { transform: [{ translateX: shimmerTranslate }] }]} />
        </View>
        <View style={styles.saveBtnContent}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.saveText}>{isHolding ? 'Keep holding...' : text}</Text>
              <Ionicons name={isHolding ? "lock-open" : "lock-closed"} size={20} color="#FFF" />
            </>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const Particle = ({ delay, type, color, startX, startY }) => {
  const translateY = useRef(new Animated.Value(startY)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 2000 + Math.random() * 1500;
    const xOffset = (Math.random() - 0.5) * 300;

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: height + 100, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: startX + xOffset, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 360 * (Math.random() > 0.5 ? 1 : -1), duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.spring(scale, { toValue: Math.random() * 0.5 + 0.5, useNativeDriver: true }),
          Animated.delay(duration * 0.6),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true })
        ])
      ]).start();
    }, delay);
  }, []);

  const rotateStr = rotate.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

  return (
    <Animated.View style={[
      styles.particle,
      {
        backgroundColor: color,
        width: type === 'confetti' ? 8 : 12,
        height: type === 'confetti' ? 8 : 12,
        borderRadius: type === 'confetti' ? 2 : 6,
        transform: [{ translateX }, { translateY }, { rotate: rotateStr }, { scale }],
        opacity
      }
    ]}>
      {type === 'star' && <Ionicons name="star" size={10} color="#FFF" />}
    </Animated.View>
  );
};

const CelebrationOverlay = ({ visible, onClose, milestoneName, isSpecial }) => {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const centralScale = useRef(new Animated.Value(0)).current;
  const centralRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;

  // Continuous animations
  const glowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // 1. Reset values
      backdropOpacity.setValue(0);
      centralScale.setValue(0);
      centralRotate.setValue(0);
      ringScale.setValue(0);
      ringRotate.setValue(0);
      trophyScale.setValue(0);
      textOpacity.setValue(0);
      textTranslate.setValue(50);

      // 2. Main Animation - All at once, no waiting!
      Animated.parallel([
        // Backdrop fades in quickly
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),

        // Portal elements scale up (decorative, runs in background)
        Animated.timing(centralScale, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),

        // Continuous rotations (background, don't block anything)
        Animated.timing(centralRotate, { toValue: 1, duration: 15000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(ringRotate, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true }),

        // TROPHY - appears IMMEDIATELY with a pop
        Animated.timing(trophyScale, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),

        // TEXT - appears right after trophy (tiny delay)
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(textTranslate, { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true })
          ])
        ])
      ]).start();

      // Continuous Pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1.2, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
        ])
      ).start();

    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(centralScale, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(trophyScale, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Interpolations
  const rotateStr = centralRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateCounterStr = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  // Generate Starfield
  const stars = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: Math.random() * width,
    top: Math.random() * height,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 1000
  }));

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={styles.overlayContainer}>
        {/* Dark Backdrop */}
        <Animated.View style={[styles.overlayBg, { opacity: backdropOpacity }]}>
          <LinearGradient colors={['#1e1b4b', '#0f172a']} style={StyleSheet.absoluteFill} />
          {/* Stars */}
          {stars.map(s => (
            <View key={s.id} style={{
              position: 'absolute',
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              backgroundColor: '#FFF',
              borderRadius: s.size / 2,
              opacity: 0.6
            }} />
          ))}
        </Animated.View>

        <View style={{ alignItems: 'center', justifyContent: 'center' }}>

          {/* Layer 1: Outer Rotating Ring (Magical Circle) */}
          <Animated.View style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: 150,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderStyle: 'dashed',
            overflow: 'hidden', // Fix: Clip the square gradient inside
            transform: [{ scale: ringScale }, { rotate: rotateCounterStr }]
          }}>
            <LinearGradient colors={['transparent', 'rgba(99, 102, 241, 0.4)', 'transparent']} style={StyleSheet.absoluteFill} />
          </Animated.View>

          {/* Layer 2: Inner Pulsing Orb */}
          <Animated.View style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: isSpecial ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            transform: [{ scale: centralScale }, { rotate: rotateStr }]
          }}>
            <View style={{ position: 'absolute', top: 0, left: 95, width: 10, height: 10, backgroundColor: '#FFF', borderRadius: 5, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 10 }} />
            <View style={{ position: 'absolute', bottom: 0, left: 95, width: 10, height: 10, backgroundColor: '#FFF', borderRadius: 5, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 10 }} />
          </Animated.View>

          {/* Layer 3: Central Glow Pulse */}
          <Animated.View style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: isSpecial ? '#FCD34D' : '#818CF8',
            opacity: 0.3,
            transform: [{ scale: glowPulse }]
          }} />

          {/* Layer 4: The Trophy Badge (Main Focus) */}
          <Animated.View style={{ transform: [{ scale: trophyScale }] }}>
            <LinearGradient
              colors={isSpecial ? ['#FFFbeb', '#FCD34D'] : ['#EEF2FF', '#C7D2FE']}
              style={[styles.magicBadge, { overflow: 'hidden', borderRadius: 70 }]}
            >
              <Ionicons name="trophy" size={64} color={isSpecial ? '#D97706' : '#4338CA'} />
              {/* Glossy shine - fully rounded */}
              <View style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.35)' }} />
            </LinearGradient>
          </Animated.View>

        </View>

        {/* Text Content */}
        <Animated.View style={{ marginTop: 60, alignItems: 'center', opacity: textOpacity, transform: [{ translateY: textTranslate }] }}>
          <Text style={styles.magicTitle}>UNLOCKED!</Text>
          <Text style={styles.magicSub}>{milestoneName}</Text>

          {isSpecial && (
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.magicSpecialTag}>
              <Ionicons name="star" size={14} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>SPECIAL MEMORY</Text>
            </LinearGradient>
          )}

          <TouchableOpacity style={styles.magicBtn} onPress={onClose}>
            <Text style={styles.magicBtnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </Modal>
  );
};

const AddMilestoneScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    childName: '',
    milestoneName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    subFeatures: [],
    special: false,
    difficulty: 'Normal',
  });

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
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [readyToFetch, setReadyToFetch] = useState(false);

  // Date Picker State
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selDay, setSelDay] = useState(new Date().getDate());

  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSavedMilestone, setLastSavedMilestone] = useState('');
  const [lastSavedSpecial, setLastSavedSpecial] = useState(false);

  // Detail Sheet State
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const today = new Date();
  const tenYearsAgo = new Date(new Date().setFullYear(today.getFullYear() - 10));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const itemGradients = [
    ['#8B5CF6', '#6366F1'],
    ['#F59E0B', '#D97706'],
    ['#10B981', '#059669'],
    ['#EC4899', '#DB2777'],
    ['#3B82F6', '#2563EB'],
    ['#6366F1', '#4F46E5'],
  ];

  const updateFormData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const getAgeTextForChild = (child) => {
    if (!child) return '';
    const yearsFromApi = typeof child.ageYears === 'number' ? (child.ageYears ?? 0) : null;
    const monthsFromApi = typeof child.ageMonths === 'number' ? (child.ageMonths ?? 0) : null;
    if (yearsFromApi != null || monthsFromApi != null) {
      return `${yearsFromApi}y ${monthsFromApi}m`;
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
      setShowChildModal(false);
      setShowDateModal(false);
      setFormData(prev => ({
        ...prev,
        milestoneName: '',
        subFeatures: [],
        date: new Date().toISOString().split('T')[0],
        special: false,
        difficulty: 'Normal',
        notes: '',
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

  const selectNode = (name, disabled) => {
    if (disabled) return;
    Haptics.selectionAsync();
    updateFormData('milestoneName', name);
    // Reset form for new selection - Default all subFeatures to CHECKED
    const selectedMilestone = groupedByName.find(m => m.milestone_name === name);
    const allSubFeatures = [];
    if (selectedMilestone?.sub1) allSubFeatures.push(selectedMilestone.sub1);
    if (selectedMilestone?.sub2) allSubFeatures.push(selectedMilestone.sub2);
    if (selectedMilestone?.sub3) allSubFeatures.push(selectedMilestone.sub3);

    updateFormData('subFeatures', allSubFeatures);
    updateFormData('special', false);
    updateFormData('difficulty', 'Normal');
    updateFormData('notes', '');
    updateFormData('date', new Date().toISOString().split('T')[0]);

    setShowDetailSheet(true);
  };

  const toggleSubFeature = (sf) => {
    if (!sf) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => {
      const base = Array.isArray(prev.subFeatures) ? prev.subFeatures : [];
      const exists = base.includes(sf);
      // Fix: If exists, remove it. If not, add it.
      const next = exists ? base.filter(x => x !== sf) : [...base, sf];
      return { ...prev, subFeatures: next };
    });
  };

  const handleSave = async () => {
    if (submitting) return;
    const selected = groupedByName.find(x => x.milestone_name === formData.milestoneName);
    const milestoneId = selected?.id;
    if (!milestoneId) return;

    const payload = {
      milestone_id: milestoneId,
      achieved_date: formData.date,
      difficulty: formData.difficulty,
      special_milestone: !!formData.special,
      notes: formData.notes,
    };
    try {
      setSubmitting(true);
      const res = await milestonesService.create(currentChild.id || currentChild.child_id, payload);
      const ok = (res?.data?.id) || (res?.id);

      if (ok) {
        setLastSavedMilestone(formData.milestoneName);
        setLastSavedSpecial(formData.special);
        setShowDetailSheet(false);
        // Delay celebration show slightly to allow modal to close smoothly
        setTimeout(() => setShowCelebration(true), 300);
        try { await loadMilestones(currentChild.id || currentChild.child_id); } catch (_) { }
      } else {
        Alert.alert('Error', 'Unexpected response from server');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save milestone');
    } finally {
      setSubmitting(false);
    }
  };

  // Date Utilities
  const fmt = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const fmtDisplay = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mon = monthNames[dt.getMonth()];
    const yyyy = dt.getFullYear();
    return `${dd} ${mon} ${yyyy}`;
  };
  const setSelectionsFromISO = (iso) => {
    const base = iso ? new Date(iso) : today;
    setSelYear(base.getFullYear());
    setSelMonth(base.getMonth() + 1);
    setSelDay(base.getDate());
  };
  const getYearOptions = () => {
    const years = [];
    for (let y = today.getFullYear(); y >= tenYearsAgo.getFullYear(); y--) years.push(y);
    return years;
  };
  const getMonthOptions = () => {
    const arr = [];
    for (let m = 1; m <= 12; m++) arr.push(m);
    return arr;
  };
  const getDayOptions = () => {
    const daysInM = new Date(selYear, selMonth, 0).getDate();
    const arr = [];
    for (let d = 1; d <= daysInM; d++) arr.push(d);
    return arr;
  };

  // --- Journey Path Generation ---
  const nodeGap = 100;
  const startY = 100; // Lowered from 60 to make it more visible
  const pathHeight = Math.max(height, groupedByName.length * nodeGap + 150);

  const generatePath = () => {
    if (!groupedByName.length) return '';
    let d = `M ${width / 2} ${startY}`;
    groupedByName.forEach((_, i) => {
      const isLeft = i % 2 === 0;
      const x = isLeft ? width * 0.25 : width * 0.75;
      const y = startY + (i + 1) * nodeGap;

      const prevX = i === 0 ? width / 2 : (i % 2 !== 0 ? width * 0.25 : width * 0.75);
      const prevY = startY + i * nodeGap;

      const cp1x = prevX;
      const cp1y = prevY + nodeGap * 0.5;
      const cp2x = x;
      const cp2y = y - nodeGap * 0.5;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    });
    return d;
  };
  const journeyPath = useMemo(() => generatePath(), [groupedByName]);


  return (
    <>
      <View style={styles.container}>
        <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

        {/* Subtle Grid Pattern for "Engineering" look */}
        <View style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} pointerEvents="none">
          <Svg height="100%" width="100%">
            <Defs>
              <SvgLinearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#E2E8F0" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#E2E8F0" stopOpacity="1" />
                <Stop offset="1" stopColor="#E2E8F0" stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>
            {Array.from({ length: 10 }).map((_, i) => (
              <Path key={i} d={`M ${width / 10 * i} 0 L ${width / 10 * i} ${height}`} stroke="url(#gridGrad)" strokeWidth="1" />
            ))}
          </Svg>
        </View>

        <SafeAreaView style={{ flex: 1 }}>
          <ScreenHeader title="Milestone Journey" onBackPress={() => navigation.goBack()} />

          {(loading || bootLoading || listLoading) ? (
            <LoadingState fullScreen />
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

              {/* Child Passport Card */}
              <TouchableOpacity style={styles.passportCard} onPress={() => setShowChildModal(true)} activeOpacity={0.9}>
                <LinearGradient colors={['#4338CA', '#3730A3']} style={styles.passportHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.passportRow}>
                    <View style={styles.passportAvatarContainer}>
                      {currentChild?.avatar ? (
                        <Image source={{ uri: currentChild.avatar }} style={styles.passportAvatar} />
                      ) : (
                        <View style={[styles.passportAvatar, { backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ fontSize: 20, fontWeight: '700', color: '#4338CA' }}>{(currentChild?.name || '').charAt(0)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={styles.passportLabel}>CURRENT EXPLORER</Text>
                      <Text style={styles.passportName}>{currentChild?.name || 'Select Child'}</Text>
                      <Text style={styles.passportDetail}>{getAgeTextForChild(currentChild)} old</Text>
                    </View>
                    <View style={styles.changeBtn}>
                      <Text style={styles.changeBtnText}>CHANGE</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Journey Map */}
              <View style={{ minHeight: pathHeight, marginTop: 20 }}>
                <Svg height={pathHeight} width={width} style={StyleSheet.absoluteFill}>
                  <Path
                    d={journeyPath}
                    stroke="#CBD5E1"
                    strokeWidth="3"
                    strokeDasharray="8, 6"
                    fill="none"
                  />
                </Svg>

                {/* Start Node */}
                <View style={[styles.nodeContainer, { left: width / 2 - 24, top: startY - 24 }]}>
                  <View style={styles.startNode}>
                    <Ionicons name="flag" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.startLabel}>START</Text>
                </View>

                {groupedByName.map((m, idx) => {
                  const isLeft = idx % 2 === 0;
                  const x = isLeft ? width * 0.25 : width * 0.75;
                  const y = startY + (idx + 1) * nodeGap;
                  const isArchived = m.is_archived;

                  const grad = itemGradients[idx % itemGradients.length];
                  const icons = ['trophy', 'bulb', 'ribbon', 'star', 'heart', 'medkit'];
                  const icon = icons[idx % icons.length];

                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[
                        styles.nodeContainer,
                        { left: x - 30, top: y - 30 }
                      ]}
                      onPress={() => selectNode(m.milestone_name, isArchived)}
                      activeOpacity={0.8}
                      disabled={isArchived}
                    >
                      <View style={[styles.nodeRing, isArchived && { borderColor: '#10B981', borderWidth: 2 }]}>
                        {isArchived ? (
                          <LinearGradient colors={['#10B981', '#059669']} style={styles.nodeFill}>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                          </LinearGradient>
                        ) : (
                          <LinearGradient colors={['#FFF', '#FFF']} style={styles.nodeFill}>
                            <Ionicons name={icon} size={20} color={grad[0]} />
                          </LinearGradient>
                        )}
                      </View>
                      {/* Label ABOVE the node */}
                      <View style={styles.nodeLabelAbove}>
                        <Text
                          style={[styles.nodeLabelText, isArchived && { color: '#10B981' }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {m.milestone_name}
                        </Text>
                        {isArchived && (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                            <Text style={styles.completedText}>Done</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </ScrollView>
          )}

          {/* Detail Sheet Modal */}
          <Modal visible={showDetailSheet} transparent animationType="slide" onRequestClose={() => setShowDetailSheet(false)}>
            <View style={styles.sheetBackdrop}>
              {/* Backdrop - tap to close */}
              <TouchableWithoutFeedback onPress={() => setShowDetailSheet(false)}>
                <View style={{ flex: 1 }} />
              </TouchableWithoutFeedback>

              {/* Sheet Content - touches don't propagate */}
              <View style={styles.detailSheet}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.sheetIconBox}>
                    <Ionicons name="trophy" size={28} color="#D97706" />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.sheetTitle}>{formData.milestoneName}</Text>
                    <Text style={styles.sheetSub}>Record this memory</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailSheet(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="#1E293B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: height * 0.55 }} showsVerticalScrollIndicator={false}>
                  {/* Characteristics */}
                  <Text style={styles.formLabel}>OBSERVATIONS</Text>
                  <View style={styles.checklistCard}>
                    {(() => {
                      const sel = groupedByName.find(x => x.milestone_name === formData.milestoneName);
                      const items = [sel?.sub1, sel?.sub2, sel?.sub3].filter(Boolean);
                      if (!items.length) return <Text style={{ color: '#94A3B8', padding: 16, fontStyle: 'italic' }}>No specific requirements.</Text>;
                      return items.map((sf, i) => {
                        // Always checked, read-only
                        return (
                          <View key={i} style={styles.checkRow}>
                            <View style={[styles.checkbox, { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }]}>
                              <Ionicons name="checkmark" size={14} color="#FFF" />
                            </View>
                            <Text style={[styles.checkText, { color: '#1E293B', fontWeight: 'bold' }]}>{sf}</Text>
                          </View>
                        );
                      });
                    })()}
                  </View>

                  {/* Date */}
                  <Text style={styles.formLabel}>DATE ACHIEVED</Text>
                  <TouchableOpacity style={styles.inputCard} onPress={() => { setSelectionsFromISO(formData.date); setShowDateModal(true); }}>
                    <View style={styles.inputIconBox}><MaterialCommunityIcons name="calendar-month" size={22} color="#4F46E5" /></View>
                    <Text style={styles.inputValue}>{fmtDisplay(formData.date)}</Text>
                    <View style={styles.editBadge}><Text style={styles.editBadgeText}>EDIT</Text></View>
                  </TouchableOpacity>

                  {/* Difficulty */}
                  <Text style={styles.formLabel}>DIFFICULTY LEVEL</Text>
                  <View style={styles.diffRow}>
                    {[{ k: 'Easy', c: '#10B981', i: 'arrow-down' }, { k: 'Normal', c: '#F59E0B', i: 'remove' }, { k: 'Hard', c: '#EF4444', i: 'arrow-up' }, { k: 'Challenging', c: '#7C3AED', i: 'alert-circle' }].map((o) => {
                      const active = formData.difficulty === o.k;
                      return (
                        <TouchableOpacity key={o.k} style={[styles.diffChip, active && { backgroundColor: o.c, borderColor: o.c }, { width: '48%', marginBottom: 10, flex: 0 }]} onPress={() => updateFormData('difficulty', o.k)}>
                          <Ionicons name={o.i} size={14} color={active ? '#FFF' : o.c} style={{ marginRight: 4 }} />
                          <Text style={[styles.diffChipText, active && { color: '#FFF' }, { fontSize: 10 }]} numberOfLines={1}>{o.k}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Notes Removed */}

                  {/* Special */}
                  <TouchableOpacity style={[styles.specialToggle, formData.special && { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]} onPress={() => updateFormData('special', !formData.special)}>
                    <View style={[styles.specialCheck, formData.special && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}>
                      {formData.special && <Ionicons name="star" size={14} color="#FFF" />}
                    </View>
                    <Text style={[styles.specialText, formData.special && { color: '#D97706', fontWeight: 'bold' }]}>Mark as Special Memory</Text>
                  </TouchableOpacity>

                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={{ marginTop: 10, marginBottom: Platform.OS === 'ios' ? 20 : 0 }}>
                  <HoldButton text="Hold to Save Memory" onPress={handleSave} loading={submitting} />
                </View>

                {/* Date Picker Overlay (Inside Sheet) */}
                {showDateModal && (
                  <View style={StyleSheet.absoluteFillObject}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                      <View style={styles.dateModalCard}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        <View style={styles.datePickerContainer}>
                          <View style={styles.wheelCol}>
                            <Text style={styles.wheelLabel}>Year</Text>
                            <ScrollView style={styles.wheelScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                              {getYearOptions().map(y => (
                                <TouchableOpacity key={y} onPress={() => setSelYear(y)} style={[styles.wheelItem, selYear === y && styles.wheelItemActive]}>
                                  <Text style={[styles.wheelText, selYear === y && styles.wheelTextActive]}>{y}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                          <View style={styles.wheelCol}>
                            <Text style={styles.wheelLabel}>Month</Text>
                            <ScrollView style={styles.wheelScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                              {getMonthOptions().map(m => (
                                <TouchableOpacity key={m} onPress={() => setSelMonth(m)} style={[styles.wheelItem, selMonth === m && styles.wheelItemActive]}>
                                  <Text style={[styles.wheelText, selMonth === m && styles.wheelTextActive]}>{monthNames[m - 1]}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                          <View style={styles.wheelCol}>
                            <Text style={styles.wheelLabel}>Day</Text>
                            <ScrollView style={styles.wheelScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                              {getDayOptions().map(d => (
                                <TouchableOpacity key={d} onPress={() => setSelDay(d)} style={[styles.wheelItem, selDay === d && styles.wheelItemActive]}>
                                  <Text style={[styles.wheelText, selDay === d && styles.wheelTextActive]}>{d}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </View>
                        <View style={styles.modalActions}>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDateModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            const d = new Date(selYear, selMonth - 1, selDay);
                            if (d > new Date()) {
                              Alert.alert('Invalid Date', 'You cannot select a future date for a milestone.');
                              return;
                            }
                            updateFormData('date', fmt(d));
                            setShowDateModal(false);
                          }}>
                            <Text style={styles.confirmBtnText}>Set Date</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Modal>


          {/* Child Modal */}
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

          {/* Celebration Overlay */}
          <CelebrationOverlay
            visible={showCelebration}
            onClose={() => setShowCelebration(false)}
            milestoneName={lastSavedMilestone}
            isSpecial={lastSavedSpecial}
          />

        </SafeAreaView>
      </View>

    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  passportCard: { marginHorizontal: 20, marginTop: 16, marginBottom: 8, borderRadius: 24, overflow: 'hidden', shadowColor: '#4338CA', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  passportHeader: { padding: 20 },
  passportRow: { flexDirection: 'row', alignItems: 'center' },
  passportAvatarContainer: { padding: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30 },
  passportAvatar: { width: 48, height: 48, borderRadius: 24 },
  passportLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  passportName: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  passportDetail: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  changeBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  changeBtnText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  nodeContainer: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  nodeRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, backgroundColor: '#FFF', elevation: 4 },
  nodeFill: { flex: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  startNode: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#64748B', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1 },
  startLabel: { position: 'absolute', top: 42, fontSize: 10, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5 },

  // Labels positioned ABOVE the node
  nodeLabelAbove: { position: 'absolute', bottom: 58, alignItems: 'center', width: width * 0.35 },
  nodeLabelText: { fontSize: 11, fontWeight: '700', color: '#1E293B', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  completedText: { fontSize: 9, color: '#10B981', fontWeight: '700', marginLeft: 3 },

  // Sheet
  // Sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }, // Removed black overlay
  detailSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sheetIconBox: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', lineHeight: 24 },
  sheetSub: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  closeBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },

  formLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 8, marginTop: 16, letterSpacing: 1 },
  checklistCard: { backgroundColor: '#F8FAFC', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkText: { fontSize: 14, color: '#334155', fontWeight: '500' },

  inputCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  inputIconBox: { width: 32, height: 32, backgroundColor: '#E0E7FF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  inputValue: { fontSize: 16, color: '#1E293B', fontWeight: '700' },
  editBadge: { marginLeft: 'auto', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  editBadgeText: { fontSize: 10, color: '#4F46E5', fontWeight: '800' },

  diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  diffChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: '#F1F5F9', backgroundColor: '#FFF' },
  diffChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  sheetInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, height: 90, textAlignVertical: 'top', color: '#1E293B', fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0' },

  specialToggle: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16, backgroundColor: '#FFF' },
  specialCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  specialText: { marginLeft: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },

  // Shared Styles
  saveBtnOuter: { height: 58, borderRadius: 29, overflow: 'hidden', shadowColor: '#4338CA', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveBtnBg: { ...StyleSheet.absoluteFillObject },
  saveBtnContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginRight: 8, letterSpacing: 0.5 },
  shimmerBar: { width: 50, height: '100%', backgroundColor: 'rgba(255,255,255,0.3)', position: 'absolute', transform: [{ skewX: '-15deg' }] },

  // Improved Date Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dateModalCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 180, marginBottom: 20 },
  wheelCol: { flex: 1, marginHorizontal: 4 },
  wheelLabel: { textAlign: 'center', color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  wheelScroll: { backgroundColor: '#F8FAFC', borderRadius: 12 },
  wheelItem: { paddingVertical: 10, alignItems: 'center' },
  wheelItemActive: { backgroundColor: '#EEF2FF' },
  wheelText: { fontSize: 16, color: '#64748B' },
  wheelTextActive: { color: '#4F46E5', fontWeight: '800' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#4F46E5', alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: '700' },
  confirmBtnText: { color: '#FFF', fontWeight: '700' },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  sheetAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  sheetName: { flex: 1, fontSize: 16, color: '#1E293B' },

  // Enhanced FX Styles
  overlayContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)' },
  celebrationCardModal: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 32, paddingVertical: 40, paddingHorizontal: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 20, overflow: 'hidden' },
  iconContainer: { marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  iconCircleLarge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },

  sheetName: { fontSize: 16, color: '#1E293B', flex: 1, fontWeight: '500' },
  sheetAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },

  // --- CELEBRATION 3.0 STYLES ---
  overlayContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayBg: { ...StyleSheet.absoluteFillObject }, // Will contain the starfield
  celebrationCardModal: {
    // This isn't a traditional 'card' anymore, but the container for the central reveal
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 30 },

  magicBadge: {
    width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 25,
    overflow: 'hidden', // Clips the square shine animation to the circle
  },
  shimmerLine: { position: 'absolute', width: 40, height: 200, backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ rotate: '45deg' }] }, // Helper for shimmer
  shineLine: { position: 'absolute', width: 40, height: 200, backgroundColor: 'rgba(255,255,255,0.5)', transform: [{ rotate: '25deg' }] },
  glow: { position: 'absolute', top: 30, width: 100, height: 100, borderRadius: 50, backgroundColor: '#F59E0B', opacity: 0.6, transform: [{ scale: 1.5 }] },

  magicTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 2, textAlign: 'center', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  magicSub: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 24, maxWidth: '80%' },

  magicSpecialTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 30 },

  magicBtn: {
    backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 30,
    shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
    flexDirection: 'row', alignItems: 'center'
  },
  magicBtnText: { color: '#4F46E5', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});

export default AddMilestoneScreen;
