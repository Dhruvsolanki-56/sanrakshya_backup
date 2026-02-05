import React, { useMemo, useState } from 'react';
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

const DoctorTeamMembersScreen = ({ navigation, route }) => {
  const { selectedWorkplace: activeWorkplace } = useSelectedWorkplace();

  const initialType = String(route?.params?.type || 'doctors').toLowerCase();
  const [type, setType] = useState(initialType === 'staff' ? 'staff' : 'doctors');
  const title = type === 'staff' ? 'Staff Members' : 'Doctor Members';

  const workplaceLabel = useMemo(() => {
    if (!activeWorkplace) return '';
    return toTitleCaseWords(activeWorkplace.place_name || 'Workplace');
  }, [activeWorkplace]);

  const placeholder = (action) => {
    Alert.alert(action, 'Backend endpoint needed. UI is ready to wire with API.');
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
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.85} onPress={() => placeholder('Refresh Members')}>
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
              {type === 'staff' ? 'Add or remove staff for this workplace.' : 'View and manage doctors for this workplace.'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.segmentWrap}>
          <View style={styles.segmentPill}>
            <TouchableOpacity
              style={[styles.segmentBtn, type === 'doctors' && styles.segmentBtnActive]}
              activeOpacity={0.9}
              onPress={() => setType('doctors')}
            >
              <Ionicons name="medkit-outline" size={14} color={type === 'doctors' ? '#fff' : '#64748b'} />
              <Text style={[styles.segmentText, type === 'doctors' && styles.segmentTextActive]}>Doctors</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, type === 'staff' && styles.segmentBtnActive]}
              activeOpacity={0.9}
              onPress={() => setType('staff')}
            >
              <Ionicons name="people-outline" size={14} color={type === 'staff' ? '#fff' : '#64748b'} />
              <Text style={[styles.segmentText, type === 'staff' && styles.segmentTextActive]}>Staff</Text>
            </TouchableOpacity>
          </View>

          {type === 'staff' ? (
            <TouchableOpacity style={styles.fabAdd} activeOpacity={0.9} onPress={() => placeholder('Add Staff')}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.fabAddText}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIconShell}>
            <Ionicons name={type === 'staff' ? 'people-outline' : 'medkit-outline'} size={22} color="#667eea" />
          </View>
          <Text style={styles.emptyTitle}>No {type === 'staff' ? 'staff' : 'doctors'} found</Text>
          <Text style={styles.emptySubtitle}>
            {type === 'staff'
              ? 'Once staff are added, they will appear here.'
              : 'Once doctors are approved, they will appear here.'}
          </Text>
        </View>

        <Text style={styles.demoLabel}>Demo (UI Preview)</Text>
        <View style={styles.memberCard}>
          <View style={styles.memberTopRow}>
            <View style={styles.avatarShell}>
              <Ionicons name={type === 'staff' ? 'person-outline' : 'medkit-outline'} size={18} color="#667eea" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.memberName}>{type === 'staff' ? 'Reception Staff' : 'Dr. Alice Smith'}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.metaChip, styles.metaChipRole]}>
                  <Ionicons name="briefcase-outline" size={12} color="#64748b" />
                  <Text style={styles.metaChipText}>{type === 'staff' ? 'Front Desk' : 'Assistant Doctor'}</Text>
                </View>
                <View style={[styles.metaChip, styles.metaChipStatus]}>
                  <Ionicons name="checkmark-circle-outline" size={12} color="#0f9d58" />
                  <Text style={[styles.metaChipText, { color: '#0f9d58' }]}>Active</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.memberActionsRow}>
            <TouchableOpacity style={styles.removeBtn} activeOpacity={0.9} onPress={() => placeholder('Remove Member')}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            This is a demo card. Once backend APIs are added, it will render real team members.
          </Text>
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

  segmentWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segmentPill: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 6,
    borderWidth: 1,
    borderColor: '#edf0f5',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  segmentBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
  segmentBtnActive: { backgroundColor: '#667eea' },
  segmentText: { marginLeft: 8, fontSize: 12, fontWeight: '900', color: '#64748b' },
  segmentTextActive: { color: '#fff' },

  fabAdd: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f9d58', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
  fabAddText: { marginLeft: 8, color: '#fff', fontWeight: '900', fontSize: 12 },

  emptyCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#edf0f5',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    alignItems: 'center',
  },
  emptyIconShell: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(102,126,234,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 12, fontSize: 15, fontWeight: '900', color: '#2c3e50' },
  emptySubtitle: { marginTop: 6, textAlign: 'center', color: '#7f8c8d', fontSize: 12, lineHeight: 18 },

  demoLabel: { marginTop: 16, color: '#7f8c8d', fontSize: 12, fontWeight: '800' },

  memberCard: {
    marginTop: 10,
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
  },
  memberTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatarShell: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(102,126,234,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: { fontSize: 14, fontWeight: '900', color: '#2c3e50' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  metaChipText: { marginLeft: 6, fontSize: 12, fontWeight: '900', color: '#64748b' },
  metaChipRole: { backgroundColor: 'rgba(241,245,249,0.92)', borderColor: '#e2e8f0' },
  metaChipStatus: { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.18)' },

  memberActionsRow: { flexDirection: 'row', marginTop: 10 },
  removeBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ff6b6b', paddingVertical: 12, borderRadius: 14 },
  removeBtnText: { marginLeft: 8, color: '#fff', fontWeight: '900', fontSize: 13 },

  note: { marginTop: 12, color: '#7f8c8d', fontSize: 12, lineHeight: 18 },
});

export default DoctorTeamMembersScreen;
