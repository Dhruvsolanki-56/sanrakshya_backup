import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doctorService } from '../../services/doctor/doctorService';
import { useSelectedWorkplace } from '../../contexts/SelectedWorkplaceContext';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const DoctorDashboardScreen = ({ navigation, route }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [docError, setDocError] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const {
    workplaces,
    selectedWorkplace: activeWorkplace,
    selectedWorkplaceId,
    loadingWorkplaces,
    selectWorkplace,
    reloadWorkplaces,
  } = useSelectedWorkplace();
  const toTitleCase = (value) => {
    const s = String(value ?? '').trim();
    if (!s) return '';
    return s
      .replace(/[_\-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const openWorkplaceSheet = () => {
    sheetAnim.setValue(0);
    setSelectorOpen(true);
  };

  const closeWorkplaceSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setSelectorOpen(false);
    });
  };

  useEffect(() => {
    if (!selectorOpen) return;
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [selectorOpen, sheetAnim]);
  

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadDoctorHome = useCallback(async () => {
    setLoadingDoctor(true);
    setDocError('');
    try {
      const data = await doctorService.getDoctorHome();
      setDoctor(data?.doctor || null);
    } catch (err) {
      setDocError('Unable to load doctor info');
    } finally {
      setLoadingDoctor(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorHome();
  }, [loadDoctorHome]);

  useFocusEffect(
    useCallback(() => {
      const shouldRefresh = !!route?.params?.refresh;
      if (!shouldRefresh) return;
      (async () => {
        try {
          await loadDoctorHome();
          await reloadWorkplaces();
        } finally {
          navigation.setParams({ refresh: undefined });
        }
      })();
    }, [route?.params?.refresh, loadDoctorHome, reloadWorkplaces, navigation])
  );

  // If doctor is inactive, immediately send them to the dedicated verification screen.
  useEffect(() => {
    if (doctor && !doctor.is_verified) {
      navigation.replace('Verification');
    }
  }, [doctor, navigation]);

  // Overlay is manual; user can navigate to dedicated screen from Quick Action.

  const doctorProfile = {
    name: doctor?.full_name || 'Doctor',
    specialty: doctor?.specialization || 'Pediatrics',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(doctor?.full_name || 'Doctor'),
  };

  const stats = [
    { id: '1', value: 12, label: 'Today\'s Appts', icon: 'calendar-outline', color: '#667eea' },
    { id: '2', value: 3, label: 'Pending Reports', icon: 'document-text-outline', color: '#ff6b6b' },
    { id: '3', value: 5, label: 'New Messages', icon: 'chatbubbles-outline', color: '#10ac84' },
  ];

  const selectedWorkplaceIndex = useMemo(() => {
    if (!workplaces.length || !selectedWorkplaceId) return 0;
    const idx = workplaces.findIndex((w) => String(w.place_id) === String(selectedWorkplaceId));
    return idx >= 0 ? idx : 0;
  }, [workplaces, selectedWorkplaceId]);

  const selectedTypeText = activeWorkplace?.place_type
    ? (() => {
        const t = String(activeWorkplace.place_type).toLowerCase();
        if (t === 'clinic') return 'Clinic';
        if (t === 'hospital') return 'Hospital';
        return toTitleCase(activeWorkplace.place_type);
      })()
    : '';
  const selectedRoleText = activeWorkplace?.role ? toTitleCase(activeWorkplace.role) : '';

  const latestRoleDoc = activeWorkplace?.role_latest_document || null;
  const latestRoleDocStatus = latestRoleDoc?.status ? toTitleCase(latestRoleDoc.status) : '';
  const latestRoleDocType = latestRoleDoc?.document_type ? toTitleCase(latestRoleDoc.document_type) : '';
  const latestRoleDocName = latestRoleDoc?.document_name ? String(latestRoleDoc.document_name) : '';
  const latestRoleDocReviewNotes = latestRoleDoc?.review_notes ? String(latestRoleDoc.review_notes) : '';
  const roleAttemptsCount = Number.isFinite(Number(activeWorkplace?.role_doc_attempts_count))
    ? Number(activeWorkplace?.role_doc_attempts_count)
    : null;
  const roleAttemptsMax = 3;

  const getWorkplaceLabel = (wp, i) => (wp?.place_name || wp?.name || wp?.title || wp?.clinic_name || wp?.hospital_name || `Workplace ${i + 1}`);

  const getWorkplaceSubtitle = (wp) => {
    if (!wp) return '';
    const parts = [];
    if (wp?.place_type) {
      const t = String(wp.place_type).toLowerCase();
      parts.push(t === 'clinic' ? 'Clinic' : t === 'hospital' ? 'Hospital' : toTitleCase(wp.place_type));
    }
    if (wp?.role) parts.push(toTitleCase(wp.role));
    if (wp?.role_status) parts.push(toTitleCase(wp.role_status));
    return parts.filter(Boolean).join(' • ');
  };

  const getPlaceTypeIcon = (wp) => {
    const t = String(wp?.place_type || '').toLowerCase();
    if (t === 'hospital') return 'medical-outline';
    if (t === 'clinic') return 'medkit-outline';
    return 'business-outline';
  };

  const getRoleIcon = (wp) => {
    const r = String(wp?.role || '').toLowerCase();
    if (r === 'owner') return 'home-outline';
    if (r === 'assistant') return 'person-outline';
    if (r === 'consulting') return 'medkit-outline';
    return 'person-outline';
  };

  const getRoleStatusMeta = (wp) => {
    const s = String(wp?.role_status || '').trim();
    if (!s) return null;
    const k = s.toLowerCase();
    if (k === 'pending') return { label: 'Pending', icon: 'time-outline', color: '#b45309', bg: 'rgba(255, 237, 213, 0.92)', border: '#fed7aa' };
    if (k === 'rejected') return { label: 'Rejected', icon: 'close-circle', color: '#b91c1c', bg: 'rgba(254, 226, 226, 0.92)', border: '#fecaca' };
    if (k === 'approved' || k === 'active') return { label: 'Approved', icon: 'checkmark-circle', color: '#166534', bg: 'rgba(220, 252, 231, 0.92)', border: '#bbf7d0' };
    return { label: toTitleCase(s), icon: 'information-circle', color: '#334155', bg: 'rgba(241, 245, 249, 0.92)', border: '#e2e8f0' };
  };

  const selectedRoleStatusMeta = getRoleStatusMeta(activeWorkplace);

  const roleStatusKey = String(activeWorkplace?.role_status || '').trim().toLowerCase();
  const latestRoleDocStatusKey = String(latestRoleDoc?.status || '').trim().toLowerCase();
  const roleAttemptsExceeded = roleAttemptsCount != null && Number(roleAttemptsCount) >= Number(roleAttemptsMax);
  const canResubmitRoleDocument =
    roleStatusKey === 'pending' &&
    latestRoleDocStatusKey === 'rejected' &&
    !roleAttemptsExceeded;
  const showWorkplaceRoleNotice = roleStatusKey === 'pending' || roleStatusKey === 'rejected';
  const workplaceRoleNotice = useMemo(() => {
    if (!showWorkplaceRoleNotice) return null;
    if (roleStatusKey === 'rejected') {
      return {
        title: 'Request Rejected',
        statusLabel: 'Rejected',
        icon: 'close-circle',
        grad: ['#ff6b6b', '#c81d25'],
        statusBg: 'rgba(239, 68, 68, 0.18)',
        statusBorder: 'rgba(239, 68, 68, 0.35)',
        overlayGrad: ['rgba(0, 0, 0, 0.12)', 'rgba(0, 0, 0, 0.00)'],
        message: 'You are no longer allowed to be part of this organisation. Re-upload is not available for rejected role requests.',
      };
    }

    if (roleStatusKey === 'pending' && latestRoleDocStatusKey === 'rejected') {
      return {
        title: 'Document Rejected',
        statusLabel: 'Action Required',
        icon: 'alert-circle',
        grad: ['#b91c1c', '#7f1d1d'],
        statusBg: 'rgba(255,255,255,0.14)',
        statusBorder: 'rgba(255,255,255,0.22)',
        overlayGrad: ['rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.00)'],
        message: roleAttemptsExceeded
          ? 'Your document was rejected, but you have reached the maximum number of document submissions for this role.'
          : 'Your document was rejected. Please resubmit your document to continue the review.',
      };
    }

    return {
      title: 'Approval Pending',
      statusLabel: 'Pending',
      icon: 'time-outline',
      grad: ['#667eea', '#764ba2'],
      statusBg: 'rgba(255,255,255,0.16)',
      statusBorder: 'rgba(255,255,255,0.22)',
      overlayGrad: null,
      message: 'We’re reviewing your request. Please check again later.',
    };
  }, [latestRoleDocStatusKey, roleAttemptsExceeded, roleStatusKey, showWorkplaceRoleNotice]);

  

  const upcomingAppointments = [
    { id: '1', patient: 'Emma Johnson', time: '10:30 AM', reason: 'MMR Vaccination', avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
    { id: '2', patient: 'Alex Chen', time: '11:00 AM', reason: 'Regular Checkup', avatar: 'https://randomuser.me/api/portraits/men/33.jpg' },
    { id: '3', patient: 'Sophie Williams', time: '11:45 AM', reason: 'Growth Assessment', avatar: 'https://randomuser.me/api/portraits/women/34.jpg' },
    { id: '4', patient: 'Liam Brown', time: '01:15 PM', reason: 'Fever & Cough', avatar: 'https://randomuser.me/api/portraits/men/35.jpg' },
  ];

  const AnimatedStatCard = ({ stat, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={[styles.statCard, { opacity: cardAnim, transform: [{ scale: cardAnim }] }]}>
        <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
          <Ionicons name={stat.icon} size={24} color={stat.color} />
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </Animated.View>
    );
  };

  const AnimatedAppointmentItem = ({ appointment, index }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 500,
        delay: 300 + index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <TouchableOpacity onPress={() => navigation.navigate('PatientDetails', { patient: appointment })}>
        <Animated.View style={[styles.appointmentItem, { opacity: itemAnim, transform: [{ translateX: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }]}>
        <Image source={{ uri: appointment.avatar }} style={styles.patientAvatar} />
        <View style={styles.appointmentInfo}>
          <Text style={styles.patientName}>{appointment.patient}</Text>
          <Text style={styles.appointmentReason}>{appointment.reason}</Text>
        </View>
        <View style={styles.appointmentTimeContainer}>
          <Text style={styles.appointmentTime}>{appointment.time}</Text>
        </View>
      </Animated.View>
      </TouchableOpacity>
    );
  };

  // Loading state while fetching doctor info
  if (loadingDoctor || loadingWorkplaces) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  const hasWorkplace = workplaces.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={hasWorkplace ? null : styles.noWorkplaceScroll}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerGreeting}>Good Morning,</Text>
                <Text style={styles.headerName}>{doctorProfile.name}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Image source={{ uri: doctorProfile.avatar }} style={styles.doctorAvatar} />
              </TouchableOpacity>
            </View>

            {!!docError && (
              <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{docError}</Text></View>
            )}
          </Animated.View>

          {hasWorkplace ? (
            <TouchableOpacity style={styles.workplaceSelector} activeOpacity={0.9} onPress={openWorkplaceSheet}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wpSwitchCardGrad}
              >
                <View style={styles.wpSwitchGlowA} />
                <View style={styles.wpSwitchGlowB} />

                <View style={styles.wpSwitchTopRow}>
                  <View style={styles.wpSwitchLabelRow}>
                    <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.92)" />
                    <Text style={styles.wpSwitchLabelText}>Active Workplace</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.wpSwitchPill}>
                      <Ionicons
                        name={activeWorkplace?.place_is_verified ? 'checkmark-circle' : 'alert-circle'}
                        size={14}
                        color={activeWorkplace?.place_is_verified ? '#22c55e' : '#f59e0b'}
                      />
                      <Text style={styles.wpSwitchPillText}>
                        {activeWorkplace?.place_is_verified ? 'Verified' : 'Unverified'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.wpSwitchMainRow}>
                  <View style={styles.wpSwitchIconShell}>
                    <Ionicons name={getPlaceTypeIcon(activeWorkplace)} size={20} color="#fff" />
                    <View style={styles.wpSwitchRoleBadge}>
                      <Ionicons name={getRoleIcon(activeWorkplace)} size={12} color="#667eea" />
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.wpSwitchTitleRow}>
                      <Text style={styles.wpSwitchTitle} numberOfLines={1} ellipsizeMode="tail">
                        {toTitleCase(getWorkplaceLabel(activeWorkplace, selectedWorkplaceIndex))}
                      </Text>
                    </View>
                    <View style={styles.wpSwitchMetaRow}>
                      {!!selectedTypeText && (
                        <View style={[styles.wpSwitchMetaChip, styles.wpSwitchMetaType]}>
                          <Ionicons name={getPlaceTypeIcon(activeWorkplace)} size={11} color="#4f46e5" />
                          <Text style={[styles.wpSwitchMetaChipText, styles.wpSwitchMetaTypeText]}>{selectedTypeText}</Text>
                        </View>
                      )}
                      {!!selectedRoleText && (
                        <View style={[styles.wpSwitchMetaChip, styles.wpSwitchMetaRole]}>
                          <Ionicons name={getRoleIcon(activeWorkplace)} size={11} color="#64748b" />
                          <Text style={[styles.wpSwitchMetaChipText, styles.wpSwitchMetaRoleText]}>{selectedRoleText}</Text>
                        </View>
                      )}
                      {!!selectedRoleStatusMeta && (
                        <View style={[styles.wpSwitchMetaChip, styles.wpSwitchMetaStatusChip, { backgroundColor: selectedRoleStatusMeta.bg, borderColor: selectedRoleStatusMeta.border }] }>
                          <Ionicons name={selectedRoleStatusMeta.icon} size={11} color={selectedRoleStatusMeta.color} />
                          <Text style={[styles.wpSwitchMetaChipText, { color: selectedRoleStatusMeta.color }]}>{selectedRoleStatusMeta.label}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.wpSwitchChevronShell}>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.95)" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.noWorkplaceCenter}>
              <View style={styles.emptyStateWrap}>
                <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyHeroGrad}>
                  <View style={styles.emptyHeroGlowA} />
                  <View style={styles.emptyHeroGlowB} />

                  <View style={styles.emptyHeroIllustrationRow}>
                    <View style={styles.emptyHeroIconShell}>
                      <Ionicons name="medkit-outline" size={22} color="#fff" />
                    </View>
                    <View style={styles.emptyHeroConnector}>
                      <Ionicons name="swap-horizontal" size={18} color="rgba(255,255,255,0.92)" />
                    </View>
                    <View style={styles.emptyHeroIconShell}>
                      <Ionicons name="business-outline" size={22} color="#fff" />
                    </View>
                  </View>

                  <Text style={styles.emptyHeroTitle}>Connect your clinic / hospital</Text>
                  <Text style={styles.emptyHeroSubtitle}>
                    Join a workplace to unlock appointments, patient list, and scheduling tools.
                  </Text>

                  <TouchableOpacity
                    style={styles.emptyHeroCtaBtn}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('JoinWorkplace', { hideTabBar: true })}
                  >
                    <View style={styles.emptyHeroCtaBtnInner}>
                      <Ionicons name="add-circle-outline" size={18} color="#667eea" />
                      <Text style={styles.emptyHeroCtaText}>Join Workplace</Text>
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {hasWorkplace && !!workplaceRoleNotice && (
            <View style={styles.workplaceRoleNoticeWrap}>
              <LinearGradient
                colors={workplaceRoleNotice.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.workplaceRoleNoticeGrad}
              >
                {!!workplaceRoleNotice.overlayGrad && (
                  <LinearGradient
                    colors={workplaceRoleNotice.overlayGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.workplaceRoleNoticeOverlay}
                  />
                )}

                <View style={styles.workplaceRoleNoticeHeader}>
                  <View style={styles.workplaceRoleNoticeIconShell}>
                    <View style={styles.workplaceRoleNoticeIconInner}>
                      <Ionicons name={workplaceRoleNotice.icon} size={20} color="#fff" />
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.workplaceRoleNoticePlaceTitle} numberOfLines={1}>
                      {activeWorkplace?.place_name ? toTitleCase(activeWorkplace.place_name) : 'Workplace Request'}
                    </Text>
                    <Text style={styles.workplaceRoleNoticeSubtitle} numberOfLines={1}>
                      {workplaceRoleNotice.title}
                    </Text>
                    {roleStatusKey === 'pending' && latestRoleDocStatusKey !== 'rejected' ? null : roleStatusKey !== 'rejected' ? (
                      <View style={styles.workplaceRoleNoticeStatusRow}>
                        <View
                          style={[
                            styles.workplaceRoleNoticeStatusPillOnGrad,
                            { backgroundColor: workplaceRoleNotice.statusBg, borderColor: workplaceRoleNotice.statusBorder },
                          ]}
                        >
                          <Text style={styles.workplaceRoleNoticeStatusPillTextOnGrad}>{workplaceRoleNotice.statusLabel}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.workplaceRoleNoticeRefresh}
                    activeOpacity={0.85}
                    onPress={() => reloadWorkplaces()}
                  >
                    <Ionicons name="refresh" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.workplaceRoleNoticeBody}>
                  <View style={styles.workplaceRoleNoticePillsRow}>
                    {!!selectedRoleText && (
                      <View style={styles.workplaceRoleNoticeRolePill}>
                        <Ionicons name={getRoleIcon(activeWorkplace)} size={12} color="rgba(255,255,255,0.92)" />
                        <Text style={styles.workplaceRoleNoticeRolePillText}>{selectedRoleText}</Text>
                      </View>
                    )}
                    {!!selectedRoleStatusMeta && roleStatusKey !== 'rejected' && (
                      <View style={styles.workplaceRoleNoticeRolePill}>
                        <Ionicons name={selectedRoleStatusMeta.icon} size={12} color="rgba(255,255,255,0.92)" />
                        <Text style={styles.workplaceRoleNoticeRolePillText}>Role: {selectedRoleStatusMeta.label}</Text>
                      </View>
                    )}
                    {roleAttemptsCount != null && (
                      <View style={styles.workplaceRoleNoticeRolePill}>
                        <Ionicons name="repeat-outline" size={12} color="rgba(255,255,255,0.92)" />
                        <Text style={styles.workplaceRoleNoticeRolePillText}>Attempts: {roleAttemptsCount}/{roleAttemptsMax}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.workplaceRoleNoticeMessage} numberOfLines={2}>
                    {workplaceRoleNotice.message}
                  </Text>

                  {!!latestRoleDocStatus && (
                    <View style={styles.workplaceRoleNoticeDocSection}>
                      <Text style={styles.workplaceRoleNoticeDocSectionLabel}>Previous Document</Text>
                      <View style={styles.workplaceRoleNoticeDocPillsRow}>
                        <View style={styles.workplaceRoleNoticeRolePill}>
                          <Ionicons name="document-outline" size={12} color="rgba(255,255,255,0.92)" />
                          <Text style={styles.workplaceRoleNoticeRolePillText}>Status: {latestRoleDocStatus}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {!!latestRoleDocType && !!latestRoleDocName && (
                    <View style={styles.workplaceRoleNoticeDocRow}>
                      <Text style={styles.workplaceRoleNoticeDocText} numberOfLines={1}>
                        {latestRoleDocType} • {latestRoleDocName}
                      </Text>
                    </View>
                  )}

                  {!!latestRoleDocReviewNotes && (
                    <View style={styles.workplaceRoleNoticeNotesBox}>
                      <Text style={styles.workplaceRoleNoticeNotesLabel}>Review Note</Text>
                      <Text style={styles.workplaceRoleNoticeNotesText}>{latestRoleDocReviewNotes}</Text>
                    </View>
                  )}

                  {roleStatusKey === 'pending' && latestRoleDocStatusKey === 'rejected' && roleAttemptsExceeded ? (
                    <View style={styles.workplaceRoleNoticeLockedRow}>
                      <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.92)" />
                      <Text style={styles.workplaceRoleNoticeLockedText}>Resubmission is locked (maximum attempts reached).</Text>
                    </View>
                  ) : null}

                  {canResubmitRoleDocument ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.workplaceRoleNoticePrimaryBtn}
                      onPress={() =>
                        navigation.navigate('JoinWorkplace', {
                          hideTabBar: true,
                          resubmitRoleId: activeWorkplace?.role_id,
                          resubmitPlaceId: activeWorkplace?.place_id,
                          resubmitPlaceName: activeWorkplace?.place_name,
                          resubmitRole: activeWorkplace?.role,
                          resubmitRoleStatus: activeWorkplace?.role_status || null,
                          resubmitAttemptsCount: roleAttemptsCount,
                          resubmitAttemptsMax: roleAttemptsMax,
                          resubmitLatestDocStatus: latestRoleDoc?.status || null,
                          resubmitLatestDocType: latestRoleDoc?.document_type || null,
                          resubmitLatestDocName: latestRoleDoc?.document_name || null,
                          resubmitReviewNotes: latestRoleDoc?.review_notes || null,
                        })
                      }
                    >
                      <View style={styles.workplaceRoleNoticePrimaryBtnInner}>
                        <Ionicons name="document-text-outline" size={16} color="#0f172a" />
                        <Text style={styles.workplaceRoleNoticePrimaryBtnText}>Resubmit Document</Text>
                      </View>
                    </TouchableOpacity>
                  ) : roleStatusKey === 'rejected' ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.workplaceRoleNoticePrimaryBtn}
                      onPress={() => navigation.navigate('JoinWorkplace', { hideTabBar: true })}
                    >
                      <View style={styles.workplaceRoleNoticePrimaryBtnInner}>
                        <Ionicons name="add-circle-outline" size={16} color="#0f172a" />
                        <Text style={styles.workplaceRoleNoticePrimaryBtnText}>Join Another Workplace</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </LinearGradient>
            </View>
          )}

          {hasWorkplace ? (
            showWorkplaceRoleNotice ? null : (
              <>

            


            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <AnimatedStatCard key={stat.id} stat={stat} index={index} />
              ))}
            </View>

            {/* Upcoming Appointments */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Appointments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.appointmentList}>
                {upcomingAppointments.map((appt, index) => (
                  <AnimatedAppointmentItem key={appt.id} appointment={appt} index={index} />
                ))}
              </View>
            </View>
            
            {/* Quick Actions */}
            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Quick Actions</Text>
               <View style={styles.quickActionsGrid}>
                  <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('Patients')}>
                      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.quickActionIconContainer}>
                          <Ionicons name="people-outline" size={24} color="#fff" />
                      </LinearGradient>
                      <Text style={styles.quickActionText}>My Patients</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('Messages')}>
                      <LinearGradient colors={['#10ac84', '#06d6a0']} style={styles.quickActionIconContainer}>
                          <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
                      </LinearGradient>
                      <Text style={styles.quickActionText}>Messages</Text>
                  </TouchableOpacity>
               </View>
               <View style={[styles.quickActionsGrid, { marginTop: 12 }] }>
                  <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate('Verification')}>
                      <LinearGradient colors={['#ff6b6b', '#ff8e53']} style={styles.quickActionIconContainer}>
                          <Ionicons name="shield-outline" size={24} color="#fff" />
                      </LinearGradient>
                      <Text style={styles.quickActionText}>Verification</Text>
                  </TouchableOpacity>
                  <View style={[styles.quickActionCard, { opacity: 0 }]} />
               </View>
            </View>

              </>
            )
          ) : null}

        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <Modal
        visible={selectorOpen}
        transparent
        animationType="fade"
        onRequestClose={closeWorkplaceSheet}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeWorkplaceSheet} />
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetHeroGrad}
            >
              <View style={styles.sheetHeroGlowA} />
              <View style={styles.sheetHeroGlowB} />
              <View style={styles.sheetHandleWrap}>
                <View style={styles.sheetHandleOnHero} />
              </View>

              <View style={styles.sheetHeaderRowModern}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.sheetHeaderIconHero}>
                    <Ionicons name="briefcase-outline" size={16} color="#fff" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.sheetTitleModernOnHero}>Workplaces</Text>
                    <Text style={styles.sheetSubtitleModernOnHero}>Choose where you’re working today</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.sheetCloseOnHero} activeOpacity={0.8} onPress={closeWorkplaceSheet}>
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.sheetContentWrap}>
              <ScrollView style={{ maxHeight: height * 0.54 }} showsVerticalScrollIndicator={false}>
                {workplaces.map((wp) => {
                const isActive = String(wp.place_id) === String(activeWorkplace?.place_id);
                const typeText = wp?.place_type
                  ? (String(wp.place_type).toLowerCase() === 'clinic' ? 'Clinic' : String(wp.place_type).toLowerCase() === 'hospital' ? 'Hospital' : toTitleCase(wp.place_type))
                  : '';
                const roleText = wp?.role ? toTitleCase(wp.role) : '';
                const statusText = wp?.role_status ? toTitleCase(wp.role_status) : '';
                const verified = !!wp?.place_is_verified;
                const roleStatusMeta = getRoleStatusMeta(wp);

                return (
                  <TouchableOpacity
                    key={String(wp.place_id) || getWorkplaceLabel(wp, 0)}
                    activeOpacity={0.9}
                    style={[styles.sheetRow, isActive && styles.sheetRowActive]}
                    onPress={() => {
                      selectWorkplace(wp.place_id);
                      closeWorkplaceSheet();
                    }}
                  >
                    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.sheetRowAvatar}>
                      <Ionicons name={getPlaceTypeIcon(wp)} size={18} color="#fff" />
                      <View style={styles.sheetRowRoleBadge}>
                        <Ionicons name={getRoleIcon(wp)} size={12} color="#667eea" />
                      </View>
                    </LinearGradient>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.sheetRowTitle} numberOfLines={1} ellipsizeMode="tail">
                        {toTitleCase(getWorkplaceLabel(wp, 0))}
                      </Text>
                      <View style={styles.sheetBadgesRow}>
                        {!!typeText && (
                          <View style={styles.badgeNeutral}>
                            <Ionicons name={getPlaceTypeIcon(wp)} size={12} color="#4f46e5" />
                            <Text style={styles.badgeNeutralText}>{typeText}</Text>
                          </View>
                        )}
                        {!!roleText && (
                          <View style={styles.badgeMuted}>
                            <Ionicons name={getRoleIcon(wp)} size={12} color="#64748b" />
                            <Text style={styles.badgeMutedText}>{roleText}</Text>
                          </View>
                        )}
                        {!!roleStatusMeta && (
                          <View style={[styles.badgeStatus, { backgroundColor: roleStatusMeta.bg, borderColor: roleStatusMeta.border, borderWidth: 1 }] }>
                            <Ionicons name={roleStatusMeta.icon} size={12} color={roleStatusMeta.color} />
                            <Text style={[styles.badgeStatusText, { color: roleStatusMeta.color }]}>{roleStatusMeta.label}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.sheetRowRight}>
                      <View style={[styles.sheetRightIconWrap, verified ? styles.sheetRightIconOn : styles.sheetRightIconOff]}>
                        <Ionicons name={verified ? 'checkmark-circle' : 'alert-circle'} size={14} color={verified ? '#16a34a' : '#f59e0b'} />
                      </View>
                      {isActive ? (
                        <View style={styles.sheetSelectedPill}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              </ScrollView>

              <TouchableOpacity
                style={styles.sheetPrimaryAction}
                activeOpacity={0.9}
                onPress={() => {
                  closeWorkplaceSheet();
                  navigation.navigate('JoinWorkplace', { hideTabBar: true });
                }}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.sheetPrimaryActionGrad}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.sheetPrimaryActionText}>Join Workplace</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  noWorkplaceScroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  noWorkplaceCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 18,
  },
  heroContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  heroIconWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heroIconInner: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  heroGlow1: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: '#eef2ff', opacity: 0.6 },
  heroGlow2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#f8faff', opacity: 0.4 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', textAlign: 'center' },
  heroSubtitle: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginTop: 4, marginBottom: 12, paddingHorizontal: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerGreeting: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  workplaceSelector: { marginHorizontal: 20, marginTop: 10, marginBottom: 16 },
  workplaceSelectorGrad: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, shadowColor: '#667eea', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
  workplaceAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  workplaceTextContainer: { flex: 1 },
  selectorTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  selectorSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  selectorBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', marginRight: 8 },
  selectorBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  selectorHint: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  workplaceEmptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: '#f1f3f4', alignItems: 'center' },
  workplaceEmptyTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  workplaceEmptyText: { fontSize: 13, color: '#7f8c8d', marginTop: 4, marginBottom: 10, textAlign: 'center' },
  workplaceEmptyBtn: { backgroundColor: '#667eea', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  workplaceEmptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  docStatusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: '#f1f3f4' },
  docHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleChipsRow: { flexDirection: 'row' },
  roleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginLeft: 6 },
  roleChipPrimary: { backgroundColor: '#eef2ff' },
  roleChipPending: { backgroundColor: '#fff7e6' },
  roleChipText: { color: '#2c3e50', fontWeight: '700', fontSize: 12 },
  docItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f6f7f9' },
  docItemTitle: { color: '#2c3e50', fontWeight: '600' },
  docItemSub: { color: '#7f8c8d', fontSize: 12, marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusChipText: { color: '#2c3e50', fontWeight: '700', fontSize: 12 },
  statusApproved: { backgroundColor: '#e8f5e9' },
  statusPending: { backgroundColor: '#fff7e6' },
  statusRejected: { backgroundColor: '#fdecea' },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    width: (width - 80) / 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  verifyBannerContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  verifyBannerGrad: {
    padding: 20,
    alignItems: 'center',
  },
  verifyIconWrap: {
    width: 72,
    height: 72,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50' },
  verifySubtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginTop: 6, marginBottom: 14 },
  verifyBtn: { borderRadius: 14, overflow: 'hidden' },
  verifyBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  verifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Modal styles (reusing health record theme)
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  modalCloseSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8f9ff', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
  modalScroll: { paddingHorizontal: 20, paddingTop: 16 },
  errorBanner: { backgroundColor: '#FDECEA', borderColor: '#F5C6CB', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12 },
  errorBannerText: { color: '#A94442', fontSize: 13 },
  label: { fontSize: 14, fontWeight: '700', color: '#2c3e50', marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: (width - 60) / 2, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#f1f3f4' },
  activeGridItem: { borderColor: '#667eea' },
  gridIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 14, color: '#2c3e50', fontWeight: '600' },
  activeGridLabel: { color: '#667eea' },
  formSection: { marginTop: 8, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E1E1E6', paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  inputError: { borderColor: '#ff6b6b' },
  perfectFilePicker: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f3f4', padding: 14, marginTop: 6 },
  filePickedBorder: { borderColor: '#2ecc71' },
  fieldErrorText: { marginTop: 6, color: '#a94442', fontSize: 12 },
  pickerInner: { flexDirection: 'row', alignItems: 'center' },
  pickerTextContent: { marginLeft: 12 },
  filePickerMainText: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  filePickerSubText: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  perfectUploadButton: { borderRadius: 14, overflow: 'hidden', marginTop: 16 },
  disabledBtn: { opacity: 0.6 },
  perfectUploadGradient: { paddingVertical: 14, alignItems: 'center' },
  perfectUploadText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnLoadingRow: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  appointmentList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  appointmentReason: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  appointmentTimeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8f9ff',
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: (width - 60) / 2,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  // Workplace selector enhancements
  workplaceSelectorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#f1f3f4', shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  workplaceSelectorCardModern: { backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#eef2f7', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 8 },
  wpSwitchCardGrad: { borderRadius: 18, padding: 12, paddingBottom: 18, overflow: 'hidden', shadowColor: '#667eea', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 10 },
  wpSwitchGlowA: { position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.18)' },
  wpSwitchGlowB: { position: 'absolute', bottom: -70, left: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.12)' },
  wpSwitchTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wpSwitchLabelRow: { flexDirection: 'row', alignItems: 'center' },
  wpSwitchLabelText: { marginLeft: 8, fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.92)' },
  wpSwitchPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  wpSwitchPillText: { marginLeft: 6, fontSize: 11, fontWeight: '900', color: '#fff' },
  wpStatusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(241, 245, 249, 0.92)', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  wpStatusPillText: { marginLeft: 6, fontSize: 11, fontWeight: '900' },
  wpSwitchMainRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  wpSwitchIconShell: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  wpSwitchTitleRow: { flexDirection: 'row', alignItems: 'center' },
  wpSwitchTitle: { fontSize: 15, fontWeight: '900', color: '#fff' },
  wpSwitchSubtitle: { marginTop: 4, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', lineHeight: 16 },
  wpSwitchMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  wpSwitchMetaChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.28)', marginRight: 6 },
  wpSwitchMetaChipText: { marginLeft: 4, fontSize: 10, fontWeight: '800', color: '#f9fafb' },
  wpSwitchMetaStatusChip: { borderWidth: 1 },
  wpSwitchMetaType: { backgroundColor: 'rgba(239, 246, 255, 0.95)' },
  wpSwitchMetaTypeText: { color: '#4f46e5' },
  wpSwitchMetaRole: { backgroundColor: 'rgba(241, 245, 249, 0.95)' },
  wpSwitchMetaRoleText: { color: '#475569' },
  wpSwitchChevronShell: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', marginLeft: 10 },
  wpSwitchRoleBadge: { position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  emptyStateWrap: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
    alignItems: 'center',
  },
  emptyHeroGrad: {
    width: Math.min(width - 40, 420),
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
  },
  emptyHeroGlowA: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  emptyHeroGlowB: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyHeroIllustrationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyHeroIconShell: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  emptyHeroConnector: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  emptyHeroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' },
  emptyHeroSubtitle: { marginTop: 8, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.88)', lineHeight: 18, textAlign: 'center' },
  emptyHeroCtaBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  emptyHeroCtaBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 12 },
  emptyHeroCtaText: { marginLeft: 8, color: '#667eea', fontWeight: '900', fontSize: 14 },
  workplaceRoleNoticeWrap: { marginTop: 10, marginBottom: 6, paddingHorizontal: 20, alignItems: 'center' },
  workplaceRoleNoticeGrad: { width: Math.min(width - 40, 420), borderRadius: 18, padding: 14, overflow: 'hidden', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 12 },
  workplaceRoleNoticeOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.95 },
  workplaceRoleNoticeGlowA: { position: 'absolute', top: -70, right: -50, width: 220, height: 220, borderRadius: 110 },
  workplaceRoleNoticeGlowB: { position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130 },
  workplaceRoleNoticeHeader: { flexDirection: 'row', alignItems: 'center' },
  workplaceRoleNoticeIconShell: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  workplaceRoleNoticeIconInner: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(255,255,255,0.16)' },
  workplaceRoleNoticePlaceTitle: { fontSize: 15, fontWeight: '900', color: '#fff', lineHeight: 19 },
  workplaceRoleNoticeSubtitle: { marginTop: 3, fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  workplaceRoleNoticeStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  workplaceRoleNoticeStatusPillOnGrad: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  workplaceRoleNoticeStatusPillTextOnGrad: { fontSize: 11, fontWeight: '900', color: '#fff' },
  workplaceRoleNoticeRefresh: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', marginLeft: 10 },
  workplaceRoleNoticeBody: { marginTop: 12 },
  workplaceRoleNoticePillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  workplaceRoleNoticePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', marginRight: 8, marginBottom: 8, maxWidth: width - 120 },
  workplaceRoleNoticePillText: { marginLeft: 8, fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.95)', maxWidth: width - 200 },
  workplaceRoleNoticeRolePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', marginRight: 8, marginBottom: 8 },
  workplaceRoleNoticeRolePillText: { marginLeft: 6, fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.96)' },
  workplaceRoleNoticeMessage: { marginTop: 4, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.93)', lineHeight: 18 },
  workplaceRoleNoticeDocSection: { marginTop: 10 },
  workplaceRoleNoticeDocSectionLabel: { marginBottom: 8, fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.92)' },
  workplaceRoleNoticeDocPillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  workplaceRoleNoticeDocRow: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(15, 23, 42, 0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  workplaceRoleNoticeDocText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.95)' },
  workplaceRoleNoticeNotesBox: { marginTop: 10, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  workplaceRoleNoticeNotesLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.95)' },
  workplaceRoleNoticeNotesText: { marginTop: 6, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.92)', lineHeight: 18 },
  workplaceRoleNoticeLockedRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  workplaceRoleNoticeLockedText: { marginLeft: 8, fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.92)' },
  workplaceRoleNoticePrimaryBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  workplaceRoleNoticePrimaryBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 11 },
  workplaceRoleNoticePrimaryBtnText: { marginLeft: 8, color: '#0f172a', fontWeight: '900', fontSize: 13 },
  workplaceSelectorTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workplaceLabelRow: { flexDirection: 'row', alignItems: 'center' },
  workplaceLabelText: { marginLeft: 6, fontSize: 12, fontWeight: '700', color: '#6b7280' },
  workplaceSwitchHint: { flexDirection: 'row', alignItems: 'center' },
  workplaceSwitchHintText: { marginLeft: 6, fontSize: 12, fontWeight: '800', color: '#667eea' },
  workplaceSelectorMainRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  workplaceAvatarModern: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  workplaceTitleModern: { fontSize: 16, fontWeight: '900', color: '#0f172a', flexShrink: 1 },
  workplaceSubtitleModern: { marginTop: 4, fontSize: 12, fontWeight: '700', color: '#64748b' },
  workplaceIconWrap: { marginRight: 12 },
  workplaceIconGrad: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  workplaceTitleRow: { flexDirection: 'row', alignItems: 'center' },
  workplaceTitle: { fontSize: 16, fontWeight: '800', color: '#2c3e50', flexShrink: 1 },
  workplaceSubtitle: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#7f8c8d' },
  typeChipSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#eef2ff', marginRight: 6 },
  typeChipSmallText: { fontSize: 12, fontWeight: '700', color: '#667eea' },
  verifyChipSmall: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginRight: 6 },
  verifyChipOn: { backgroundColor: '#e8f5e9' },
  verifyChipOff: { backgroundColor: '#fff7e6' },
  verifyChipSmallText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },
  verifyTextOn: { color: '#0f9d58' },
  verifyTextOff: { color: '#f4b400' },
  workplaceItemIconWrap: { marginRight: 12 },
  workplaceItemIconGrad: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  workplaceItemMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 12, paddingTop: 0, paddingHorizontal: 0, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 16 },
  sheetHeroGrad: { paddingTop: 8, paddingBottom: 12, paddingHorizontal: 12, overflow: 'hidden' },
  sheetHeroGlowA: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.18)' },
  sheetHeroGlowB: { position: 'absolute', bottom: -90, left: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.12)' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: 6, paddingBottom: 10 },
  sheetHandleOnHero: { width: 44, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  sheetHeaderRowModern: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetHeaderIconHero: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  sheetTitleModernOnHero: { fontSize: 15, fontWeight: '900', color: '#fff' },
  sheetSubtitleModernOnHero: { marginTop: 2, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  sheetCloseOnHero: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  sheetContentWrap: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#eef2f7', backgroundColor: '#fff', marginBottom: 10 },
  sheetRowActive: { borderColor: '#c7d2fe', backgroundColor: '#f8f9ff' },
  sheetRowAvatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  sheetRowRoleBadge: { position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  sheetRowTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', flexShrink: 1 },
  sheetRowSubtitle: { marginTop: 3, fontSize: 12, fontWeight: '600', color: '#64748b' },
  sheetRowRight: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  sheetRoleStatusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  sheetRoleStatusText: { marginLeft: 6, fontSize: 12, fontWeight: '800' },
  sheetRightIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sheetRightIconOn: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#bbf7d0' },
  sheetRightIconOff: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  sheetBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  badgeNeutral: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#e0e7ff', marginRight: 6, marginBottom: 6 },
  badgeNeutralText: { marginLeft: 4, fontSize: 11, fontWeight: '700', color: '#4f46e5' },
  badgeStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 6, marginBottom: 6 },
  badgeVerified: { backgroundColor: '#dcfce7' },
  badgeUnverified: { backgroundColor: '#ffedd5' },
  badgeStatusText: { marginLeft: 4, fontSize: 11, fontWeight: '800' },
  badgeVerifiedText: { color: '#16a34a' },
  badgeUnverifiedText: { color: '#c2410c' },
  badgeMuted: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#e2e8f0', marginRight: 6, marginBottom: 6 },
  badgeMutedText: { marginLeft: 4, fontSize: 11, fontWeight: '700', color: '#475569' },
  sheetSelectedPill: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  sheetPrimaryAction: { marginTop: 4, paddingHorizontal: 6, paddingBottom: 6 },
  sheetPrimaryActionGrad: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  sheetPrimaryActionText: { marginLeft: 8, color: '#fff', fontSize: 15, fontWeight: '900' },
  workplaceSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: 8 },
  sheetBody: { paddingTop: 6 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  wpCard: { width: (width - 64) / 2, backgroundColor: '#fff', borderRadius: 14, padding: 12, margin: 8, borderWidth: 1, borderColor: '#f1f3f4', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  wpCardActive: { borderColor: '#667eea' },
  wpCardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wpCardIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  wpCardName: { marginTop: 8, fontSize: 14, fontWeight: '800', color: '#2c3e50' },
  wpMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  wpChipsRow: { flexDirection: 'row', marginTop: 8 },
  dropdownOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dropdownBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)' },
  dropdownPanel: { position: 'absolute', left: 20, right: 20, top: 120, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f3f4', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  modalPanel: { position: 'absolute', left: 20, right: 20, top: 120, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f3f4', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  dropdownHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  dropdownTitle: { fontSize: 16, fontWeight: '800', color: '#2c3e50' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#2c3e50' },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8f9ff', alignItems: 'center', justifyContent: 'center' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e9f2' },
  sheetSearchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  sheetSearchInput: { flex: 1, marginLeft: 10, color: '#2c3e50' },
  workplaceItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  workplaceItemName: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  workplaceItemText: { marginLeft: 12, fontSize: 16, color: '#2c3e50' },
  workplaceChipsRow: { flexDirection: 'row', marginTop: 6 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e6e9f2', marginRight: 8, backgroundColor: '#fff' },
  filterChipActive: { borderColor: '#667eea', backgroundColor: '#eef2ff' },
  filterChipText: { color: '#2c3e50', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#667eea', fontWeight: '700' },
  sheetActionBtn: { marginTop: 10, paddingHorizontal: 20, paddingVertical: 12 },
  sheetActionGrad: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  sheetActionText: { color: '#fff', fontWeight: '800', marginLeft: 8 },
  workplaceRowItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f3f4', backgroundColor: '#fff' },
  workplaceRowItemActive: { backgroundColor: '#f8f9ff' },
  workplaceMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 6 },
  metaPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 6, backgroundColor: '#eef2ff' },
  metaPillText: { marginLeft: 6, fontSize: 12, fontWeight: '700', color: '#667eea' },
  metaPillVerified: { backgroundColor: '#e8f5e9' },
  metaPillUnverified: { backgroundColor: '#fff7e6' },
  metaPillTextVerified: { color: '#0f9d58' },
  metaPillTextUnverified: { color: '#f4b400' },
  metaPillNeutral: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 6, backgroundColor: '#f1f3f4' },
  metaPillNeutralText: { fontSize: 12, fontWeight: '700', color: '#2c3e50' },
  overlayBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlayCard: { width: '92%', borderRadius: 24, paddingVertical: 28, paddingHorizontal: 20, backgroundColor: '#fff', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  overlayIconOuter: { width: 110, height: 110, marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
  overlayIconInner: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  overlayGlow1: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#eef2ff', opacity: 0.6 },
  overlayGlow2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#f8faff', opacity: 0.4 },
  overlayTitle: { fontSize: 22, fontWeight: '800', color: '#2c3e50', textAlign: 'center' },
  overlaySubtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginTop: 8, marginBottom: 18, paddingHorizontal: 10, lineHeight: 20 },
  overlayBtn: { borderRadius: 16, overflow: 'hidden', alignSelf: 'stretch', marginHorizontal: 4 },
  overlayBtnGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  overlayBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  overlaySecondaryBtn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 14 },
  overlaySecondaryText: { color: '#667eea', fontSize: 14, fontWeight: '700' },
  successContainer: { alignItems: 'center', paddingTop: 40, paddingBottom: 60 },
  successIconWrap: { width: 100, height: 100, marginBottom: 16 },
  successIconInner: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 18, paddingHorizontal: 10, lineHeight: 20 },
});

export default DoctorDashboardScreen;
