import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelectedWorkplace } from '../../contexts/SelectedWorkplaceContext';

const toTitleCaseWords = (value) => {
  const s = String(value || '').trim();
  if (!s) return '';
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const word = String(w);
      const head = word.charAt(0).toUpperCase();
      const tail = word.slice(1).toLowerCase();
      return `${head}${tail}`;
    })
    .join(' ');
};

const DoctorTeamAndRequestsScreen = ({ navigation }) => {
  const { selectedWorkplace: activeWorkplace } = useSelectedWorkplace();

  const workplaceLabel = useMemo(() => {
    if (!activeWorkplace) return '';
    return toTitleCaseWords(activeWorkplace.place_name || 'Workplace');
  }, [activeWorkplace]);

  const showDoctorJoinSteps = () => {
    Alert.alert(
      'How doctors join',
      '1) The doctor installs the app and signs up as a Doctor.\n2) They go to Join Workplace and select your clinic/hospital.\n3) They upload required documents and submit.\n4) Once approved by your workplace/admin, they will appear in your team.'
    );
  };

  const placeholderAction = (title) => {
    Alert.alert(title, 'This screen is ready. Backend endpoints are needed to make this action work.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
        <View style={styles.headerGlowA} />
        <View style={styles.headerGlowB} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team & Requests</Text>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.85} onPress={() => placeholderAction('Refresh')}>
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerMeta}>
          <View style={styles.metaIconShell}>
            <Ionicons name="briefcase-outline" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerMetaTitle} numberOfLines={1}>
              {activeWorkplace ? workplaceLabel : 'No Workplace Selected'}
            </Text>
            <Text style={styles.headerMetaSubtitle} numberOfLines={2}>
              {activeWorkplace
                ? 'Manage doctor requests, doctors, and staff for your workplace.'
                : 'Join a workplace first to manage your team.'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!activeWorkplace ? (
          <TouchableOpacity
            style={styles.joinCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Dashboard', { screen: 'JoinWorkplace', params: { hideTabBar: true } })}
          >
            <View style={styles.joinCardLeft}>
              <View style={styles.joinIconShell}>
                <Ionicons name="add-circle-outline" size={20} color="#667eea" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.joinTitle}>Join Workplace</Text>
                <Text style={styles.joinSubtitle} numberOfLines={2}>
                  Link your clinic/hospital to start receiving doctor requests.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7f8c8d" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.9} onPress={() => navigation.navigate('DoctorDoctorRequests')}>
            <View style={styles.actionLeft}>
              <LinearGradient colors={['rgba(102,126,234,0.18)', 'rgba(118,75,162,0.10)']} style={styles.actionIconGrad}>
                <Ionicons name="mail-unread-outline" size={20} color="#667eea" />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionTitle}>Doctor Requests</Text>
                <Text style={styles.actionSubtitle} numberOfLines={2}>
                  Approve / reject consulting and assistant doctors.
                </Text>
                <View style={styles.pillRow}>
                  <View style={[styles.pill, styles.pillInfo]}>
                    <Text style={[styles.pillText, styles.pillInfoText]}>0 Pending</Text>
                  </View>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7f8c8d" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DoctorTeamMembers', { type: 'doctors' })}
          >
            <View style={styles.actionLeft}>
              <LinearGradient colors={['rgba(34,197,94,0.16)', 'rgba(102,126,234,0.12)']} style={styles.actionIconGrad}>
                <Ionicons name="medkit-outline" size={20} color="#0f9d58" />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionTitle}>Doctors</Text>
                <Text style={styles.actionSubtitle} numberOfLines={2}>
                  View doctors linked to this workplace and remove if needed.
                </Text>
                <View style={styles.pillRow}>
                  <View style={[styles.pill, styles.pillNeutral]}>
                    <Text style={[styles.pillText, styles.pillNeutralText]}>0 Members</Text>
                  </View>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7f8c8d" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DoctorTeamMembers', { type: 'staff' })}
          >
            <View style={styles.actionLeft}>
              <LinearGradient colors={['rgba(245,158,11,0.16)', 'rgba(102,126,234,0.10)']} style={styles.actionIconGrad}>
                <Ionicons name="people-outline" size={20} color="#f59e0b" />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionTitle}>Staff</Text>
                <Text style={styles.actionSubtitle} numberOfLines={2}>
                  Add or remove receptionist / nursing / admin staff.
                </Text>
                <View style={styles.pillRow}>
                  <View style={[styles.pill, styles.pillNeutral]}>
                    <Text style={[styles.pillText, styles.pillNeutralText]}>0 Members</Text>
                  </View>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor Join Process</Text>
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.9} onPress={showDoctorJoinSteps}>
            <View style={styles.infoLeft}>
              <View style={styles.infoIconShell}>
                <Ionicons name="information-circle-outline" size={20} color="#667eea" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.infoTitle}>How doctors join your workplace</Text>
                <Text style={styles.infoSubtitle} numberOfLines={2}>
                  Doctors request access via Join Workplace. You approve them here.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  headerGrad: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  headerGlowA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    top: -70,
    right: -40,
  },
  headerGlowB: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: -70,
    left: -40,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerMeta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 12,
  },
  metaIconShell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMetaTitle: { color: '#fff', fontWeight: '900', fontSize: 14 },
  headerMetaSubtitle: { marginTop: 4, color: 'rgba(255,255,255,0.84)', fontSize: 12, lineHeight: 16 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 14 },

  section: { marginTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#2c3e50', marginBottom: 10 },

  joinCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf0f5',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joinCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  joinIconShell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102,126,234,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinTitle: { fontSize: 14, fontWeight: '900', color: '#2c3e50' },
  joinSubtitle: { marginTop: 3, fontSize: 12, color: '#7f8c8d', lineHeight: 16 },

  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf0f5',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  actionIconGrad: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.10)',
  },
  actionTitle: { fontSize: 14, fontWeight: '900', color: '#2c3e50' },
  actionSubtitle: { marginTop: 3, fontSize: 12, color: '#7f8c8d', lineHeight: 16 },

  pillRow: { flexDirection: 'row', marginTop: 10 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '900' },
  pillInfo: { backgroundColor: 'rgba(102,126,234,0.10)', borderColor: 'rgba(102,126,234,0.18)' },
  pillInfoText: { color: '#4f46e5' },
  pillNeutral: { backgroundColor: 'rgba(241,245,249,0.92)', borderColor: '#e2e8f0' },
  pillNeutralText: { color: '#334155' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf0f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  infoIconShell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102,126,234,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: { fontSize: 14, fontWeight: '900', color: '#2c3e50' },
  infoSubtitle: { marginTop: 3, fontSize: 12, color: '#7f8c8d', lineHeight: 16 },
});

export default DoctorTeamAndRequestsScreen;
