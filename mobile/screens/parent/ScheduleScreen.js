import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  Animated,
  Switch,
  StatusBar,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSelectedChild } from '../../contexts/SelectedChildContext';
import { userService } from '../../services/userService';

const { width } = Dimensions.get('window');

const ScheduleScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    time: '1 day before',
    sound: true,
    vibration: true,
    customMessage: ''
  });

  // Animation Refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Real Data State
  const { selectedChild } = useSelectedChild();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ upcoming: 0, overdue: 0, completed: 0 });
  const [parentPhoto, setParentPhoto] = useState(null);

  // Fetch Data
  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const data = await userService.getParentHome();
        if (data) {
          const src = await userService.getParentPhotoSource(data.parent_photo_url || data.avatar_url);
          if (src) setParentPhoto(src);
        }
      } catch (e) {
        console.log('Error fetching parent photo', e);
      }
    };
    fetchParentData();

    if (!selectedChild) return;
    setLoading(true); // ... rest of existing logic

    const realChildName = selectedChild.name || 'Child';
    const realChildAvatar = selectedChild.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const childIdInt = parseInt(selectedChild.id) || 0;

    // Simulate distinct data based on Child ID
    // If ID is even -> Has more vaccines. If ID is odd -> Has checkups.
    const isEven = childIdInt % 2 === 0;

    let simulatedData = [];

    if (isEven) {
      simulatedData = [
        {
          id: 1,
          title: 'Polio Vaccination',
          child: realChildName,
          childId: selectedChild.id,
          avatar: realChildAvatar,
          date: 'Next Monday',
          time: '09:00 AM',
          doctor: 'Dr. Sarah Johnson',
          type: 'vaccination',
          status: 'upcoming',
          reminder: { enabled: true, time: '1 day before' }
        },
        {
          id: 3,
          title: 'Dental Checkup',
          child: realChildName,
          childId: selectedChild.id,
          avatar: realChildAvatar,
          date: 'Dec 12',
          time: '11:00 AM',
          doctor: 'Dr. Emily Carter',
          type: 'checkup',
          status: 'upcoming',
          reminder: { enabled: false, time: 'None' }
        }
      ];
    } else {
      simulatedData = [
        {
          id: 2,
          title: 'General Checkup',
          child: realChildName,
          childId: selectedChild.id,
          avatar: realChildAvatar,
          date: 'Tomorrow',
          time: '2:00 PM',
          doctor: 'Dr. Michael Chen',
          type: 'checkup',
          status: 'upcoming',
          reminder: { enabled: true, time: '1 hour before' }
        },
        {
          id: 4,
          title: 'Nutritional Assessment',
          child: realChildName,
          childId: selectedChild.id,
          avatar: realChildAvatar,
          date: 'Friday',
          time: '4:30 PM',
          doctor: 'Dr. Rajesh Kumar',
          type: 'assessment',
          status: 'upcoming',
          reminder: { enabled: true, time: '2 days before' }
        },
        {
          id: 5,
          title: 'Flu Shot',
          child: realChildName,
          childId: selectedChild.id,
          avatar: realChildAvatar,
          date: 'Next Week',
          time: '10:00 AM',
          doctor: 'Dr. Sarah Johnson',
          type: 'vaccination',
          status: 'upcoming',
          reminder: { enabled: false, time: 'None' }
        }
      ];
    }

    setUpcomingAppointments(simulatedData);

    // Calculate Stats (Mock calculation + Simulated Base)
    // We add base numbers to simulated count to make it look populated
    setStats({
      upcoming: simulatedData.length,
      overdue: isEven ? 0 : 2, // Arbitrary distinction
      completed: isEven ? 8 : 14
    });

    setLoading(false);

  }, [selectedChild]);

  const getTheme = (type) => {
    switch (type) {
      case 'vaccination': return { color: '#3B82F6', light: '#EFF6FF', shadow: 'rgba(59, 130, 246, 0.25)' }; // Blue
      case 'checkup': return { color: '#10B981', light: '#ECFDF5', shadow: 'rgba(16, 185, 129, 0.25)' };     // Emerald
      case 'assessment': return { color: '#F59E0B', light: '#FFFBEB', shadow: 'rgba(245, 158, 11, 0.25)' };  // Amber
      default: return { color: '#6366F1', light: '#EEF2FF', shadow: 'rgba(99, 102, 241, 0.25)' };            // Indigo
    }
  };

  const openReminderModal = (appointment) => {
    setSelectedAppointment(appointment);
    setReminderSettings({
      enabled: appointment.reminder?.enabled || false,
      time: appointment.reminder?.time || '1 day before',
      sound: true,
      vibration: true,
      customMessage: ''
    });
    setShowReminderModal(true);

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const saveReminder = () => {
    const updatedAppointments = upcomingAppointments.map(apt =>
      apt.id === selectedAppointment.id
        ? { ...apt, reminder: { enabled: reminderSettings.enabled, time: reminderSettings.time } }
        : apt
    );
    setUpcomingAppointments(updatedAppointments);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowReminderModal(false);
      Alert.alert('Saved', `Reminder set for ${selectedAppointment.title}`);
    });
  };

  // Appointment Card Component
  const AppointmentCard = ({ appointment }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const theme = getTheme(appointment.type);

    return (
      <TouchableOpacity
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        onPress={() => openReminderModal(appointment)}
        activeOpacity={1}
        style={{ marginBottom: 20 }}
      >
        <Animated.View style={[
          styles.cardContainer,
          {
            transform: [{ scale }],
            shadowColor: theme.color,
          }
        ]}>
          <View style={styles.cardInner}>
            {/* Header: Avatar & Info */}
            <View style={styles.cardHeader}>
              <View style={[styles.avatarContainer, { borderColor: theme.color }]}>
                <Image source={{ uri: appointment.avatar }} style={styles.avatar} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{appointment.title}</Text>
                <Text style={styles.cardSubtitle}>for {appointment.child}</Text>
              </View>
              {/* Time Pill */}
              <View style={[styles.timeBadge, { backgroundColor: theme.light }]}>
                <Text style={[styles.timeText, { color: theme.color }]}>{appointment.time}</Text>
              </View>
            </View>

            {/* Footer: Details */}
            <View style={styles.cardFooter}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.detailText}>{appointment.date}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Ionicons name="medkit-outline" size={14} color="#64748B" />
                <Text style={styles.detailText}>{appointment.doctor}</Text>
              </View>
            </View>
          </View>

          {/* Top Inner Glow Border */}
          <View style={styles.innerGlow} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Dynamic Background Mesh */}
      <View style={styles.backgroundMesh}>
        <LinearGradient
          colors={['#F0F9FF', '#FDF4FF', '#FFFBEB']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Refined Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Good Morning,</Text>
            <Text style={styles.headerTitle}>Your Schedule</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Image
              source={parentPhoto || { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
              style={styles.profileImg}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Bento Grid Stats */}
          <View style={styles.bentoGrid}>
            {/* Large Block */}
            <View style={[styles.bentoCard, styles.bentoLarge]}>
              <View style={styles.bentoHeader}>
                <Text style={styles.bentoTitle}>This Week</Text>
                <Ionicons name="calendar" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.bentoNumber}>{stats.upcoming.toString().padStart(2, '0')}</Text>
              <Text style={styles.bentoSub}>Upcoming Visits</Text>
            </View>

            {/* Stacked Small Blocks */}
            <View style={styles.bentoStack}>
              <View style={[styles.bentoCard, styles.bentoSmall, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.bentoNumberSmall, { color: '#EF4444' }]}>{stats.overdue.toString().padStart(2, '0')}</Text>
                <Text style={styles.bentoLabel}>Overdue</Text>
              </View>
              <View style={[styles.bentoCard, styles.bentoSmall, { backgroundColor: '#ECFDF5' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Text style={[styles.bentoNumberSmall, { color: '#10B981' }]}>{stats.completed.toString().padStart(2, '0')}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
                <Text style={styles.bentoLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Appointment List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointments</Text>
            {upcomingAppointments.map(item => (
              <AppointmentCard key={item.id} appointment={item} />
            ))}
          </View>

          {/* Quick Actions (Floating Buttons) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('AddAppointment')}
              >
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.actionGradient}>
                  <Ionicons name="add" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Book Visit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  if (upcomingAppointments.length > 0) openReminderModal(upcomingAppointments[0]);
                  else Alert.alert('No Appointments', 'You have no upcoming appointments to set reminders for.');
                }}
              >
                <View style={[styles.actionGradient, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                  <Ionicons name="notifications" size={24} color="#64748B" />
                </View>
                <Text style={styles.actionLabel}>Reminders</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Reminder Modal */}
      <Modal transparent visible={showReminderModal} onRequestClose={() => setShowReminderModal(false)}>
        <BlurView intensity={20} style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reminder Settings</Text>
              <TouchableOpacity onPress={() => setShowReminderModal(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 24 }}>
              <Text style={{ fontSize: 16, color: '#334155', marginBottom: 20 }}>
                Notifications for <Text style={{ fontWeight: '700' }}>{selectedAppointment?.title}</Text>
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>Enabled</Text>
                <Switch
                  value={reminderSettings.enabled}
                  onValueChange={(v) => setReminderSettings({ ...reminderSettings, enabled: v })}
                  trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                />
              </View>

              {/* Time Selection */}
              {reminderSettings.enabled && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 12 }}>Remind me</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['None', '1 hour before', '1 day before', '2 days before'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setReminderSettings({ ...reminderSettings, time: t })}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                          backgroundColor: reminderSettings.time === t ? '#3B82F6' : '#F1F5F9',
                          borderWidth: 1, borderColor: reminderSettings.time === t ? '#2563EB' : '#E2E8F0'
                        }}
                      >
                        <Text style={{ fontSize: 13, color: reminderSettings.time === t ? '#FFF' : '#64748B', fontWeight: '500' }}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Options */}
              {reminderSettings.enabled && (
                <View>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                    onPress={() => setReminderSettings({ ...reminderSettings, sound: !reminderSettings.sound })}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: reminderSettings.sound ? '#3B82F6' : '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: reminderSettings.sound ? '#3B82F6' : 'transparent' }}>
                      {reminderSettings.sound && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={{ fontSize: 15, color: '#1E293B' }}>Play Sound</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
                    onPress={() => setReminderSettings({ ...reminderSettings, vibration: !reminderSettings.vibration })}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: reminderSettings.vibration ? '#3B82F6' : '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: reminderSettings.vibration ? '#3B82F6' : 'transparent' }}>
                      {reminderSettings.vibration && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={{ fontSize: 15, color: '#1E293B' }}>Vibrate</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={{ backgroundColor: '#3B82F6', padding: 16, borderRadius: 16, alignItems: 'center' }}
                onPress={saveReminder}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  backgroundMesh: {
    position: 'absolute',
    width: width,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800', // Heavy weight for contrast
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  profileBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  // Bento Grid
  bentoGrid: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    height: 140,
    marginBottom: 32,
    gap: 12,
  },
  bentoCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)', // Inner glow base?
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  bentoLarge: {
    flex: 1.2,
    justifyContent: 'space-between',
  },
  bentoStack: {
    flex: 0.8,
    gap: 12,
  },
  bentoSmall: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bentoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  bentoNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E293B',
  },
  bentoNumberSmall: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  bentoSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  // Section
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700', // Serif-like feel
    color: '#1E293B',
    marginBottom: 16,
  },
  // Appointment Card
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, // Softer, spread out
    shadowRadius: 24,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 10,
  },
  cardInner: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    borderWidth: 2,
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  // Quick Actions
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
});

export default ScheduleScreen;
