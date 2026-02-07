import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { healthRecordsService } from '../../services/healthRecordsService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';
import { storage } from '../../services/storage';
import { userService } from '../../services/userService';

const { width, height } = Dimensions.get('window');

const ReportTypeUI = {
  Prescription: { icon: 'file-document-edit-outline', color: ['#6366F1', '#818CF8'], label: 'Prescription' },
  LabReport: { icon: 'flask-outline', color: ['#10B981', '#34D399'], label: 'Lab Report' },
  VaccinationRecord: { icon: 'shield-check-outline', color: ['#F59E0B', '#FBBF24'], label: 'Vaccination' },
  DischargeSummary: { icon: 'hospital-building', color: ['#EF4444', '#F87171'], label: 'Discharge' },
  ImagingScan: { icon: 'radiology-box', color: ['#8B5CF6', '#A78BFA'], label: 'Scan/X-Ray' },
  Other: { icon: 'file-outline', color: ['#64748B', '#94A3B8'], label: 'Other Document' },
};

const AddHealthRecordScreen = ({ navigation }) => {
  // Local Child State (to ensure independence if needed, or sync with global)
  // Reverting to local management to match VaccinePlanner pattern for consistency if context fails
  const [children, setChildren] = useState([]);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const currentChild = useMemo(() => children[currentChildIndex], [children, currentChildIndex]);
  const [childrenError, setChildrenError] = useState('');

  // Child Selector UI
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showChildOverlay, setShowChildOverlay] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Reports
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Upload
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    report_type: 'Prescription',
    title: '',
    description: '',
    file: null,
  });

  // Viewer
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Source Picker Modal
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  // --- Child Loading Logic (Matching Vaccine Planner style) ---
  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    setChildrenError('');
    try {
      const data = await userService.getParentHome();
      const mapped = await Promise.all(
        (data?.children || []).map(async (c, idx) => {
          const id = String(c.child_id || idx + 1);
          let avatar;
          try {
            const src = await userService.getChildPhotoSource(id, c.photo_url || c.avatar_url || null);
            avatar = src?.uri;
          } catch (_) { avatar = undefined; }
          return {
            id,
            name: c.name || c.full_name || 'Child',
            avatar,
            dobRaw: c.date_of_birth,
          };
        })
      );
      setChildren(mapped);

      if (mapped.length > 0) {
        const storedId = await storage.getSelectedChildId();
        const idx = mapped.findIndex(c => String(c.id) === String(storedId));
        setCurrentChildIndex(idx >= 0 ? idx : 0);
      }
    } catch (err) {
      setChildrenError('Unable to load profile.');
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  // --- Reports Loading ---
  const fetchReports = useCallback(async (childId, isRefreshing = false) => {
    if (!childId) return;
    if (isRefreshing) setRefreshing(true);
    else setLoadingReports(true);

    try {
      const data = await healthRecordsService.getReports(childId);
      const reportList = Array.isArray(data) ? data : (data?.reports || []);
      // Sort by date desc
      reportList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setReports(reportList);
    } catch (err) {
      if (!isRefreshing) console.log('Vault access error'); // Silent fail for UX
    } finally {
      setLoadingReports(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentChild?.id) {
      fetchReports(currentChild.id);
    }
  }, [currentChild?.id, fetchReports]);


  // --- Actions ---
  const handlePickDocument = () => {
    // Show the source picker modal
    setShowSourcePicker(true);
  };

  const pickFromCamera = async () => {
    setShowSourcePicker(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Access', 'Please grant camera access to take photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setFormData(prev => ({ ...prev, file: { uri: asset.uri, name: asset.fileName || `photo_${Date.now()}.jpg`, mimeType: asset.mimeType || 'image/jpeg' } }));
      }
    } catch (e) { }
  };

  const pickFromGallery = async () => {
    setShowSourcePicker(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Gallery Access', 'Please grant gallery access to select photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setFormData(prev => ({ ...prev, file: { uri: asset.uri, name: asset.fileName || `image_${Date.now()}.jpg`, mimeType: asset.mimeType || 'image/jpeg' } }));
      }
    } catch (e) { }
  };

  const pickFromFiles = async () => {
    setShowSourcePicker(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData((prev) => ({ ...prev, file: result.assets[0] }));
      }
    } catch (err) { }
  };

  const handleUpload = async () => {
    if (!formData.title.trim() || !formData.file) {
      Alert.alert('Vault Entry Incomplete', 'Please provide a title and select a document.');
      return;
    }

    setUploading(true);
    try {
      await healthRecordsService.uploadReport(currentChild.id, formData);
      setUploadModalVisible(false);
      setFormData({ report_type: 'Prescription', title: '', description: '', file: null });
      fetchReports(currentChild.id);
      Alert.alert('Secured', 'Document safely added to the vault.');
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not secure document. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (reportId) => {
    Alert.alert('Remove from Vault?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await healthRecordsService.deleteReport(currentChild.id, reportId);
            setReports(prev => prev.filter(r => r.report_id !== reportId));
            setViewModalVisible(false);
          } catch (e) { Alert.alert('Error', 'Could not delete.'); }
        }
      }
    ]);
  };

  const fetchReportDetail = async (reportId) => {
    setLoadingDetail(true);
    try {
      const content = await healthRecordsService.getReportContent(currentChild.id, reportId);
      if (content) {
        if (typeof content === 'string') setSelectedReport(prev => ({ ...prev, report_image: content }));
        else setSelectedReport(prev => ({ ...prev, ...content }));
      }
    } catch (e) { Alert.alert('Access Denied', 'Document content unavailable.'); }
    finally { setLoadingDetail(false); }
  };

  useEffect(() => {
    if (viewModalVisible && selectedReport?.report_id) fetchReportDetail(selectedReport.report_id);
  }, [viewModalVisible]);


  // --- UI Helpers ---
  const openChildModal = () => {
    setShowChildSelector(true);
    setShowChildOverlay(false);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(({ finished }) => { if (finished) setShowChildOverlay(true); });
  };

  const closeChildModal = () => {
    setShowChildOverlay(false);
    Animated.timing(sheetAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(({ finished }) => { if (finished) setShowChildSelector(false); });
  };

  const renderReportItem = ({ item }) => {
    const ui = ReportTypeUI[item.report_type] || ReportTypeUI.Other;
    return (
      <TouchableOpacity
        style={styles.recordCard}
        onPress={() => { setSelectedReport(item); setViewModalVisible(true); }}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <LinearGradient colors={ui.color} style={styles.iconGradient}>
            <MaterialCommunityIcons name={ui.icon} size={24} color="#FFF" />
          </LinearGradient>
        </View>
        <View style={styles.recordMeta}>
          <Text style={styles.recordTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.recordDate}>{new Date(item.created_at).toLocaleDateString()} • {ui.label}</Text>
        </View>
        <IconBtn name="chevron-forward" size={20} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  const IconBtn = ({ name, size, color }) => (<Ionicons name={name} size={size} color={color} />);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Medical Vault" onBackPress={() => navigation.goBack()} />

      {/* Child Filter Pill - Reused Design */}
      <View style={styles.topFilterBar}>
        <TouchableOpacity style={styles.childPill} onPress={openChildModal}>
          {currentChild?.avatar ? (
            <Image source={{ uri: currentChild.avatar }} style={styles.miniAvatar} />
          ) : (
            <View style={styles.miniAvatarPlaceholder}><Text style={styles.miniAvatarText}>{(currentChild?.name || '?').charAt(0)}</Text></View>
          )}
          <Text style={styles.childPillName}>{currentChild?.name || 'Loading...'}</Text>
          <Ionicons name="caret-down" size={12} color="#64748B" />
        </TouchableOpacity>
        <View style={styles.safeBadge}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#10B981" />
          <Text style={styles.safeText}>Encrypted</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(currentChild?.id, true)} />}
      >
        {loadingReports && !refreshing ? (
          <LoadingState message="Unlocking Vault..." />
        ) : reports.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.lockCircle}>
              <MaterialCommunityIcons name="lock-outline" size={60} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Vault is Empty</Text>
            <Text style={styles.emptySub}>Securely store prescriptions, reports, and scans here.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setUploadModalVisible(true)}>
              <Text style={styles.emptyBtnText}>Add First Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {reports.map((r, i) => (
              <View key={i}>{renderReportItem({ item: r })}</View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setUploadModalVisible(true)} activeOpacity={0.8}>
        <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.fabGradient}>
          <Ionicons name="add" size={30} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setUploadModalVisible(false)} />
          <View style={styles.uploadSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add to Vault</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}><Ionicons name="close-circle" size={28} color="#94A3B8" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.7 }}>
              <Text style={styles.label}>Document Type</Text>
              <View style={styles.typeGrid}>
                {Object.keys(ReportTypeUI).map(key => {
                  const isActive = formData.report_type === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.typeCard, isActive && styles.typeCardActive]}
                      onPress={() => setFormData(prev => ({ ...prev, report_type: key }))}
                    >
                      <MaterialCommunityIcons
                        name={ReportTypeUI[key].icon}
                        size={24}
                        color={isActive ? ReportTypeUI[key].color[0] : '#94A3B8'}
                      />
                      <Text style={[styles.typeLabel, isActive && { color: '#1E293B', fontWeight: '700' }]}>{ReportTypeUI[key].label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Blood Test Report"
                value={formData.title}
                onChangeText={t => setFormData(prev => ({ ...prev, title: t }))}
              />

              <Text style={styles.label}>File</Text>
              <TouchableOpacity style={styles.filePicker} onPress={handlePickDocument}>
                {formData.file ? (
                  <View style={styles.filePreview}>
                    <MaterialCommunityIcons name="file-document" size={30} color="#4F46E5" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{formData.file.name}</Text>
                      <Text style={styles.fileSize}>Ready to upload</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                ) : (
                  <View style={styles.filePlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#94A3B8" />
                    <Text style={styles.filePlaceText}>Tap to select document/image</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.uploadBtnText}>Secure Upload</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>

          {/* Source Picker Overlay (Nested to work on Android) */}
          {showSourcePicker && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 10, justifyContent: 'flex-end' }]}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowSourcePicker(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} />
              </TouchableOpacity>
              <View style={[styles.sourcePickerSheet, { elevation: 10 }]}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Choose Source</Text>
                  <TouchableOpacity onPress={() => setShowSourcePicker(false)}><Ionicons name="close-circle" size={28} color="#94A3B8" /></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20 }}>
                  <TouchableOpacity style={styles.sourceOption} onPress={pickFromCamera}>
                    <View style={[styles.sourceIconWrap, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="camera" size={28} color="#2563EB" />
                    </View>
                    <Text style={styles.sourceLabel}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sourceOption} onPress={pickFromGallery}>
                    <View style={[styles.sourceIconWrap, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="images" size={28} color="#DC2626" />
                    </View>
                    <Text style={styles.sourceLabel}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sourceOption} onPress={pickFromFiles}>
                    <View style={[styles.sourceIconWrap, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="document-attach" size={28} color="#059669" />
                    </View>
                    <Text style={styles.sourceLabel}>Files</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* View Modal */}
      <Modal visible={viewModalVisible} animationType="fade" transparent>
        <View style={styles.viewerOverlay}>
          <SafeAreaView style={styles.viewerContainer}>
            <View style={styles.viewerHeader}>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}><Ionicons name="close" size={28} color="#FFF" /></TouchableOpacity>
              <Text style={styles.viewerTitle} numberOfLines={1}>{selectedReport?.title}</Text>
              <TouchableOpacity onPress={() => handleDelete(selectedReport?.report_id)}><Ionicons name="trash" size={24} color="#EF4444" /></TouchableOpacity>
            </View>

            <View style={styles.viewerBody}>
              {loadingDetail ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : selectedReport?.report_image ? (
                <Image
                  source={{ uri: selectedReport.report_image }}
                  style={{ width: width, height: height * 0.7 }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons name="file-check" size={80} color="#FFF" />
                  <Text style={{ color: '#FFF', marginTop: 20 }}>Document Ready</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Child Modal - Reusing */}
      <Modal
        visible={showChildSelector} transparent animationType="none" onRequestClose={closeChildModal}
      >
        <View style={styles.modalOverlay}>
          {showChildOverlay && <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeChildModal} />}
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.childSelectorModal, { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.levelTitleModal}>Select Vault Owner</Text>
                <TouchableOpacity onPress={closeChildModal}><Ionicons name="close" size={24} color="#1E293B" /></TouchableOpacity>
              </View>
              <ScrollView>
                {children.map((child, idx) => (
                  <TouchableOpacity key={child.id} style={styles.childRow} onPress={async () => { setCurrentChildIndex(idx); await storage.saveSelectedChildId(child.id); closeChildModal(); }}>
                    {child.avatar ? <Image source={{ uri: child.avatar }} style={styles.miniAvatar} /> : <View style={styles.miniAvatarPlaceholder}><Text>{child.name.charAt(0)}</Text></View>}
                    <Text style={styles.childRowName}>{child.name}</Text>
                    {idx === currentChildIndex && <Ionicons name="key" size={20} color="#6366F1" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Top Bar
  topFilterBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  childPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  miniAvatarPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  miniAvatarText: { fontSize: 10, fontWeight: 'bold' },
  childPillName: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginRight: 6 },

  safeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  safeText: { marginLeft: 4, fontSize: 10, color: '#10B981', fontWeight: '700' },

  // List
  listContainer: { padding: 16 },
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  iconContainer: { marginRight: 16 },
  iconGradient: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordMeta: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  recordDate: { fontSize: 12, color: '#64748B' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 20 },
  lockCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, maxWidth: 250 },
  emptyBtn: { marginTop: 24, backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: 'bold' },

  // FAB
  fab: { position: 'absolute', bottom: 30, right: 20 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },

  // Upload Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  uploadSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 10, marginTop: 10 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '30%', height: 90, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  typeCardActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  typeLabel: { marginTop: 8, fontSize: 11, color: '#64748B', textAlign: 'center' },

  input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, fontSize: 16, color: '#1E293B' },

  filePicker: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: 20, alignItems: 'center', backgroundColor: '#F8FAFC' },
  filePreview: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  fileName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  fileSize: { fontSize: 12, color: '#10B981' },
  filePlaceholder: { alignItems: 'center' },
  filePlaceText: { marginTop: 8, color: '#64748B', fontSize: 14 },

  uploadBtn: { marginTop: 30, backgroundColor: '#4F46E5', padding: 18, borderRadius: 16, alignItems: 'center' },
  uploadBtnDisabled: { opacity: 0.7 },
  uploadBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // Viewer
  viewerOverlay: { flex: 1, backgroundColor: '#000' },
  viewerContainer: { flex: 1 },
  viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  viewerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', flex: 1, marginHorizontal: 16 },
  viewerBody: { flex: 1, justifyContent: 'center' },

  // Child Modal
  childSelectorModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  levelTitleModal: { fontSize: 18, fontWeight: '700' },
  childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  childRowName: { marginLeft: 10, fontSize: 16, flex: 1 },

  // Source Picker
  sourcePickerSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sourceOption: { alignItems: 'center', width: 80 },
  sourceIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sourceLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' }
});

export default AddHealthRecordScreen;
