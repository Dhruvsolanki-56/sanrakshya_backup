import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Switch,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Animated,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import LevelTracker from '../../components/Gamification';
import { userService } from '../../services/userService';
import * as DocumentPicker from 'expo-document-picker';
import { useSelectedChild } from '../../contexts/SelectedChildContext';
import { BASE_URL } from '../../config';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  /* -------------------------------------------------------------------------- */
  /*                               Logic Section                                */
  /* -------------------------------------------------------------------------- */
  const { theme, isDark, toggleTheme } = useTheme();
  const { reloadChildren } = useSelectedChild();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [userLevel, setUserLevel] = useState(5);
  const [userPoints, setUserPoints] = useState(1250);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [parentData, setParentData] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [uploadingParentPhoto, setUploadingParentPhoto] = useState(false);
  const [parentPhotoError, setParentPhotoError] = useState('');
  const [showParentPhotoPreview, setShowParentPhotoPreview] = useState(false);

  const [parentPhotoSource, setParentPhotoSource] = useState(null);

  const parentPhotoUri = parentPhotoSource?.uri || null;

  const loadProfile = async (mountedRef) => {
    setLoadError('');
    setLoading(true);
    try {
      const data = await userService.getParentHome();
      if (mountedRef && !mountedRef.current) return;
      setParentData(data || null);

      try {
        const src = await userService.getParentPhotoSource(data?.parent_photo_url || data?.avatar_url);
        if (mountedRef && !mountedRef.current) return;
        setParentPhotoSource(src);
      } catch (_) {
        if (mountedRef && !mountedRef.current) return;
        setParentPhotoSource(null);
      }

      const computeAgeYears = (dob) => {
        if (!dob) return null;
        const d = new Date(dob);
        if (Number.isNaN(d.getTime())) return null;
        const diff = Date.now() - d.getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
      };

      const mapped = await Promise.all(
        (data?.children || []).map(async (c, idx) => {
          const id = c.child_id ?? String(idx + 1);
          let avatarSource = null;
          try {
            avatarSource = await userService.getChildPhotoSource(id, c.photo_url || c.avatar_url);
          } catch (_) {
            avatarSource = null;
          }
          return {
            id,
            name: c.name || c.full_name || 'Child',
            age: computeAgeYears(c.date_of_birth) ?? 0,
            dobRaw: c.date_of_birth || null,
            avatarSource,
          };
        })
      );
      setChildren(mapped);
    } catch (err) {
      if (mountedRef && !mountedRef.current) return;
      setLoadError(err?.message || 'Failed to load profile');
    } finally {
      if (!mountedRef || (mountedRef && mountedRef.current)) setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const ref = { current: true };
      loadProfile(ref);
      return () => { ref.current = false; };
    }, [])
  );

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

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', title: 'Personal Information', subtitle: 'Update your details', action: () => openEditModal(), color: '#3B82F6' },
        { icon: 'people-outline', title: 'Family Members', subtitle: `${children.length} children added`, action: () => openChildrenModal(), color: '#10B981' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Push notifications', toggle: true, value: notificationsEnabled, onToggle: setNotificationsEnabled, color: '#F59E0B' },
        { icon: 'finger-print-outline', title: 'Biometric Login', subtitle: 'Use fingerprint/face ID', toggle: true, value: biometricEnabled, onToggle: setBiometricEnabled, color: '#8B5CF6' },
        { icon: 'moon-outline', title: 'Dark Mode', subtitle: isDark ? 'Enabled' : 'Disabled', toggle: true, value: isDark, onToggle: toggleTheme, color: '#64748B' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help Center', subtitle: 'FAQs and guides', action: () => showHelpAlert(), color: '#EC4899' },
        { icon: 'chatbubble-outline', title: 'Contact Support', subtitle: '24/7 assistance', action: () => showSupportAlert(), color: '#06B6D4' },
      ]
    },
    {
      title: 'Legal',
      items: [
        { icon: 'log-out-outline', title: 'Sign Out', subtitle: 'Logout from account', action: () => showSignOutAlert(), danger: true, color: '#EF4444' },
      ]
    }
  ];

  const openEditModal = () => {
    setEditedProfile({
      name: parentData?.full_name || '',
      email: parentData?.email || '',
      phone: parentData?.phone_number || parentData?.phone || '',
      location: parentData?.location || '',
    });
    // Navigate to dedicated edit screen
    navigation.navigate('ParentProfileEdit', {
      parent: {
        full_name: parentData?.full_name,
        email: parentData?.email,
        phone_number: parentData?.phone_number || parentData?.phone,
      },
    });
  };

  const pickAndUploadParentPhoto = async () => {
    setParentPhotoError('');
    if (uploadingParentPhoto) return;

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res?.canceled) return;
      const file = res?.assets && res.assets.length ? res.assets[0] : null;
      if (!file?.uri) {
        setParentPhotoError('Please select an image file.');
        return;
      }

      const mime = (file.mimeType || '').toLowerCase();
      const name = String(file.name || '').toLowerCase();
      const looksLikeImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(name);
      if (!looksLikeImage) {
        setParentPhotoError('Only image files are allowed.');
        return;
      }

      const confirm = await new Promise((resolve) => {
        Alert.alert(
          'Upload photo?',
          'Do you want to upload this picture as your profile photo?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Upload', onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirm) return;

      setUploadingParentPhoto(true);
      await userService.uploadParentPhoto(file);

      // Refresh cached parent-home and propagate avatar updates to child context/screens
      await userService.refreshParentHome();
      try {
        await reloadChildren();
      } catch (_) { }

      // Refresh local screen state
      const latest = await userService.getParentHome({ forceRefresh: false });
      setParentData(latest || null);
    } catch (err) {
      if (err?.status === 401) setParentPhotoError('Your session has expired. Please login again.');
      else if (err?.status === 413) setParentPhotoError('Image is too large. Please choose a smaller photo.');
      else if (err?.message === 'Network request failed') setParentPhotoError('Could not connect to the server.');
      else setParentPhotoError(err?.message || 'Failed to upload photo.');
    } finally {
      setUploadingParentPhoto(false);
    }
  };

  const onParentAvatarPress = () => {
    setParentPhotoError('');
    if (parentPhotoUri) {
      Alert.alert('Profile photo', 'What would you like to do?', [
        { text: 'View', onPress: () => setShowParentPhotoPreview(true) },
        { text: 'Change', onPress: () => pickAndUploadParentPhoto() },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    pickAndUploadParentPhoto();
  };

  const openChildrenModal = () => {
    setShowChildrenModal(true);
    animateModal();
  };

  const animateModal = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = (callback) => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEditModal(false);
      setShowChildrenModal(false);
      if (callback) callback();
    });
  };

  const saveProfile = () => {
    // setProfileData({ ...editedProfile }); 
    closeModal(() => {
      Alert.alert('Success! ✨', 'Your profile has been updated successfully.');
    });
  };

  const showSubscriptionAlert = () => {
    Alert.alert(
      'Premium Subscription 👑',
      'You are currently on the Premium plan with unlimited access to all features.',
      [{ text: 'Manage', style: 'default' }, { text: 'OK', style: 'cancel' }]
    );
  };

  const showHelpAlert = () => {
    Alert.alert(
      'Help Center 🆘',
      'Access our comprehensive help center with FAQs, guides, and tutorials.',
      [{ text: 'Open Help', style: 'default' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const showSupportAlert = () => {
    Alert.alert(
      'Contact Support 💬',
      'Our support team is available 24/7 to help you with any questions or issues.',
      [{ text: 'Chat Now', style: 'default' }, { text: 'Email', style: 'default' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const showRatingAlert = () => {
    Alert.alert(
      'Rate Sanrakshya ⭐',
      'Love using Sanrakshya? Please take a moment to rate us on the App Store!',
      [{ text: 'Rate Now', style: 'default' }, { text: 'Later', style: 'cancel' }]
    );
  };

  const showPrivacyAlert = () => {
    Alert.alert(
      'Privacy Policy 🔒',
      'Your privacy is our priority. We use industry-standard encryption to protect your data.',
      [{ text: 'Read Policy', style: 'default' }, { text: 'OK', style: 'cancel' }]
    );
  };

  const showTermsAlert = () => {
    Alert.alert(
      'Terms of Service 📋',
      'Review our terms of service and usage agreement.',
      [{ text: 'Read Terms', style: 'default' }, { text: 'OK', style: 'cancel' }]
    );
  };

  const showSignOutAlert = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               UI Render                                    */
  /* -------------------------------------------------------------------------- */
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.cardContainer}>
            <View style={[styles.glassCard, { alignItems: 'center', paddingVertical: 30 }]}>
              <TouchableOpacity
                onPress={onParentAvatarPress}
                activeOpacity={0.9}
                disabled={uploadingParentPhoto}
                style={{ marginBottom: 16 }}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={parentPhotoSource ? parentPhotoSource : require('../../assets/icon.png')}
                    style={styles.avatar}
                  />
                  <View style={styles.editBadge}>
                    <Ionicons name={uploadingParentPhoto ? "cloud-upload" : "camera"} size={14} color="#FFF" />
                  </View>
                </View>
              </TouchableOpacity>

              <Text style={styles.userName}>{parentData?.full_name || 'Parent'}</Text>
              <Text style={styles.userEmail}>{parentData?.email || ''}</Text>

              {parentPhotoError ? (
                <Text style={styles.errorText}>{parentPhotoError}</Text>
              ) : null}

              <View style={styles.premiumBadge}>
                <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.premiumGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="star" size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.premiumText}>PREMIUM MEMBER</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Gamification */}
          <View style={{ paddingHorizontal: 20 }}>
            <LevelTracker level={userLevel} points={userPoints} />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{children.length}</Text>
              <Text style={styles.statLabel}>Children</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, idx) => (
            <View key={idx} style={styles.section}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <View style={styles.glassCard}>
                {section.items.map((item, itemIdx) => (
                  <View key={itemIdx}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={item.toggle ? () => item.onToggle(!item.value) : item.action}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.menuIconBox, { backgroundColor: `${item.color}15` }]}>
                        <Ionicons name={item.icon} size={20} color={item.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuTitle, item.danger && { color: '#EF4444' }]}>{item.title}</Text>
                        <Text style={styles.menuSub}>{item.subtitle}</Text>
                      </View>

                      {item.toggle ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                          thumbColor={'#FFF'}
                        />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                      )}
                    </TouchableOpacity>
                    {itemIdx < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

        </ScrollView>
      </SafeAreaView>

      {/* Children Modal (Clean Style) */}
      <Modal
        transparent visible={showChildrenModal} onRequestClose={() => setShowChildrenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleLarge}>Family Members</Text>
              <TouchableOpacity onPress={() => setShowChildrenModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {children.map((child) => (
                <View key={child.id} style={styles.childRow}>
                  <Image
                    source={child.avatarSource ? child.avatarSource : require('../../assets/icon.png')}
                    style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childNameText}>{child.name}</Text>
                    <Text style={styles.childAgeText}>{formatAgeText(child.dobRaw)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setShowChildrenModal(false); navigation.navigate('ChildEdit', { child_id: child.id }); }} style={styles.iconBtn}>
                    <Ionicons name="pencil" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => { setShowChildrenModal(false); navigation.navigate('ChildRegistration'); }}
            >
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.primaryBtnGradient}>
                <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Add Child</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Profile Modal Placeholder (Uses Nav) */}
      <Modal transparent visible={showEditModal} onRequestClose={() => closeModal()}>
        {/* Logic handles nav, this is just legacy if strict modal requested, but nav used above */}
      </Modal>

      {/* Photo Preview Modal */}
      <Modal visible={showParentPhotoPreview} transparent animationType="fade" onRequestClose={() => setShowParentPhotoPreview(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <Image source={parentPhotoSource} style={{ width: width - 40, height: width - 40, borderRadius: 20 }} resizeMode="contain" />
          <TouchableOpacity onPress={() => setShowParentPhotoPreview(false)} style={{ marginTop: 20, padding: 10 }}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },

  cardContainer: { paddingHorizontal: 20, marginBottom: 20 },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden'
  },

  /* Avatar */
  avatarContainer: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#FFF' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#3B82F6', width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF'
  },
  userName: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 8 },

  premiumBadge: { marginTop: 4, borderRadius: 20, overflow: 'hidden' },
  premiumGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  premiumText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  /* Stats */
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 4, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0'
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },

  /* Sections */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Menu Items */
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  menuSub: { fontSize: 12, color: '#94A3B8' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 64 },

  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 350, backgroundColor: '#FFF', borderRadius: 24, padding: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitleLarge: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  closeBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 12 },

  childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  childNameText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  childAgeText: { fontSize: 13, color: '#64748B' },
  iconBtn: { padding: 8 },

  primaryBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  primaryBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }
});

export default ProfileScreen;
