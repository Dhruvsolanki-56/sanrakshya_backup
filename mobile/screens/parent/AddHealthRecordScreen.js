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
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import * as DocumentPicker from 'expo-document-picker';
import { healthRecordsService } from '../../services/healthRecordsService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width, height } = Dimensions.get('window');

const ReportTypeUI = {
  Prescription: { icon: 'medical', color: ['#667eea', '#764ba2'], label: 'Prescription' },
  LabReport: { icon: 'flask', color: ['#00b09b', '#96c93d'], label: 'Lab Report' },
  VaccinationRecord: { icon: 'shield-checkmark', color: ['#FF5F6D', '#FFC371'], label: 'Vaccination' },
  DischargeSummary: { icon: 'exit', color: ['#11998e', '#38ef7d'], label: 'Discharge' },
  ImagingScan: { icon: 'scan', color: ['#fc4a1a', '#f7b733'], label: 'Scan' },
  Other: { icon: 'document-text', color: ['#485563', '#29323c'], label: 'Other' },
};

const AddHealthRecordScreen = ({ navigation }) => {
  // Child state (global)
  const {
    children,
    selectedChild,
    selectedChildId,
    loadingChildren,
    switchingChild,
    error: childrenError,
    selectChild,
  } = useSelectedChild();

  const currentChild = selectedChild;
  const currentChildIndex = useMemo(
    () => children.findIndex(c => String(c.id) === String(selectedChildId)),
    [children, selectedChildId]
  );
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showChildOverlay, setShowChildOverlay] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Reports state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Upload state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    report_type: 'Prescription',
    title: '',
    description: '',
    file: null,
  });

  // View state
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const fetchReportDetail = async (reportId) => {
    if (!selectedChildId) return;
    setLoadingDetail(true);
    try {
      // Use getReportContent to handle binary blobs / Data URIs directly
      const content = await healthRecordsService.getReportContent(selectedChildId, reportId);
      if (content) {
        if (typeof content === 'string') {
          setSelectedReport(prev => ({ ...prev, report_image: content }));
        } else {
          setSelectedReport(prev => ({ ...prev, ...content }));
        }
      }
    } catch (err) {
      console.error('Error fetching report detail:', err);
      Alert.alert('Error', 'Unable to retrieve document content.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (viewModalVisible && selectedReport?.report_id) {
      fetchReportDetail(selectedReport.report_id);
    }
  }, [viewModalVisible]);

  const fetchReports = useCallback(async (childId, isRefreshing = false) => {
    if (!childId) return;
    if (isRefreshing) setRefreshing(true);
    else setLoadingReports(true);

    try {
      const data = await healthRecordsService.getReports(childId);
      const reportList = Array.isArray(data) ? data : (data?.reports || []);
      setReports([...reportList]);
    } catch (err) {
      console.error('Error fetching reports:', err);
      if (!isRefreshing) Alert.alert('Error', 'Unable to access medical vault.');
    } finally {
      setLoadingReports(false);
      setRefreshing(false);
    }
  }, []);

  // Load reports whenever selected child changes
  useEffect(() => {
    if (!selectedChildId) {
      setReports([]);
      return;
    }
    fetchReports(selectedChildId);
  }, [selectedChildId, fetchReports]);

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

  const getAgeTextForChild = (child) => {
    if (!child) return '';
    const yearsFromApi = typeof child.ageYears === 'number' ? child.ageYears : null;
    const monthsFromApi = typeof child.ageMonths === 'number' ? child.ageMonths : null;
    if (yearsFromApi != null || monthsFromApi != null) {
      const years = yearsFromApi != null ? yearsFromApi : 0;
      const months = monthsFromApi != null ? monthsFromApi : 0;
      return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return formatAgeText(child.dobRaw);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData((prev) => ({ ...prev, file: result.assets[0] }));
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleUpload = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Required', 'Please enter a title for this record.');
      return;
    }
    if (!formData.file) {
      Alert.alert('Required', 'Please select a document or image to upload.');
      return;
    }

    if (!selectedChildId) {
      Alert.alert('Missing child', 'Please select a child first.');
      return;
    }

    setUploading(true);
    try {
      await healthRecordsService.uploadReport(selectedChildId, formData);
      Alert.alert('Success', 'Health record uploaded successfully.');
      setUploadModalVisible(false);
      setFormData({
        report_type: 'Prescription',
        title: '',
        description: '',
        file: null,
      });
      fetchReports(selectedChildId);
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err.message || 'Something went wrong while uploading.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (reportId) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this health record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!selectedChildId) {
                Alert.alert('Missing child', 'Please select a child first.');
                return;
              }
              await healthRecordsService.deleteReport(selectedChildId, reportId);
              setReports((prev) => prev.filter((r) => r.report_id !== reportId));
              if (selectedReport?.report_id === reportId) setViewModalVisible(false);
              Alert.alert('Success', 'Record deleted.');
            } catch (err) {
              Alert.alert('Error', 'Unable to delete record.');
            }
          },
        },
      ]
    );
  };

  const openChildModal = () => {
    if (loadingChildren || !children.length) return;
    setShowChildSelector(true);
    setShowChildOverlay(false);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowChildOverlay(true);
      }
    });
  };

  const closeChildModal = () => {
    setShowChildOverlay(false);
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowChildSelector(false);
      }
    });
  };

  const renderReportItem = ({ item }) => {
    const ui = ReportTypeUI[item.report_type] || ReportTypeUI.Other;
    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => {
          setSelectedReport(item);
          setViewModalVisible(true);
        }}
      >
        <LinearGradient
          colors={ui.color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name={ui.icon} size={18} color="#fff" />
        </LinearGradient>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.reportMeta}>{ui.label} • {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScreenHeader
        title="Health Records"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => selectedChildId && fetchReports(selectedChildId, true)}
          />
        }
      >
        {/* Child Selector */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>Child</Text>
          {loadingChildren ? (
            <LoadingState
              message="Loading child details..."
              size="small"
              style={styles.childLoadingBox}
            />
          ) : (
            <TouchableOpacity
              style={styles.childSelectorCard}
              onPress={openChildModal}
              disabled={!children.length || switchingChild}
            >
              <View style={styles.childInfoRow}>
                {currentChild?.avatar ? (
                  <Image source={{ uri: currentChild.avatar }} style={styles.childAvatarImg} />
                ) : (
                  <View style={styles.childAvatarCircle}>
                    <Text style={styles.childAvatarInitial}>
                      {(currentChild?.name || '?').charAt(0)}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.childPrimaryName}>{currentChild?.name || 'Child'}</Text>
                  <Text style={styles.childAgeText}>{getAgeTextForChild(currentChild)}</Text>
                </View>
              </View>
              {switchingChild ? (
                <ActivityIndicator size="small" color="#7f8c8d" />
              ) : (
                <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
              )}
            </TouchableOpacity>
          )}
          {childrenError ? (
            <ErrorState
              message={childrenError}
              fullWidth
            />
          ) : null}
        </View>

        {/* Reports Listing */}
        <View style={styles.sectionWrapper}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Medical Documents</Text>
            {reports.length > 0 && (
              <Text style={styles.countBadge}>{reports.length}</Text>
            )}
          </View>

          {loadingReports && !refreshing ? (
            <View style={styles.loadingReportsBox}>
              <LoadingState
                message="Accessing Your Vault..."
                size="large"
              />
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.themeBannerContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8f9ff']}
                style={styles.themeBannerGrad}
              >
                <View style={styles.bannerIconOuter}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.bannerIconInner}
                  >
                    <Ionicons name="shield-checkmark" size={40} color="#fff" />
                  </LinearGradient>
                  <View style={styles.bannerCircle1} />
                  <View style={styles.bannerCircle2} />
                </View>

                <Text style={styles.themeBannerTitle}>Medical Vault</Text>
                <Text style={styles.themeBannerSubtitle}>
                  Your secure space for prescriptions, lab reports, and vaccination records. Keep your family's health history safe.
                </Text>

                <TouchableOpacity
                  style={styles.themeBannerBtn}
                  onPress={() => setUploadModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.themeBannerBtnGrad}
                  >
                    <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.themeBannerBtnText}>Add First Record</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {reports.map((item) => (
                <View key={String(item.report_id)}>
                  {renderReportItem({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setUploadModalVisible(true)}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={styles.modalCloseSmall}>
              <Ionicons name="close" size={28} color="#2c3e50" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Upload Record</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Select Report Type</Text>
            <View style={styles.typeGrid}>
              {Object.keys(ReportTypeUI).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.gridItem,
                    formData.report_type === type && styles.activeGridItem
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, report_type: type }))}
                >
                  <LinearGradient
                    colors={formData.report_type === type ? ReportTypeUI[type].color : ['#f8f9ff', '#f8f9ff']}
                    style={styles.gridIconBox}
                  >
                    <Ionicons
                      name={ReportTypeUI[type].icon}
                      size={24}
                      color={formData.report_type === type ? '#fff' : '#bdc3c7'}
                    />
                  </LinearGradient>
                  <Text style={[
                    styles.gridLabel,
                    formData.report_type === type && styles.activeGridLabel
                  ]}>{ReportTypeUI[type].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Record Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Eye Specialist Visit"
                value={formData.title}
                onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
                placeholderTextColor="#bdc3c7"
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief summary of the record..."
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
                placeholderTextColor="#bdc3c7"
              />
            </View>

            <Text style={styles.label}>File Attachment</Text>
            <TouchableOpacity
              style={[styles.perfectFilePicker, formData.file && styles.filePickedBorder]}
              onPress={handlePickDocument}
            >
              <View style={styles.pickerInner}>
                <Ionicons
                  name={formData.file ? 'checkmark-circle' : 'cloud-upload'}
                  size={44}
                  color={formData.file ? '#2ecc71' : '#667eea'}
                />
                <View style={styles.pickerTextContent}>
                  <Text style={styles.filePickerMainText}>
                    {formData.file ? formData.file.name : 'Choose Document'}
                  </Text>
                  <Text style={styles.filePickerSubText}>
                    {formData.file ? `Ready to upload (${(formData.file.size / 1024 / 1024).toFixed(2)}MB)` : 'Supports JPG, PNG and PDF'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.perfectUploadButton, uploading && styles.disabledBtn]}
              onPress={handleUpload}
              disabled={uploading}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.perfectUploadGradient}
              >
                {uploading ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                    <Text style={styles.perfectUploadText}>Storing Document...</Text>
                  </View>
                ) : (
                  <Text style={styles.perfectUploadText}>Save to Medical Vault</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* View Modal */}
      <Modal
        visible={viewModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.blurOverlay}>
          <SafeAreaView style={styles.viewContent}>
            <View style={styles.viewHeader}>
              <TouchableOpacity onPress={() => setViewModalVisible(false)} style={styles.viewClose}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.viewHeaderText}>
                <Text style={styles.viewTitle}>{selectedReport?.title}</Text>
                <Text style={styles.viewMetaText}>
                  {selectedReport?.report_type} • {selectedReport?.created_at ? new Date(selectedReport.created_at).toLocaleDateString() : '...'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(selectedReport?.report_id)} style={styles.viewDelete}>
                <Ionicons name="trash-outline" size={24} color="#ff7675" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageBox}>
              {loadingDetail ? (
                <View style={styles.viewerLoading}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.viewerLoadingText}>Decoding Secure Asset...</Text>
                </View>
              ) : selectedReport?.report_image ? (
                <ScrollView
                  style={{ flex: 1 }}
                  maximumZoomScale={4}
                  minimumZoomScale={1}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                  centerContent
                >
                  {loadingImage && (
                    <View style={StyleSheet.absoluteFill}>
                      <ActivityIndicator size="large" color="#667eea" style={{ flex: 1 }} />
                    </View>
                  )}
                  <Image
                    source={{
                      uri: selectedReport.report_image
                    }}
                    style={{
                      width: width,
                      height: height * 0.7,
                    }}
                    resizeMode="contain"
                    onLoadStart={() => setLoadingImage(true)}
                    onLoadEnd={() => setLoadingImage(false)}
                  />
                </ScrollView>
              ) : (
                <View style={styles.pdfPlaceholder}>
                  <Ionicons name="document-text" size={120} color="#fff" />
                  <Text style={styles.pdfText}>PDF Document</Text>
                  <Text style={styles.pdfSub}>Secured by Sanrakshya</Text>
                </View>
              )}
            </View>

            <View style={styles.viewFooter}>
              <Text style={styles.descLabel}>Notes</Text>
              <Text style={styles.descText}>{selectedReport?.description || 'No additional notes provided.'}</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Child Selector Modal */}
      <Modal
        visible={showChildSelector}
        transparent
        animationType="none"
        onRequestClose={closeChildModal}
      >
        <View style={styles.modalOverlay}>
          {showChildOverlay && (
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeChildModal}
            />
          )}
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.childSelectorModal,
                {
                  transform: [
                    {
                      translateY: sheetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Switch Child</Text>
                <TouchableOpacity onPress={closeChildModal}>
                  <Ionicons name="close" size={22} color="#2c3e50" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {children.map((child, idx) => (
                  <TouchableOpacity
                    key={child.id}
                    style={styles.childRow}
                    onPress={async () => {
                      await selectChild(child.id);
                      closeChildModal();
                    }}
                  >
                    {child.avatar ? (
                      <Image source={{ uri: child.avatar }} style={styles.childRowAvatar} />
                    ) : (
                      <View style={styles.childRowAvatarPlaceholder}>
                        <Ionicons name="person" size={16} color="#667eea" />
                      </View>
                    )}
                    <View style={styles.childRowInfo}>
                      <Text style={styles.childRowName}>{child.name}</Text>
                      <Text style={styles.childRowAge}>{getAgeTextForChild(child)}</Text>
                    </View>
                    {idx === currentChildIndex && (
                      <Ionicons name="checkmark-circle" size={22} color="#667eea" />
                    )}
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  sectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  countBadge: {
    marginLeft: 10,
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  childSelectorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  childInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childAvatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  childAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  childPrimaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  childAgeText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  childLoadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  childLoadingText: {
    marginTop: 8,
    color: '#7f8c8d',
    fontSize: 13,
  },
  loadingReportsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingReportsText: {
    marginTop: 15,
    color: '#7f8c8d',
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#d93025',
  },
  listContainer: {
    marginTop: 5,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  reportMeta: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 2,
  },
  themeBannerContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginTop: 10,
  },
  themeBannerGrad: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconOuter: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 5,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eef2ff',
    opacity: 0.5,
  },
  bannerCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8faff',
    opacity: 0.3,
  },
  themeBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  themeBannerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  themeBannerBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  themeBannerBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  themeBannerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  modalScroll: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34495e',
    marginBottom: 16,
    marginTop: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: (width - 68) / 3,
    backgroundColor: '#f8f9ff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  activeGridItem: {
    borderColor: '#667eea',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7f8c8d',
    textAlign: 'center',
  },
  activeGridLabel: {
    color: '#667eea',
  },
  formSection: {
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#f1f3f4',
    marginBottom: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  perfectFilePicker: {
    backgroundColor: '#f8f9ff',
    borderColor: '#dcdde1',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    marginTop: 5,
  },
  filePickedBorder: {
    borderColor: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
    borderStyle: 'solid',
  },
  pickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerTextContent: {
    marginLeft: 15,
    flex: 1,
  },
  filePickerMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  filePickerSubText: {
    fontSize: 11,
    color: '#95a5a6',
  },
  perfectUploadButton: {
    marginTop: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  perfectUploadGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfectUploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  viewContent: {
    flex: 1,
  },
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  viewHeaderText: {
    flex: 1,
    marginHorizontal: 16,
  },
  viewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  viewMetaText: {
    color: '#bdc3c7',
    fontSize: 13,
    marginTop: 2,
  },
  viewClose: {
    padding: 4,
  },
  viewDelete: {
    padding: 4,
  },
  viewerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerLoadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  imageBox: {
    flex: 1,
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  pdfPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
  },
  pdfSub: {
    color: '#95a5a6',
    fontSize: 14,
    marginTop: 5,
  },
  viewFooter: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  descLabel: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  descText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  childSelectorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  childRowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  childRowAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childRowInfo: {
    flex: 1,
  },
  childRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  childRowAge: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  modalCloseSmall: {
    padding: 5,
  }
});

export default AddHealthRecordScreen;
