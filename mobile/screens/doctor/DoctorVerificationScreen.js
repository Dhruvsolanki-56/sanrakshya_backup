import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { doctorService } from '../../services/doctor/doctorService';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DoctorVerificationScreen = ({ navigation }) => {
  const [documentType, setDocumentType] = useState('medical_registration');
  const [documentName, setDocumentName] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState('');
  const [doctorActive, setDoctorActive] = useState(true);
  const iconAnim = useRef(new Animated.Value(1)).current;

  // Hide bottom tab bar while on verification screen
  useFocusEffect(
    useCallback(() => {
      const hide = true;
      navigation.setParams({ hideTabBar: hide });
      const tabNav = navigation.getParent?.()?.getParent?.();
      if (tabNav) tabNav.setParams({ hideTabBar: hide });
      return () => {
        navigation.setParams({ hideTabBar: false });
        if (tabNav) tabNav.setParams({ hideTabBar: false });
      };
    }, [navigation])
  );

  // Load verification status and doctor active state via service
  useEffect(() => {
    let mounted = true;
    setStatusLoading(true);
    setStatusError('');
    (async () => {
      try {
        const [status, profile] = await Promise.all([
          doctorService.getVerificationStatus(),
          doctorService.getDoctorHome(),
        ]);
        if (!mounted) return;
        setVerificationStatus(status);
        const ds = status?.doc_status;
        if (ds === 'pending' || ds === 'rejected' || ds === 'approved') {
          setUploadSuccess(true);
        }
        const isActive = profile?.is_active !== undefined ? profile.is_active : true;
        setDoctorActive(isActive);
      } catch (_) {
        if (mounted) {
          setStatusError('Unable to load verification status. Please try again.');
        }
      } finally {
        if (mounted) setStatusLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handlePickDocument = async () => {
    setUploadError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        if (picked.size && picked.size > 10 * 1024 * 1024) {
          setUploadError('File must be under 10 MB.');
          return;
        }
        setDocumentFile(picked);
      }
    } catch (e) {
      setUploadError('Could not open document picker.');
    }
  };

  const handleSubmit = async () => {
    setUploadError('');
    const name = documentName.trim();
    const errs = [];
    if (!name) errs.push('Document name is required.');
    else if (!/^[A-Za-z0-9\s().,&\/-]{2,100}$/.test(name)) errs.push('Enter a valid document name (2–100 chars).');
    if (!documentFile) errs.push('Please choose a file.');
    else if (documentFile.size && documentFile.size > 10 * 1024 * 1024) errs.push('File must be under 10 MB.');
    if (errs.length) { setUploadError(errs.join('\n')); return; }

    setUploading(true);
    try {
      await doctorService.uploadVerificationDocument({ document_type: (documentType || '').toLowerCase(), document_name: name, file: documentFile });
      setDocumentName('');
      setDocumentFile(null);
      // refresh status so we show pending/rejected + note from API
      try {
        const status = await doctorService.getVerificationStatus();
        setVerificationStatus(status);
        const ds = status?.doc_status;
        if (ds === 'pending' || ds === 'rejected') {
          setUploadSuccess(true);
        } else {
          setUploadSuccess(true);
        }
      } catch (_) {
        setUploadSuccess(true);
      }
    } catch (err) {
      const details = err?.data?.detail;
      if (Array.isArray(details)) {
        setUploadError('Please fix the highlighted fields.');
      } else {
        setUploadError(err?.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = () => {
    setUploadSuccess(false);
    setUploadError('');
    setDocumentName('');
    setDocumentFile(null);
  };

  // Gentle pulse animation for status icons when visible
  useEffect(() => {
    if (!uploadSuccess) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iconAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(iconAnim, { toValue: 0.94, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [uploadSuccess, iconAnim]);

  // Derived UI state
  const ds = verificationStatus?.doc_status;
  const rejectionNote = typeof verificationStatus?.review_note === 'string' ? verificationStatus.review_note.trim() : '';
  const approvedInactive = ds === 'approved' && doctorActive === false;
  const hideBackBtn = approvedInactive || uploadSuccess;

  let iconName = 'checkmark-circle';
  let gradColors = ['#22c55e', '#16a34a'];
  let successTitleText = 'Thanks! Documents submitted.';
  let successSubtitleText = 'Your documents are under review. Verification typically takes 24–48 hours. We will notify you once it’s completed.';

  if (ds === 'pending') {
    iconName = 'time-outline';
    gradColors = ['#f59e0b', '#f97316'];
    successTitleText = 'Thanks! Documents submitted.';
    successSubtitleText = 'Your documents are under review. Verification typically takes 24–48 hours. We will notify you once it’s completed.';
  } else if (ds === 'rejected') {
    iconName = 'close-circle';
    gradColors = ['#ef4444', '#f97316'];
    successTitleText = 'Documents rejected';
    successSubtitleText = rejectionNote.length > 0
      ? rejectionNote
      : 'Your documents were rejected. Please review the requirements and resubmit the correct documents.';
  } else if (approvedInactive) {
    iconName = 'lock-closed';
    gradColors = ['#64748b', '#475569'];
    successTitleText = 'Documents approved';
    successSubtitleText = 'Your documents are approved, but your account is currently inactive. Please contact support for assistance.';
  } else if (ds === 'approved') {
    iconName = 'checkmark-circle';
    gradColors = ['#22c55e', '#16a34a'];
    successTitleText = 'Documents approved';
    successSubtitleText = 'Your documents have been approved. You’re all set.';
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {hideBackBtn ? (
          <View style={{ width: 44 }} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#667eea" />
          </TouchableOpacity>
        )}
        {/* No title in the center as per design */}
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: uploadSuccess ? 40 : 24,
          paddingBottom: 24,
          flexGrow: 1,
          justifyContent: (uploadSuccess || statusLoading) ? 'center' : 'flex-start',
        }}
        showsVerticalScrollIndicator={false}
      >
        {!!statusError && (
          <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{statusError}</Text></View>
        )}

        {statusLoading && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={{ marginTop: 10, color: '#7f8c8d' }}>Loading verification...</Text>
          </View>
        )}
        {/* Hero / Intro */}
        {!uploadSuccess && !statusLoading && (
        <View style={styles.heroContainer}>
          <View style={styles.heroIconWrap}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.heroIconInner}>
              <Ionicons name="shield-outline" size={34} color="#fff" />
            </LinearGradient>
            <View style={styles.heroGlow1} />
            <View style={styles.heroGlow2} />
          </View>
          <Text style={styles.heroTitle}>Account Verification</Text>
          <Text style={styles.heroSubtitle}>Upload your required documents to get verified. This usually takes 24–48 hours after submission.</Text>
        </View>
        )}

        {uploadSuccess ? (
          <View style={styles.successContainer}>
            <Animated.View style={[styles.successIconWrap, { transform: [{ scale: iconAnim }] }]}>
              <LinearGradient colors={gradColors} style={styles.successIconInner}>
                <Ionicons name={iconName} size={36} color="#fff" />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.successTitle}>{successTitleText}</Text>
            <Text style={styles.successSubtitle}>{successSubtitleText}</Text>
            {ds === 'rejected' && rejectionNote.length > 0 && (
              <View style={styles.reviewNoteBox}>
                <Text style={styles.reviewNoteTitle}>Review note</Text>
                <Text style={styles.reviewNoteText}>{rejectionNote}</Text>
              </View>
            )}
            {ds === 'rejected' && (
              <TouchableOpacity style={[styles.primaryBtn, styles.resubmitBtn]} onPress={handleResubmit}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.primaryBtnGrad}>
                  <Text style={styles.primaryBtnText}>Resubmit Documents</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {verificationStatus?.doc_status === 'rejected' && (
              <View style={styles.noticeBanner}>
                <Text style={styles.noticeBannerTitle}>Documents rejected</Text>
                <Text style={styles.noticeBannerText}>
                  {rejectionNote.length > 0 ? rejectionNote : 'Your documents were rejected. Please review the requirements and resubmit the correct documents.'}
                </Text>
              </View>
            )}

            {!!uploadError && (
              <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{uploadError}</Text></View>
            )}

            <Text style={styles.label}>Document Type</Text>
            <View style={styles.typeGrid}>
              {[
                { value: 'medical_registration', label: 'Medical Registration', icon: 'medkit-outline' },
                { value: 'degree_certificate', label: 'Degree Certificate', icon: 'ribbon-outline' },
                { value: 'government_id', label: 'Government ID', icon: 'person-outline' },
                { value: 'other', label: 'Other', icon: 'document-text-outline' },
              ].map((t) => (
                <TouchableOpacity key={t.value} style={[styles.gridItem, documentType === t.value && styles.activeGridItem]} onPress={() => setDocumentType(t.value)}>
                  <LinearGradient colors={documentType === t.value ? ['#667eea', '#764ba2'] : ['#f8f9ff', '#f8f9ff']} style={styles.gridIconBox}>
                    <Ionicons name={t.icon} size={22} color={documentType === t.value ? '#fff' : '#bdc3c7'} />
                  </LinearGradient>
                  <Text style={[styles.gridLabel, documentType === t.value && styles.activeGridLabel]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Document Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., MCI Registration Certificate"
                value={documentName}
                onChangeText={setDocumentName}
                placeholderTextColor="#bdc3c7"
              />
            </View>

            <Text style={styles.label}>File Attachment</Text>
            <TouchableOpacity style={[styles.filePicker, documentFile && styles.filePickedBorder]} onPress={handlePickDocument}>
              <View style={styles.pickerInner}>
                <Ionicons name={documentFile ? 'checkmark-circle' : 'cloud-upload-outline'} size={44} color={documentFile ? '#2ecc71' : '#667eea'} />
                <View style={styles.pickerTextContent}>
                  <Text style={styles.filePickerMainText}>
                    {documentFile ? documentFile.name : 'Choose Document'}
                  </Text>
                  <Text style={styles.filePickerSubText}>
                    {documentFile ? `Ready • ${documentFile.size ? (documentFile.size / 1024 / 1024).toFixed(2) : '?'} MB` : 'Supports JPG, PNG and PDF'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryBtn, uploading && styles.disabledBtn]} onPress={handleSubmit} disabled={uploading}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.primaryBtnGrad}>
                {uploading ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                    <Text style={styles.primaryBtnText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>Submit Document</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* No extra spacer; designed to fit without scrolling */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8f9ff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },

  heroContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  heroIconWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heroIconInner: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  heroGlow1: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: '#eef2ff', opacity: 0.6 },
  heroGlow2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#f8faff', opacity: 0.4 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', textAlign: 'center' },
  heroSubtitle: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginTop: 4, marginBottom: 12, paddingHorizontal: 8 },

  errorBanner: { backgroundColor: '#FDECEA', borderColor: '#F5C6CB', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 20, marginBottom: 12 },
  errorBannerText: { color: '#A94442', fontSize: 13 },
  noticeBanner: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 20, marginBottom: 12 },
  noticeBannerTitle: { color: '#9A3412', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  noticeBannerText: { color: '#9A3412', fontSize: 13 },

  label: { fontSize: 14, fontWeight: '700', color: '#2c3e50', marginBottom: 10, paddingHorizontal: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  gridItem: { width: (width - 60) / 2, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#f1f3f4' },
  activeGridItem: { borderColor: '#667eea' },
  gridIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 14, color: '#2c3e50', fontWeight: '600' },
  activeGridLabel: { color: '#667eea' },

  formSection: { marginTop: 6, marginBottom: 6, paddingHorizontal: 20 },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E1E1E6', paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  filePicker: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f1f3f4', padding: 12, marginTop: 6, marginHorizontal: 20 },
  filePickedBorder: { borderColor: '#2ecc71' },
  pickerInner: { flexDirection: 'row', alignItems: 'center' },
  pickerTextContent: { marginLeft: 12 },
  filePickerMainText: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  filePickerSubText: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },

  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 14, marginHorizontal: 20 },
  disabledBtn: { opacity: 0.6 },
  primaryBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnLoadingRow: { flexDirection: 'row', alignItems: 'center' },

  successContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 0 },
  successIconWrap: { width: 100, height: 100, marginBottom: 16 },
  successIconInner: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 18, paddingHorizontal: 10, lineHeight: 20 },
  reviewNoteBox: { width: '100%', backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14 },
  reviewNoteTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  reviewNoteText: { fontSize: 13, color: '#92400E' },
  resubmitBtn: { marginTop: 4, marginBottom: 4, alignSelf: 'stretch' },
});

export default DoctorVerificationScreen;
