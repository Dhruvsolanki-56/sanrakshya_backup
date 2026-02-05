import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  StatusBar,
  TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { childrenService } from '../../services/childrenService';
import { userService } from '../../services/userService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');

const HealthProfileScreen = ({ navigation, route }) => {
  const childIdFromRoute = route?.params?.childId ?? null;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Avatar & Helpers
  const [avatarSource, setAvatarSource] = useState(null);

  // Modals
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [bloodGroupInput, setBloodGroupInput] = useState('');
  const [updatingBlood, setUpdatingBlood] = useState(false);

  const {
    children,
    selectedChild,
    selectedChildId,
    selectChild,
  } = useSelectedChild();

  const currentChild = useMemo(() => {
    // If route has param, try to find that child, else context child
    if (childIdFromRoute) return children.find(c => String(c.id) === String(childIdFromRoute)) || selectedChild;
    return selectedChild;
  }, [childIdFromRoute, selectedChild, children]);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // 1. Data Loading
  const loadSummary = async () => {
    const targetId = currentChild?.id;
    if (!targetId) return;

    try {
      if (!refreshing) setLoading(true);
      setError('');

      // Parallel Fetch: Profile Summary + Full Child Details (for DOB) + Avatar
      const [resp, childDetailsResp, avatarSrc] = await Promise.all([
        childrenService.getProfileSummary(targetId),
        childrenService.getChild(targetId),
        userService.getChildPhotoSource(targetId, currentChild?.photo_url || currentChild?.avatar_url)
      ]);

      const profileData = resp?.data ?? resp;
      const childData = childDetailsResp?.data ?? childDetailsResp;

      // Merge child details into profile for easy access
      setProfile({
        ...profileData,
        // Ensure DOB and demographics come from child details API
        dob: childData?.date_of_birth || childData?.dob || profileData?.dob,
        blood_group: childData?.blood_group || profileData?.blood_group,
        gender: childData?.gender || profileData?.gender,
        full_name: childData?.name || childData?.full_name || profileData?.full_name,
      });
      setAvatarSource(avatarSrc);

      // Animate In
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
      ]).start();

    } catch (e) {
      console.log('Load Error', e);
      // Fallback for avatar if profile fails
      try {
        const src = await userService.getChildPhotoSource(targetId, currentChild?.photo_url);
        setAvatarSource(src);
      } catch (ee) { }
      setError('Could not load passport data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [currentChild?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  // 2. Actions
  const handleUpdateBloodGroup = async (bg) => {
    if (!bg) return;
    setUpdatingBlood(true);
    try {
      // Assume childrenService has update feature or patch
      await childrenService.updateChild(currentChild.id, { blood_group: bg });
      setProfile(prev => ({ ...prev, blood_group: bg }));
      setBloodGroupInput('');
      setShowBloodModal(false);
      // Optional: Reload context
    } catch (e) {
      alert('Failed to update blood group');
    } finally {
      setUpdatingBlood(false);
    }
  };

  // 3. Helpers
  const getDetailedAge = (dob) => {
    if (!dob) return 'Unknown Age';
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return 'Unknown Age';

    const now = new Date();
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    if (now.getDate() < birthDate.getDate()) months--;
    if (months < 0) { years--; months += 12; }

    if (years === 0) return `${months} Months`;
    if (months === 0) return `${years} Years`;
    return `${years}Y ${months}M`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* -------------------------------------------------------------------------- */
  /*                               UI RENDER                                    */
  /* -------------------------------------------------------------------------- */

  if ((loading && !refreshing) || !currentChild) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: '#64748B', fontWeight: '500' }}>Loading Passport...</Text>
      </View>
    );
  }

  const riskLevel = profile?.risk?.level || 'Green'; // Green, Yellow, Red
  const riskColor = riskLevel === 'Red' ? '#EF4444' : riskLevel === 'Yellow' ? '#F59E0B' : '#10B981';
  // Use profile blood group if available, else currentChild (API variance), else fallback
  const displayBlood = profile?.blood_group || currentChild?.bloodGroup || currentChild?.blood_group || 'N/A';
  const displayGender = profile?.gender || currentChild?.gender || 'N/A';
  const dobRaw = profile?.dob || currentChild?.dobRaw || currentChild?.date_of_birth || currentChild?.dob;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerSelector} onPress={() => setShowChildSelector(true)}>
            <Text style={styles.headerTitle}>Health Passport</Text>
            <View style={styles.childBadge}>
              <Text style={styles.childBadgeText}>{currentChild.name.split(' ')[0]}</Text>
              <Ionicons name="chevron-down" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
        >
          {/* 1. PASSPORT IDENTITY CARD */}
          <Animated.View style={[styles.passportCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Dynamic Background Gradient based on Risk */}
            <LinearGradient
              colors={
                riskLevel === 'Red' ? ['#EF4444', '#B91C1C']
                  : riskLevel === 'Yellow' ? ['#F59E0B', '#B45309']
                    : ['#10B981', '#059669']
              }
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Dynamic Background Pattern/Artifacts */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {riskLevel === 'Red' && (
                <>
                  <Ionicons name="warning" size={140} color="rgba(0,0,0,0.1)" style={{ position: 'absolute', right: -30, bottom: -30 }} />
                  <View style={{ position: 'absolute', top: 20, right: 40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </>
              )}
              {riskLevel === 'Green' && (
                <>
                  <Ionicons name="shield-checkmark" size={140} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: -30, bottom: -30 }} />
                  <View style={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </>
              )}
              {riskLevel === 'Yellow' && (
                <>
                  <Ionicons name="alert-circle" size={140} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: -30, bottom: -30 }} />
                  <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </>
              )}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 24 }} />
            </View>

            <View style={styles.passportHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="passport" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.passportLabel}>OFFICIAL HEALTH RECORD</Text>
              </View>
              <Image source={require('../../assets/icon.png')} style={{ width: 24, height: 24, opacity: 0.9, tintColor: '#FFF' }} resizeMode="contain" />
            </View>

            <View style={styles.passportBody}>
              <View style={styles.photoContainer}>
                <Image
                  source={avatarSource || currentChild?.avatarSource || { uri: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png' }}
                  style={styles.passportPhoto}
                />
                <View style={styles.photoBorder} />
                {/* Status Indicator on Photo */}
                <View style={[styles.photoStatusBadge, { backgroundColor: '#FFF' }]}>
                  <Ionicons name={riskLevel === 'Green' ? "checkmark-circle" : "alert-circle"} size={16} color={riskColor} />
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <Text style={styles.passportName} numberOfLines={1}>{currentChild?.name || 'Child Name'}</Text>

                <View style={styles.detailRow}>
                  <View style={{ marginRight: 15 }}>
                    <Text style={styles.detailLabel}>DOB</Text>
                    <Text style={styles.detailValue}>{dobRaw ? dobRaw.split('T')[0] : 'Unknown'}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>AGE</Text>
                    <Text style={styles.detailValue}>{getDetailedAge(dobRaw)}</Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 12 }]}>
                  <View style={{ marginRight: 15 }}>
                    <Text style={styles.detailLabel}>SEX</Text>
                    <Text style={styles.detailValue}>{displayGender}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowBloodModal(true)}>
                    <Text style={styles.detailLabel}>BLOOD {displayBlood === 'N/A' && <Ionicons name="create-outline" size={10} color="#FFF" />}</Text>
                    <Text style={styles.detailValue}>{displayBlood}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.passportFooter}>
              <Text style={styles.idNumber}>ID: {currentChild?.id?.toString().padStart(12, '0')}</Text>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <View style={[styles.statusDot, { backgroundColor: '#FFF' }]} />
                <Text style={styles.statusText}>{riskLevel === 'Green' ? 'HEALTHY' : riskLevel.toUpperCase() + ' ALERT'}</Text>
              </View>
            </View>
          </Animated.View>

          {/* 2. SUMMARY METRICS (Glass Grid) */}
          <Text style={styles.sectionTitle}>Medical Summary</Text>
          <View style={styles.gridContainer}>
            {/* Vaccination */}
            <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('VaccinePlanner')}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.gridLabel}>Vaccines</Text>
              <Text style={[styles.gridValue, { color: '#3B82F6' }]}>{profile?.vaccination?.status || 'Unknown'}</Text>
            </TouchableOpacity>

            {/* Growth */}
            <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('GrowthChart')}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up" size={24} color="#10B981" />
              </View>
              <Text style={styles.gridLabel}>Growth</Text>
              <Text style={[styles.gridValue, { color: '#10B981' }]}>{profile?.growth_summary?.trend || 'Stable'}</Text>
            </TouchableOpacity>

            {/* AI Reports */}
            <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('AIHealthReports')}>
              <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
                <MaterialCommunityIcons name="robot" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.gridLabel}>AI Insights</Text>
              <Text style={[styles.gridValue, { color: '#8B5CF6' }]}>{profile?.timeline?.last_ai_report ? 'Generated' : 'Pending'}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. ALERTS & CONDITIONS */}
          {(profile?.illness_flags || profile?.risk?.reasons?.length > 0 || riskLevel !== 'Green') && (
            <View style={[styles.alertCard, { borderColor: riskColor }]}>
              <View style={styles.alertHeader}>
                <Ionicons name="warning" size={20} color={riskColor} />
                <Text style={[styles.alertTitle, { color: riskLevel === 'Green' ? '#065F46' : '#1E293B' }]}>
                  {riskLevel === 'Green' ? 'No Active Alerts' : 'Active Alerts'}
                </Text>
              </View>

              {profile?.risk?.reasons?.map((reason, idx) => (
                <View key={idx} style={styles.conditionRow}>
                  <Text style={styles.conditionText}>{reason.replace(/_/g, ' ')}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
              ))}

              {Object.keys(profile?.illness_flags || {}).map((flag, idx) => (
                <View key={`ill-${idx}`} style={styles.conditionRow}>
                  <Text style={styles.conditionText}>{flag}</Text>
                  <View style={[styles.highRiskBadge, { backgroundColor: riskLevel === 'Red' ? '#FEE2E2' : '#FEF3C7' }]}>
                    <Text style={[styles.highRiskText, { color: riskColor }]}>Monitor</Text>
                  </View>
                </View>
              ))}

              {/* If unknown risk or clean */}
              {(!profile?.risk?.reasons?.length && !Object.keys(profile?.illness_flags || {}).length) && (
                <Text style={{ color: '#64748B', fontSize: 13, marginLeft: 28 }}>Your child's health metrics are looking good.</Text>
              )}
            </View>
          )}

          {/* 4. HISTORY & MILESTONES (Restored) */}
          {(profile?.milestones || profile?.timeline) && (
            <>
              <Text style={styles.sectionTitle}>Development & History</Text>
              <View style={styles.historyCard}>
                {/* Milestones */}
                {profile?.milestones && (
                  <View style={styles.historyItem}>
                    <View style={[styles.historyIcon, { backgroundColor: profile.milestones.age_appropriate ? '#DCFCE7' : '#FEF3C7' }]}>
                      <Ionicons name="trophy" size={18} color={profile.milestones.age_appropriate ? '#16A34A' : '#D97706'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>Milestones</Text>
                      <Text style={styles.historySub}>
                        {profile.milestones.age_appropriate ? 'On Track for Age' : `${(profile.milestones.delays || []).length} Delays Observed`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Show individual milestone delays if any */}
                {profile?.milestones?.delays?.length > 0 && (
                  <View style={{ marginLeft: 48, marginBottom: 12 }}>
                    {profile.milestones.delays.map((delay, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginRight: 8 }} />
                        <Text style={{ fontSize: 12, color: '#92400E', textTransform: 'capitalize' }}>{delay.replace(/_/g, ' ')}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Timeline Events & Additional Metrics */}

                {/* Next Vaccine */}
                {(currentChild?.nextVaccineName || profile?.vaccination?.next_due) && (
                  <View style={styles.historyItem}>
                    <View style={[styles.historyIcon, { backgroundColor: '#E0F2FE' }]}>
                      <Ionicons name="shield-checkmark" size={18} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>Next Vaccine</Text>
                      <Text style={styles.historySub}>
                        {currentChild?.nextVaccineName || profile?.vaccination?.next_due}
                        {currentChild?.nextVaccineAge ? ` (${currentChild.nextVaccineAge})` : ''}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Growth Status - Always show if profile exists */}
                <View style={styles.historyItem}>
                  <View style={[styles.historyIcon, {
                    backgroundColor: profile?.growth_summary?.trend === 'Normal' || profile?.growth_summary?.trend === 'Stable' ? '#DCFCE7' : '#FEF3C7'
                  }]}>
                    <Ionicons name="trending-up" size={18}
                      color={profile?.growth_summary?.trend === 'Normal' || profile?.growth_summary?.trend === 'Stable' ? '#16A34A' : '#D97706'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>Growth</Text>
                    <Text style={styles.historySub}>
                      {profile?.growth_summary?.trend || 'Pending'}
                      {profile?.growth_summary?.weight_for_age ? ` • Wt: ${profile.growth_summary.weight_for_age}` : ''}
                      {profile?.growth_summary?.height_for_age ? ` • Ht: ${profile.growth_summary.height_for_age}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Nutrition Status - Always show */}
                <View style={styles.historyItem}>
                  <View style={[styles.historyIcon, {
                    backgroundColor: profile?.nutrition_status === 'Normal' || profile?.nutrition_status === 'Good' ? '#DCFCE7' : '#FEE2E2'
                  }]}>
                    <Ionicons name="nutrition" size={18}
                      color={profile?.nutrition_status === 'Normal' || profile?.nutrition_status === 'Good' ? '#16A34A' : '#DC2626'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>Nutrition</Text>
                    <Text style={styles.historySub}>
                      {profile?.nutrition_status || 'Pending'}
                      {profile?.major_deficiency ? ` • Deficiency: ${profile.major_deficiency}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Last AI Report */}
                {profile?.timeline?.last_ai_report && (
                  <View style={styles.historyItem}>
                    <View style={[styles.historyIcon, { backgroundColor: '#F3E8FF' }]}>
                      <MaterialCommunityIcons name="robot" size={18} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>Last AI Checkup</Text>
                      <Text style={styles.historySub}>{formatDate(profile.timeline.last_ai_report)}</Text>
                    </View>
                  </View>
                )}

                {/* Last Vaccination (Keep or Remove? User asked for next, but maybe keep last for history context) */}
                {profile?.timeline?.last_vaccination && (
                  <View style={styles.historyItem}>
                    <View style={[styles.historyIcon, { backgroundColor: '#F1F5F9' }]}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#64748B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>Last Dose Given</Text>
                      <Text style={styles.historySub}>{formatDate(profile.timeline.last_vaccination)}</Text>
                    </View>
                  </View>
                )}

                {profile?.timeline?.last_illness && (
                  <View style={styles.historyItem}>
                    <View style={[styles.historyIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="thermometer" size={18} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>Last Recorded Illness</Text>
                      <Text style={styles.historySub}>{formatDate(profile.timeline.last_illness)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* 5. FOCUS AREA - Show areas needing attention based on real data */}
          {(profile?.risk?.reasons?.length > 0 || profile?.major_deficiency || profile?.vaccination?.missed_count > 0 ||
            !profile?.milestones?.age_appropriate || profile?.illness_flags) && (
              <>
                <Text style={styles.sectionTitle}>Focus Areas</Text>
                <View style={styles.focusCard}>
                  {/* Major Deficiency */}
                  {profile?.major_deficiency && (
                    <TouchableOpacity style={styles.focusItem} onPress={() => navigation.navigate('NutritionLifestyle')}>
                      <View style={[styles.focusIconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="nutrition" size={20} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.focusTitle}>Nutrition Deficiency</Text>
                        <Text style={styles.focusSub}>{profile.major_deficiency}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}

                  {/* Missed Vaccines */}
                  {profile?.vaccination?.missed_count > 0 && (
                    <TouchableOpacity style={styles.focusItem} onPress={() => navigation.navigate('VaccinePlanner')}>
                      <View style={[styles.focusIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="shield" size={20} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.focusTitle}>Missed Vaccinations</Text>
                        <Text style={styles.focusSub}>{profile.vaccination.missed_count} vaccine(s) overdue</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#D97706" />
                    </TouchableOpacity>
                  )}

                  {/* Milestone Delays */}
                  {!profile?.milestones?.age_appropriate && profile?.milestones?.delays?.length > 0 && (
                    <TouchableOpacity style={styles.focusItem} onPress={() => navigation.navigate('GrowthChart')}>
                      <View style={[styles.focusIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="trophy" size={20} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.focusTitle}>Developmental Milestones</Text>
                        <Text style={styles.focusSub}>{profile.milestones.delays.slice(0, 2).join(', ').replace(/_/g, ' ')}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#D97706" />
                    </TouchableOpacity>
                  )}

                  {/* Growth Risk */}
                  {profile?.growth_summary?.trend && profile.growth_summary.trend !== 'Normal' && profile.growth_summary.trend !== 'Stable' && (
                    <TouchableOpacity style={styles.focusItem} onPress={() => navigation.navigate('GrowthChart')}>
                      <View style={[styles.focusIconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="trending-down" size={20} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.focusTitle}>Growth Monitoring</Text>
                        <Text style={styles.focusSub}>
                          Trend: {profile.growth_summary.trend}
                          {profile.growth_summary.weight_for_age ? ` • ${profile.growth_summary.weight_for_age}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}

                  {/* Illness Flags */}
                  {Object.entries(profile?.illness_flags || {}).map(([key, flag]) => (
                    <TouchableOpacity key={key} style={styles.focusItem} onPress={() => navigation.navigate('SymptomChecker')}>
                      <View style={[styles.focusIconBox, { backgroundColor: flag.severity === 'High' ? '#FEE2E2' : '#FEF3C7' }]}>
                        <Ionicons name="medkit" size={20} color={flag.severity === 'High' ? '#DC2626' : '#D97706'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.focusTitle}>{key.replace(/_/g, ' ')}</Text>
                        <Text style={styles.focusSub}>{flag.message || `${Math.round(flag.probability * 100)}% probability`}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={flag.severity === 'High' ? '#DC2626' : '#D97706'} />
                    </TouchableOpacity>
                  ))}

                  {/* Risk Reasons (if not already covered above) */}
                  {profile?.risk?.reasons?.filter(r =>
                    !r.includes('deficiency') && !r.includes('vaccine') && !r.includes('milestone')
                  ).map((reason, idx) => (
                    <View key={`reason-${idx}`} style={styles.focusItem}>
                      <View style={[styles.focusIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="alert-circle" size={20} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.focusTitle}>{reason.replace(/_/g, ' ')}</Text>
                        <Text style={styles.focusSub}>Needs attention</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

          {/* 6. DOCUMENTS (Mock) */}
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.docCard}>
            <TouchableOpacity style={styles.docRow}>
              <Ionicons name="document-text-outline" size={24} color="#64748B" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.docName}>Birth Certificate</Text>
                <Text style={styles.docDate}>Added 2 years ago</Text>
              </View>
              <Ionicons name="download-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.docRow}>
              <Ionicons name="document-text-outline" size={24} color="#64748B" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.docName}>Vaccination Card (Digital)</Text>
                <Text style={styles.docDate}>Updated yesterday</Text>
              </View>
              <Ionicons name="download-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />

        </ScrollView>

        {/* CHILD SELECTOR MODAL */}
        <Modal visible={showChildSelector} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowChildSelector(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Select Child</Text>
              {children.map(child => (
                <TouchableOpacity key={child.id} style={styles.childOption} onPress={() => { selectChild(child.id); setShowChildSelector(false); }}>
                  <Image source={child.avatarSource || { uri: 'https://via.placeholder.com/40' }} style={styles.childOptionImg} />
                  <Text style={[styles.childOptionText, child.id === currentChild.id && styles.childOptionTextActive]}>{child.name}</Text>
                  {child.id === currentChild.id && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* BLOOD GROUP MODAL */}
        <Modal visible={showBloodModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: '80%' }]}>
              <Text style={styles.modalHeader}>Update Blood Group</Text>
              <View style={styles.bloodGrid}>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <TouchableOpacity key={bg} style={[styles.bloodOption, bloodGroupInput === bg && styles.bloodOptionActive]} onPress={() => handleUpdateBloodGroup(bg)}>
                    <Text style={[styles.bloodText, bloodGroupInput === bg && styles.bloodTextActive]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowBloodModal(false)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

  header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },

  headerSelector: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  childBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  childBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', marginRight: 4 },

  content: { padding: 20 },

  /* PASSPORT CARD */
  passportCard: {
    height: 220, borderRadius: 24, overflow: 'hidden',
    padding: 20, marginBottom: 30,
    shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  passportOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.1)' },
  passportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  passportLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginLeft: 6 },

  passportBody: { flexDirection: 'row', flex: 1 },
  photoContainer: { marginRight: 20 },
  passportPhoto: { width: 80, height: 100, borderRadius: 12, backgroundColor: '#E2E8F0' },
  photoBorder: { position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', zIndex: -1 },
  photoStatusBadge: { position: 'absolute', bottom: -5, right: -5, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', ShadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },

  detailsContainer: { flex: 1, justifyContent: 'center' },
  passportName: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 12, letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  detailLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 13, color: '#FFF', fontWeight: '700' },

  passportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idNumber: { fontFamily: 'Courier New', color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  /* SECTIONS */
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12, marginTop: 10 },

  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  gridCard: {
    width: (width - 60) / 3, // 3 columns
    backgroundColor: '#FFF', borderRadius: 16, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#EFF6FF',
    shadowColor: '#64748B', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  gridValue: { fontSize: 13, fontWeight: '800' },

  /* ALERTS */
  alertCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F59E0B' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginLeft: 8 },
  conditionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  conditionText: { fontSize: 14, color: '#475569', fontWeight: '500', textTransform: 'capitalize' },
  highRiskBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  highRiskText: { color: '#EF4444', fontSize: 10, fontWeight: '700' },

  /* HISTORY CARD */
  historyCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  historyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  historyIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  historySub: { fontSize: 12, color: '#64748B' },

  /* FOCUS AREA */
  focusCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#FDE68A' },
  focusItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  focusIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  focusTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', textTransform: 'capitalize' },
  focusSub: { fontSize: 12, color: '#64748B', marginTop: 2, textTransform: 'capitalize' },

  /* DOCS */
  docCard: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 0.1, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  docRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF' },
  docName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  docDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 52 },

  /* MODALS */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '70%', borderRadius: 20, padding: 20 },
  modalHeader: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  childOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  childOptionImg: { width: 32, height: 32, borderRadius: 16, marginRight: 12, backgroundColor: '#E2E8F0' },
  childOptionText: { fontSize: 16, color: '#64748B', flex: 1 },
  childOptionTextActive: { color: '#3B82F6', fontWeight: '700' },

  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  bloodOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  bloodOptionActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  bloodText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  bloodTextActive: { color: '#FFF' },
  closeBtn: { alignSelf: 'center', marginTop: 15, padding: 10 },
  closeBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  /* DATE MODAL */
  dateInput: { width: 70, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1E293B', backgroundColor: '#F8FAFC' },
  primaryModalBtn: { backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  primaryModalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }

});

export default HealthProfileScreen;
