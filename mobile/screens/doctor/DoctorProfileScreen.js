import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doctorService } from '../../services/doctor/doctorService';

const DoctorProfileScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [workplaces, setWorkplaces] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await doctorService.getDoctorHome();
        if (mounted) {
          setDoctor(data?.doctor || data || null);
          setWorkplaces(Array.isArray(data?.workplaces) ? data.workplaces : []);
        }
      } catch (err) {
        if (mounted) setError('Unable to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', title: 'Personal Information', action: () => Alert.alert('Navigate', 'To Personal Info Screen') },
        { icon: 'lock-closed-outline', title: 'Security', action: () => Alert.alert('Navigate', 'To Security Settings') },
      ]
    },
    {
      title: 'Availability',
      items: [
        { icon: 'time-outline', title: 'Office Hours', action: () => Alert.alert('Navigate', 'To Office Hours Screen') },
        { icon: 'airplane-outline', title: 'Vacation Mode', action: () => Alert.alert('Navigate', 'To Vacation Mode Screen') },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', title: 'Push Notifications', toggle: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
      ]
    },
    {
      title: 'Support & Legal',
      items: [
        { icon: 'help-circle-outline', title: 'Help Center', action: () => {} },
        { icon: 'document-text-outline', title: 'Terms of Service', action: () => {} },
        { icon: 'log-out-outline', title: 'Sign Out', action: () => navigation.replace('Login'), danger: true },
      ]
    }
  ];

  const AnimatedMenuItem = ({ item, isLast }) => {
    const itemScale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(itemScale, { toValue: 0.98, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(itemScale, { toValue: 1, useNativeDriver: true }).start();

    return (
      <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={item.action} activeOpacity={1}>
        <Animated.View style={[styles.menuItem, isLast && styles.lastMenuItem, { transform: [{ scale: itemScale }] }]}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, item.danger && styles.dangerIcon]}>
              <Ionicons name={item.icon} size={20} color={item.danger ? '#ff6b6b' : '#667eea'} />
            </View>
            <Text style={[styles.menuItemTitle, item.danger && styles.dangerText]}>{item.title}</Text>
          </View>
          <View style={styles.menuItemRight}>
            {item.toggle ? (
              <Switch value={item.value} onValueChange={item.onToggle} trackColor={{ false: '#f1f3f4', true: '#667eea' }} thumbColor={'#fff'} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.profileCard}>
            {loading ? (
              <View style={styles.loadingBox}><ActivityIndicator color="#fff" /></View>
            ) : (
              <>
                <Image source={{ uri: 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(doctor?.full_name || 'Doctor') }} style={styles.avatar} />
                <Text style={styles.profileName}>{doctor?.full_name || 'Doctor'}</Text>
                <Text style={styles.profileSpecialty}>{doctor?.specialization || 'Specialization'}</Text>
                {!!doctor && (
                  <View style={[styles.verifyBadge, doctor.is_verified ? styles.verifiedBadge : styles.unverifiedBadge]}>
                    <Ionicons name={doctor.is_verified ? 'shield-checkmark' : 'shield-outline'} size={16} color={doctor.is_verified ? '#0f9d58' : '#ff6b6b'} />
                    <Text style={[styles.verifyBadgeText, doctor.is_verified ? styles.verifiedText : styles.unverifiedText]}>
                      {doctor.is_verified ? 'Verified' : 'Not Verified'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </LinearGradient>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Personal Information */}
        {!!doctor && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Personal Information</Text>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Full Name</Text><Text style={styles.detailValue}>{doctor.full_name}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Email</Text><Text style={styles.detailValue}>{doctor.email}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text style={styles.detailValue}>{doctor.phone_number}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Doctor ID</Text><Text style={styles.detailValue}>{String(doctor.doctor_id || '-') }</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Verification</Text>
              <Text style={[styles.detailValue, doctor.is_verified ? styles.statusVerifiedValue : styles.statusUnverifiedValue]}>
                {doctor.is_verified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Joined On</Text><Text style={styles.detailValue}>{doctor.created_at ? new Date(doctor.created_at).toLocaleDateString() : '-'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Last Updated</Text><Text style={styles.detailValue}>{doctor.updated_at ? new Date(doctor.updated_at).toLocaleDateString() : '-'}</Text></View>
          </View>
        )}

        {/* Professional Details */}
        {!!doctor && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Professional Details</Text>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Specialization</Text><Text style={styles.detailValue}>{doctor.specialization}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Reg. Number</Text><Text style={styles.detailValue}>{doctor.registration_number}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Reg. Council</Text><Text style={styles.detailValue}>{doctor.registration_council}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Experience</Text><Text style={styles.detailValue}>{doctor.experience_years} {doctor.experience_years === 1 ? 'year' : 'years'}</Text></View>
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.detailLabel}>Qualifications</Text>
              <View style={styles.qualChipsRow}>
                {(doctor.qualifications || '').split(',').map(q => q.trim()).filter(Boolean).map(q => (
                  <View key={q} style={styles.qualChip}><Text style={styles.qualChipText}>{q}</Text></View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Workplaces */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Workplaces</Text>
          {workplaces && workplaces.length > 0 ? (
            workplaces.map((wp, idx) => (
              <View key={idx} style={styles.detailRow}>
                <Text style={styles.detailLabel}>Place {idx + 1}</Text>
                <Text style={styles.detailValue}>{wp?.name || wp?.title || wp?.clinic_name || wp?.hospital_name || 'Workplace'}</Text>
              </View>
            ))
          ) : (
            <>
              <Text style={{ color: '#7f8c8d', marginBottom: 10 }}>No workplaces linked.</Text>
              <TouchableOpacity style={styles.joinWpBtn} onPress={() => navigation.navigate('Dashboard', { screen: 'JoinWorkplace', params: { hideTabBar: true } })}>
                <Text style={styles.joinWpBtnText}>Join a Workplace</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DoctorTeamAndRequests')}
            style={[styles.detailRow, { borderBottomWidth: 0 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="people-outline" size={18} color="#667eea" style={{ marginRight: 10 }} />
              <Text style={styles.detailLabel}>Team & Requests</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.detailValue, { color: '#667eea', fontWeight: '700' }]}>Manage</Text>
              <Ionicons name="chevron-forward" size={18} color="#7f8c8d" style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
            <View style={styles.statItem}><Text style={styles.statNumber}>152</Text><Text style={styles.statLabel}>Total Patients</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>34</Text><Text style={styles.statLabel}>Consultations</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>5</Text><Text style={styles.statLabel}>Years Practice</Text></View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <AnimatedMenuItem key={itemIndex} item={item} isLast={itemIndex === section.items.length - 1} />
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#2c3e50' },
  editButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8f9ff', justifyContent: 'center', alignItems: 'center' },
  profileSection: { paddingHorizontal: 20, marginTop: 20 },
  profileCard: { borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#667eea', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.3)' },
  profileName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  profileSpecialty: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' },
  loadingBox: { paddingVertical: 12 },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#fff' },
  verifiedBadge: { backgroundColor: '#e8f5e9' },
  unverifiedBadge: { backgroundColor: '#fdecea' },
  verifyBadgeText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },
  verifiedText: { color: '#0f9d58' },
  unverifiedText: { color: '#a94442' },
  errorBanner: { backgroundColor: '#FDECEA', borderColor: '#F5C6CB', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 20, marginTop: 12 },
  errorBannerText: { color: '#A94442', fontSize: 13 },
  detailsCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f1f3f4' },
  detailsTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f6f7f9' },
  detailLabel: { fontSize: 14, color: '#7f8c8d', flex: 1 },
  detailValue: { fontSize: 14, color: '#2c3e50', flex: 1, textAlign: 'right' },
  statusVerifiedValue: { color: '#0f9d58', fontWeight: '700' },
  statusUnverifiedValue: { color: '#a94442', fontWeight: '700' },
  qualChipsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 },
  qualChip: { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, marginLeft: 8, marginBottom: 6 },
  qualChipText: { color: '#2c3e50', fontSize: 12, fontWeight: '600' },
  joinWpBtn: { backgroundColor: '#667eea', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  joinWpBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20, shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#2c3e50' },
  statLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  menuSection: { marginTop: 32, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  lastMenuItem: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(102, 126, 234, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  dangerIcon: { backgroundColor: 'rgba(255, 107, 107, 0.1)' },
  menuItemTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  dangerText: { color: '#ff6b6b' },
  menuItemRight: { marginLeft: 16 },
});

export default DoctorProfileScreen;
