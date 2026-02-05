import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { childrenService } from '../../services/childrenService';
import { userService } from '../../services/userService';
import { enums } from '../../services/storage';
import * as DocumentPicker from 'expo-document-picker';
import { useSelectedChild } from '../../contexts/SelectedChildContext';
import { BASE_URL } from '../../config';

const ChildEditScreen = ({ navigation, route }) => {
  const childId = route?.params?.child_id;
  const { reloadChildren } = useSelectedChild();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(enums.Gender[0]);
  const [bloodGroup, setBloodGroup] = useState(enums.BloodGroup[0]);
  const [origFullName, setOrigFullName] = useState('');
  const [origDob, setOrigDob] = useState('');
  const [origGender, setOrigGender] = useState(enums.Gender[0]);
  const [origBloodGroup, setOrigBloodGroup] = useState(enums.BloodGroup[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [childPhotoUrl, setChildPhotoUrl] = useState(null);
  const [uploadingChildPhoto, setUploadingChildPhoto] = useState(false);
  const [childPhotoError, setChildPhotoError] = useState('');
  const [showChildPhotoPreview, setShowChildPhotoPreview] = useState(false);

  const [childPhotoSource, setChildPhotoSource] = useState(null);
  const childPhotoUri = childPhotoSource?.uri || null;
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [selYear, setSelYear] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const [selDay, setSelDay] = useState(null);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);

  const today = new Date();
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(today.getFullYear() - 10);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    let mounted = true;
    const loadSource = async () => {
      try {
        const src = await userService.getChildPhotoSource(childId, childPhotoUrl);
        if (mounted) setChildPhotoSource(src);
      } catch (_) {
        if (mounted) setChildPhotoSource(null);
      }
    };
    loadSource();
    return () => {
      mounted = false;
    };
  }, [childId, childPhotoUrl]);

  const formatYMD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const pickAndUploadChildPhoto = async () => {
    setChildPhotoError('');
    if (uploadingChildPhoto) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res?.canceled) return;
      const file = res?.assets && res.assets.length ? res.assets[0] : null;
      if (!file?.uri) {
        setChildPhotoError('Please select an image file.');
        return;
      }

      const mime = (file.mimeType || '').toLowerCase();
      const name = String(file.name || '').toLowerCase();
      const looksLikeImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(name);
      if (!looksLikeImage) {
        setChildPhotoError('Only image files are allowed.');
        return;
      }

      const confirm = await new Promise((resolve) => {
        Alert.alert(
          'Upload photo?',
          'Do you want to upload this picture as the child photo?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Upload', onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirm) return;

      setUploadingChildPhoto(true);
      await userService.uploadChildPhoto(childId, file);
      await userService.refreshParentHome();
      try {
        await reloadChildren();
      } catch (_) {}

      // Try to refresh this screen's photo preview
      try {
        const updated = await childrenService.getChild(childId);
        setChildPhotoUrl(updated?.photo_url || updated?.avatar_url || null);
      } catch (_) {}
    } catch (err) {
      if (err?.status === 401) setChildPhotoError('Your session has expired. Please login again.');
      else if (err?.status === 413) setChildPhotoError('Image is too large. Please choose a smaller photo.');
      else if (err?.message === 'Network request failed') setChildPhotoError('Could not connect to the server.');
      else setChildPhotoError(err?.message || 'Failed to upload photo.');
    } finally {
      setUploadingChildPhoto(false);
    }
  };

  const onChildAvatarPress = () => {
    setChildPhotoError('');
    if (childPhotoUri) {
      Alert.alert('Child photo', 'What would you like to do?', [
        { text: 'View', onPress: () => setShowChildPhotoPreview(true) },
        { text: 'Change', onPress: () => pickAndUploadChildPhoto() },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    pickAndUploadChildPhoto();
  };

  const formatDisplayDob = (value) => {
    if (!value) return 'YYYY-MM-DD';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'YYYY-MM-DD';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mon = monthNames[dt.getMonth()];
    const yyyy = dt.getFullYear();
    return `${dd} ${mon} ${yyyy}`;
  };

  const parseDobToSelections = (value) => {
    const base = value ? new Date(value) : today;
    setSelYear(base.getFullYear());
    setSelMonth(base.getMonth() + 1);
    setSelDay(base.getDate());
  };

  const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getYearOptions = () => {
    const years = [];
    for (let y = today.getFullYear(); y >= tenYearsAgo.getFullYear(); y--) years.push(y);
    return years;
  };
  const getMonthOptions = () => {
    if (!selYear) return [];
    const maxMonth = selYear === today.getFullYear() ? today.getMonth() + 1 : 12;
    const minMonth = selYear === tenYearsAgo.getFullYear() ? tenYearsAgo.getMonth() + 1 : 1;
    const arr = [];
    for (let m = minMonth; m <= maxMonth; m++) arr.push(m);
    return arr;
  };
  const getDayOptions = () => {
    if (!selYear || !selMonth) return [];
    const total = daysInMonth(selYear, selMonth);
    let maxDay = total;
    let minDay = 1;
    if (selYear === today.getFullYear() && selMonth === (today.getMonth() + 1)) maxDay = Math.min(maxDay, today.getDate());
    if (selYear === tenYearsAgo.getFullYear() && selMonth === (tenYearsAgo.getMonth() + 1)) minDay = Math.max(minDay, tenYearsAgo.getDate());
    const arr = [];
    for (let d = minDay; d <= maxDay; d++) arr.push(d);
    return arr;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError('');
      try {
        const data = await childrenService.getChild(childId);
        if (!mounted) return;
        const fn = data?.full_name || '';
        const db = data?.date_of_birth || '';
        const gd = data?.gender && enums.Gender.includes(data.gender) ? data.gender : enums.Gender[0];
        const bg = data?.blood_group && enums.BloodGroup.includes(data.blood_group) ? data.blood_group : enums.BloodGroup[0];
        const photo = data?.photo_url || data?.avatar_url || null;
        setFullName(fn);
        setDob(db);
        setGender(gd);
        setBloodGroup(bg);
        setOrigFullName(fn);
        setOrigDob(db);
        setOrigGender(gd);
        setOrigBloodGroup(bg);
        setChildPhotoUrl(photo);
      } catch (err) {
        if (err?.status === 404) setError('Child not found');
        else if (err?.message === 'Network request failed') setError('Could not connect to the server.');
        else setError(err?.message || 'Failed to load child.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (childId != null) load();
    return () => { mounted = false; };
  }, [childId]);

  const validate = () => {
    if (!fullName.trim()) return 'Enter full name';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return 'DOB must be YYYY-MM-DD';
    return '';
  };

  const onSave = async () => {
    setError('');
    // Compare changes
    const noChanges =
      fullName.trim() === origFullName.trim() &&
      dob === origDob &&
      gender === origGender &&
      bloodGroup === origBloodGroup;
    if (noChanges) {
      Alert.alert('No Changes', 'No fields were modified.');
      return;
    }
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true);
    try {
      await childrenService.updateChild(childId, {
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        blood_group: bloodGroup,
      });
      Alert.alert('Success', 'Child updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      if (err?.status === 422) {
        const firstError = err?.data?.detail && err.data.detail.length > 0 ? err.data.detail[0].msg : 'Validation error';
        setError(firstError);
      } else if (err?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else if (err?.message === 'Network request failed') {
        setError('Could not connect to the server.');
      } else {
        setError(err?.message || 'An unexpected error occurred.');
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    Alert.alert('Delete Child', 'Are you sure you want to delete this child?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        Alert.alert('Confirm Delete', 'Please confirm again to delete this child.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
              try {
                await childrenService.deleteChild(childId);
                Alert.alert('Deleted', 'Child deleted successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } catch (err) {
                if (err?.status === 401) Alert.alert('Error', 'Your session has expired. Please login again.');
                else if (err?.message === 'Network request failed') Alert.alert('Error', 'Could not connect to the server.');
                else Alert.alert('Error', err?.message || 'Failed to delete child.');
              }
            } }
        ]);
      } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Child</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.photoCard}>
            <TouchableOpacity
              onPress={onChildAvatarPress}
              activeOpacity={0.9}
              disabled={uploadingChildPhoto}
              style={styles.photoTap}
            >
              <View style={styles.childAvatarWrap}>
                {childPhotoSource ? (
                  <Image
                    source={childPhotoSource}
                    style={styles.childAvatarImg}
                  />
                ) : (
                  <View style={styles.childAvatarCircle}>
                    <Text style={styles.childAvatarInitial}>{(fullName || 'C').trim().charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.childAvatarBadge}>
                  {uploadingChildPhoto ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#fff" />
                  )}
                </View>
              </View>
              <Text style={styles.photoTitle}>Child photo</Text>
              <Text style={styles.photoSubtitle}>Tap to upload / update</Text>
            </TouchableOpacity>

            {childPhotoError ? (
              <View style={styles.photoErrorBox}>
                <Ionicons name="alert-circle" size={18} color="#d93025" style={{ marginRight: 8 }} />
                <Text style={styles.photoErrorText}>{childPhotoError}</Text>
              </View>
            ) : null}
          </View>

          <Modal
            visible={showChildPhotoPreview}
            transparent
            animationType="fade"
            onRequestClose={() => setShowChildPhotoPreview(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.previewOverlay}
              onPress={() => setShowChildPhotoPreview(false)}
            >
              <View style={styles.previewCard}>
                {childPhotoSource ? (
                  <Image
                    source={childPhotoSource}
                    style={styles.previewImage}
                  />
                ) : null}
                <TouchableOpacity
                  onPress={() => setShowChildPhotoPreview(false)}
                  style={styles.previewCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Enter full name" style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 46 }]}
              onPress={() => { parseDobToSelections(dob); setShowDobPicker(true); }}
            >
              <Text style={{ color: '#2c3e50' }}>{formatDisplayDob(dob)}</Text>
              <Ionicons name="calendar" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <TouchableOpacity style={[styles.dropdownTrigger]} onPress={() => setShowGenderModal(true)}>
              <Text style={{ color: '#2c3e50', fontSize: 16 }}>{gender}</Text>
              <Ionicons name="chevron-down" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Blood Group</Text>
            <TouchableOpacity style={[styles.dropdownTrigger]} onPress={() => setShowBloodModal(true)}>
              <Text style={{ color: '#2c3e50', fontSize: 16 }}>{bloodGroup}</Text>
              <Ionicons name="chevron-down" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#d93025" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : <View style={{ height: 8 }} />}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={onSave} disabled={saving}>
              <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.buttonInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={onDelete}>
              <LinearGradient colors={["#ff6b6b", "#f06565"]} style={styles.buttonInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.buttonText}>Delete</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* DOB Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showDobPicker}
        onRequestClose={() => setShowDobPicker(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDobPicker(false)} />
          <View style={[styles.modalCardBottom, { maxHeight: '70%', paddingBottom: 16 }]}> 
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                <Ionicons name="close" size={22} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <View style={styles.dateColumnsRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColLabel}>Day</Text>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {getDayOptions().map((d) => (
                    <TouchableOpacity key={d} style={[styles.optionItem, selDay === d && styles.optionSelected]} onPress={() => { setSelDay(d); const y=selYear,m=selMonth; if (y && m) setDob(formatYMD(new Date(y, m-1, d))); }}>
                      <Text style={[styles.optionText, selDay === d && styles.optionTextSelected]}>{String(d).padStart(2,'0')}</Text>
                      {selDay === d && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColLabel}>Month</Text>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {getMonthOptions().map((m) => (
                    <TouchableOpacity key={m} style={[styles.optionItem, selMonth === m && styles.optionSelected]} onPress={() => { setSelMonth(m); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); const y=selYear,d=selDay; if (y && d) setDob(formatYMD(new Date(y, m-1, d))); }}>
                      <Text style={[styles.optionText, selMonth === m && styles.optionTextSelected]}>{monthNames[m-1]}</Text>
                      {selMonth === m && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColLabel}>Year</Text>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {getYearOptions().map((y) => (
                    <TouchableOpacity key={y} style={[styles.optionItem, selYear === y && styles.optionSelected]} onPress={() => { setSelYear(y); if (selMonth && !getMonthOptions().includes(selMonth)) setSelMonth(null); if (selDay && !getDayOptions().includes(selDay)) setSelDay(null); const m=selMonth,d=selDay; if (m && d) setDob(formatYMD(new Date(y, m-1, d))); }}>
                      <Text style={[styles.optionText, selYear === y && styles.optionTextSelected]}>{y}</Text>
                      {selYear === y && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gender Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showGenderModal}
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowGenderModal(false)} />
          <View style={[styles.modalCardBottom, { maxHeight: '60%' }]}> 
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={22} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {enums.Gender.map((g) => (
                <TouchableOpacity key={g} style={[styles.optionItem, gender === g && styles.optionSelected]} onPress={() => { setGender(g); setShowGenderModal(false); }}>
                  <Text style={[styles.optionText, gender === g && styles.optionTextSelected]}>{g}</Text>
                  {gender === g && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Blood Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showBloodModal}
        onRequestClose={() => setShowBloodModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowBloodModal(false)} />
          <View style={[styles.modalCardBottom, { maxHeight: '60%' }]}> 
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Blood Group</Text>
              <TouchableOpacity onPress={() => setShowBloodModal(false)}>
                <Ionicons name="close" size={22} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {enums.BloodGroup.map((b) => (
                <TouchableOpacity key={b} style={[styles.optionItem, bloodGroup === b && styles.optionSelected]} onPress={() => { setBloodGroup(b); setShowBloodModal(false); }}>
                  <Text style={[styles.optionText, bloodGroup === b && styles.optionTextSelected]}>{b}</Text>
                  {bloodGroup === b && <Ionicons name="checkmark-circle" size={20} color="#667eea" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
  content: { padding: 16 },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2ff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  photoTap: { alignItems: 'center', justifyContent: 'center' },
  childAvatarWrap: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  childAvatarImg: { width: 88, height: 88, borderRadius: 44 },
  childAvatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dbe4ff',
  },
  childAvatarInitial: { fontSize: 28, fontWeight: '800', color: '#667eea' },
  childAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  photoSubtitle: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  photoErrorBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
  },
  photoErrorText: { color: '#d93025', fontSize: 12, flex: 1 },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewCard: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  inputGroup: { marginTop: 12 },
  inputLabel: { fontSize: 13, color: '#7f8c8d', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dadce0', borderRadius: 10, paddingHorizontal: 12, height: 46, color: '#2c3e50' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', borderColor: '#f5c6cb', borderWidth: 1, padding: 10, borderRadius: 8, marginTop: 12 },
  errorText: { color: '#d93025', fontSize: 12 },
  button: { marginTop: 16, borderRadius: 10, overflow: 'hidden' },
  buttonInner: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dropdownTrigger: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCardBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  dateColumnsRow: { flexDirection: 'row', gap: 10 },
  dateColumn: { flex: 1, backgroundColor: '#f8f9ff', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8, maxHeight: 220 },
  dateColLabel: { fontSize: 12, color: '#7f8c8d', marginBottom: 6, marginLeft: 4, fontWeight: '600' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginTop: 6, backgroundColor: '#f8f9ff' },
  optionSelected: { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#dbe4ff' },
  optionText: { fontSize: 16, color: '#2c3e50' },
  optionTextSelected: { color: '#667eea', fontWeight: '700' },
});

export default ChildEditScreen;
