import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { doctorService } from '../../services/doctor/doctorService';

const { width } = Dimensions.get('window');

const DOC_TYPES = [
  { key: 'clinic_license', label: 'Clinic License' },
  { key: 'shop_act', label: 'Shop Act' },
  { key: 'hospital_authorization', label: 'Hospital Authorization' },
  { key: 'rent_agreement', label: 'Rent Agreement' },
  { key: 'utility_bill', label: 'Utility Bill' },
  { key: 'owner_declaration', label: 'Owner Declaration' },
  { key: 'other', label: 'Other' },
];

const ROLE_OPTIONS = [
  { key: 'consulting', label: 'Consulting Doctor' },
  { key: 'assistant', label: 'Assistant Doctor' },
  { key: 'owner', label: 'Owner Doctor' },
];

const TYPE_OPTIONS = [
  { key: 'clinic', label: 'Clinic' },
  { key: 'hospital', label: 'Hospital' },
];

const ROLE_DOCS = {
  owner: ['clinic_license', 'shop_act', 'rent_agreement', 'utility_bill', 'other'],
  consulting: ['hospital_authorization', 'owner_declaration', 'other'],
  assistant: ['hospital_authorization', 'owner_declaration', 'other'],
};

const ROLE_ICONS = {
  consulting: 'medkit-outline',
  assistant: 'person-outline',
  owner: 'home-outline',
};

const toTitleCaseWords = (value) => {
  const s = String(value || '').trim();
  if (!s) return '';
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const word = String(w);
      const clean = word.replace(/[^a-zA-Z0-9]/g, '');
      const isAcronym = clean.length >= 2 && clean.length <= 5 && clean === clean.toUpperCase() && /[A-Z]/.test(clean);
      if (isAcronym) return word;
      const head = word.charAt(0).toUpperCase();
      const tail = word.slice(1).toLowerCase();
      return `${head}${tail}`;
    })
    .join(' ');
};

const toKey = (value) => String(value || '').trim().toLowerCase();

const JoinWorkplaceScreen = ({ navigation, route }) => {

  // Tab bar visibility is controlled via route param hideTabBar to satisfy CustomDoctorTabBar logic.

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [createNew, setCreateNew] = useState(false);

  const [draftPlace, setDraftPlace] = useState({ name: '', type: 'clinic', address_city: '', address_area_locality: '', official_phone: '', address_line1: '', address_state: '', address_pincode: '', address_line2: '', address_country: 'India' });

  const [role, setRole] = useState('consulting');

  const [doc, setDoc] = useState(() => {
    const allowed = ROLE_DOCS.consulting || [];
    return { type: allowed[0] || 'other', name: '', file: null };
  });
  const [docError, setDocError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [navigatingOut, setNavigatingOut] = useState(false);

  const resubmitRoleId = route?.params?.resubmitRoleId ?? null;
  const resubmitPlaceName = route?.params?.resubmitPlaceName ?? '';
  const resubmitRole = route?.params?.resubmitRole ?? '';
  const resubmitAttemptsCount = route?.params?.resubmitAttemptsCount;
  const resubmitAttemptsMax = route?.params?.resubmitAttemptsMax ?? 3;
  const resubmitLatestDocStatus = route?.params?.resubmitLatestDocStatus ?? null;
  const resubmitLatestDocType = route?.params?.resubmitLatestDocType ?? null;
  const resubmitLatestDocName = route?.params?.resubmitLatestDocName ?? null;
  const resubmitReviewNotes = route?.params?.resubmitReviewNotes ?? null;
  const resubmitRoleStatus = route?.params?.resubmitRoleStatus ?? null;
  const isResubmission = !!resubmitRoleId;

  const attemptsExceeded = isResubmission
    ? (Number.isFinite(Number(resubmitAttemptsCount)) && Number.isFinite(Number(resubmitAttemptsMax))
        ? Number(resubmitAttemptsCount) >= Number(resubmitAttemptsMax)
        : false)
    : false;

  const resubmitRoleStatusKey = isResubmission ? toKey(resubmitRoleStatus) : '';
  const resubmitLatestDocStatusKey = isResubmission ? toKey(resubmitLatestDocStatus) : '';
  const resubmitRoleRejected = isResubmission && resubmitRoleStatusKey === 'rejected';
  const canResubmitDoc =
    isResubmission &&
    !resubmitRoleRejected &&
    !attemptsExceeded &&
    (resubmitRoleStatusKey === 'pending' || !resubmitRoleStatusKey) &&
    resubmitLatestDocStatusKey === 'rejected';

  useEffect(() => {
    let timer;
    setSearchError('');
    if (isResubmission) {
      setResults([]);
      setSearching(false);
      setSearchAttempted(false);
      return;
    }
    if (query && query.trim().length >= 3) {
      setSearchAttempted(false);
      setSearching(true);
      timer = setTimeout(async () => {
        try {
          const data = await doctorService.searchPlaces(query.trim());
          setResults(Array.isArray(data) ? data : []);
        } catch (e) {
          setSearchError('Unable to search places');
          setResults([]);
        } finally {
          setSearching(false);
          setSearchAttempted(true);
        }
      }, 400);
    } else {
      setResults([]);
      setSearching(false);
      setSearchAttempted(false);
    }
    return () => timer && clearTimeout(timer);
  }, [query, isResubmission]);

  useEffect(() => {
    if (!isResubmission) return;
    const normalizedRole = String(resubmitRole || '').toLowerCase();
    if (normalizedRole && ROLE_DOCS[normalizedRole]) {
      setRole(normalizedRole);
      const allowed = ROLE_DOCS[normalizedRole] || [];
      setDoc({ type: allowed[0] || 'other', name: '', file: null });
    }
  }, [isResubmission, resubmitRole]);

  const onSelectPlace = async (item) => {
    setSelectedPlace(item);
    setCreateNew(false);
    setSelectedPlaceDetails(null);
    try {
      const details = await doctorService.getPlaceById(item.id);
      setSelectedPlaceDetails(details);
    } catch (e) {
      setSelectedPlaceDetails(null);
    }
  };

  const addNewPlace = () => {
    setSelectedPlace(null);
    setSelectedPlaceDetails(null);
    setCreateNew(true);
  };

  const SUPPORTED_DOC_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const isSupportedDoc = (file) => {
    const mime = String(file?.mimeType || file?.type || '').toLowerCase().trim();
    if (mime && SUPPORTED_DOC_MIME_TYPES.includes(mime)) return true;
    const name = String(file?.name || '').toLowerCase();
    if (name.endsWith('.pdf') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) return true;
    return false;
  };

  const pickDoc = async () => {
    setDocError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (!isSupportedDoc(file)) {
          setDocError('Unsupported file type. Please upload PDF, JPG, PNG, or WEBP.');
          return;
        }
        setDoc((prev) => ({ type: prev?.type || 'other', name: prev?.name || '', file }));
      }
    } catch (e) {
      setDocError('Could not open document picker');
    }
  };

  const setDocType = (type) => setDoc((prev) => ({ ...prev, type }));
  const setDocName = (name) => setDoc((prev) => ({ ...prev, name }));
  const clearDoc = () => {
    const allowed = ROLE_DOCS[role] || [];
    setDoc({ type: allowed[0] || '', name: '', file: null });
  };

  // Filter document types based on role: owner can use 'owner_declaration'; others cannot.
  const docTypeOptions = useMemo(() => {
    const keys = ROLE_DOCS[role] || [];
    return keys.map((k) => DOC_TYPES.find((t) => t.key === k)).filter(Boolean);
  }, [role]);

  useEffect(() => {
    const allowed = ROLE_DOCS[role] || [];
    if (!allowed.includes(doc.type)) {
      const next = allowed[0] || '';
      setDoc((prev) => ({ ...prev, type: next }));
      return;
    }
    // Default to the first allowed type when user hasn't intentionally chosen one yet.
    if (!doc?.file && !String(doc?.name || '').trim() && allowed.length && doc.type !== allowed[0]) {
      setDoc((prev) => ({ ...prev, type: allowed[0] }));
    }
  }, [role]);

  const validateBeforeSubmit = () => {
    const errs = [];
    const fe = {};
    if (isResubmission) {
      if (resubmitRoleRejected) {
        errs.push('This role request was rejected. Document re-upload is not allowed.');
        setFieldErrors({});
        return errs;
      }
      const attempts = Number.isFinite(Number(resubmitAttemptsCount)) ? Number(resubmitAttemptsCount) : null;
      if (attempts != null && attempts >= Number(resubmitAttemptsMax)) {
        errs.push(`Maximum document submissions reached (${attempts}/${resubmitAttemptsMax}).`);
        setFieldErrors({});
        return errs;
      }
      if (!canResubmitDoc) {
        errs.push('Document resubmission is available only when your role is pending and your latest document is rejected.');
        setFieldErrors({});
        return errs;
      }
      if (!doc?.file) { errs.push('Please upload a document'); fe.doc_file = true; }
      if (doc?.file && !isSupportedDoc(doc.file)) { errs.push('Unsupported file type. Please upload PDF, JPG, PNG, or WEBP.'); fe.doc_file = true; }
      if (!doc?.type) { errs.push('Select document type'); fe.doc_type = true; }
      const name = String(doc?.name || '').trim();
      if (!name || name.length < 2 || name.length > 100) { errs.push('Enter a valid document name (2–100 chars)'); fe.doc_name = true; }
      const size = doc?.file?.size || 0;
      if (size && size > 10 * 1024 * 1024) errs.push('File must be under 10 MB');
      setFieldErrors(fe);
      return errs;
    }
    if (selectedPlace) {
      if (!role) errs.push('Select a role');
      if (!doc?.file) { errs.push('Please upload a document'); fe.doc_file = true; }
      if (doc?.file && !isSupportedDoc(doc.file)) { errs.push('Unsupported file type. Please upload PDF, JPG, PNG, or WEBP.'); fe.doc_file = true; }
      if (!doc?.type) { errs.push('Select document type'); fe.doc_type = true; }
      const name = String(doc?.name || '').trim();
      if (!name || name.length < 2 || name.length > 100) { errs.push('Enter a valid document name (2–100 chars)'); fe.doc_name = true; }
      const size = doc?.file?.size || 0;
      if (size && size > 10 * 1024 * 1024) errs.push('File must be under 10 MB');
    } else if (createNew) {
      if (!role) errs.push('Select a role');
      const name = String(draftPlace.name || '').trim();
      if (!name) { errs.push('Place name is required'); fe.name = true; }
      if (!draftPlace.type) errs.push('Place type is required');
      if (!draftPlace.address_line1) { errs.push('Address line 1 is required'); fe.address_line1 = true; }
      if (!draftPlace.address_area_locality) { errs.push('Locality is required'); fe.address_area_locality = true; }
      if (!draftPlace.address_city) { errs.push('City is required'); fe.address_city = true; }
      if (!draftPlace.address_state) { errs.push('State is required'); fe.address_state = true; }
      const stateHasDigits = /\d/.test(String(draftPlace.address_state || ''));
      if (!fe.address_state && stateHasDigits) { errs.push('State cannot contain numbers'); fe.address_state = true; }
      if (!draftPlace.address_pincode) { errs.push('Pincode is required'); fe.address_pincode = true; }
      if (!draftPlace.official_phone) { errs.push('Official phone is required'); fe.official_phone = true; }
      // Format checks
      const pinDigits = String(draftPlace.address_pincode || '').replace(/\D/g, '');
      if (pinDigits && pinDigits.length !== 6) { errs.push('Pincode must be 6 digits'); fe.address_pincode = true; }
      const phoneDigits = String(draftPlace.official_phone || '').replace(/\D/g, '');
      if (phoneDigits.length !== 10) { errs.push('Phone must be exactly 10 digits'); fe.official_phone = true; }
      if (!doc?.file) { errs.push('Please upload a document'); fe.doc_file = true; }
      if (doc?.file && !isSupportedDoc(doc.file)) { errs.push('Unsupported file type. Please upload PDF, JPG, PNG, or WEBP.'); fe.doc_file = true; }
      if (!doc?.type) { errs.push('Select document type'); fe.doc_type = true; }
      const dname = String(doc?.name || '').trim();
      if (!dname || dname.length < 2 || dname.length > 100) { errs.push('Enter a valid document name (2–100 chars)'); fe.doc_name = true; }
      const size = doc?.file?.size || 0;
      if (size && size > 10 * 1024 * 1024) errs.push('File must be under 10 MB');
    } else {
      errs.push('Select or add a place');
    }
    setFieldErrors(fe);
    return errs;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    const errs = validateBeforeSubmit();
    if (errs.length) {
      setSubmitError(errs.join('\n'));
      return;
    }
    setSubmitting(true);
    try {
      if (isResubmission) {
        await doctorService.uploadRoleDocument(resubmitRoleId, {
          document_type: doc.type,
          document_name: toTitleCaseWords(doc.name),
          file: doc.file,
        });
        setSuccessVisible(true);
        return;
      }
      if (selectedPlace) {
        const payload = {
          existing_place_id: selectedPlace.id,
          role,
          docs: doc?.file ? [{ type: doc.type, name: toTitleCaseWords(doc.name), file: doc.file }] : [],
        };
        await doctorService.enrollWorkplace(payload);
      } else if (createNew) {
        const payload = {
          role,
          name: toTitleCaseWords(draftPlace.name),
          type: draftPlace.type,
          official_phone: String(draftPlace.official_phone || '').trim(),
          address_line1: toTitleCaseWords(draftPlace.address_line1),
          address_city: toTitleCaseWords(draftPlace.address_city),
          address_state: toTitleCaseWords(draftPlace.address_state),
          address_pincode: String(draftPlace.address_pincode || '').trim(),
          address_line2: toTitleCaseWords(draftPlace.address_line2),
          address_area_locality: toTitleCaseWords(draftPlace.address_area_locality),
          address_country: toTitleCaseWords(draftPlace.address_country || 'India'),
          docs: doc?.file ? [{ type: doc.type, name: toTitleCaseWords(doc.name), file: doc.file }] : [],
        };
        await doctorService.enrollWorkplace(payload);
      }
      setSuccessVisible(true);
    } catch (e) {
      setSubmitError(e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSearch = () => (
    <View style={styles.card}>
      <Text style={styles.label}>Clinic / Hospital name</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#667eea" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search place"
          placeholderTextColor="#9aa4b2"
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSelectedPlace(null);
            setCreateNew(false);
          }}
        />
      </View>
      {searching && <ActivityIndicator style={{ marginTop: 12 }} />}
      {!!searchError && <Text style={styles.errorText}>{searchError}</Text>}
      <ScrollView style={styles.resultsList} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {results && results.length > 0 ? (
          results.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.placeResultCard, selectedPlace?.id === item.id && styles.placeResultCardActive]}
              activeOpacity={0.9}
              onPress={() => onSelectPlace(item)}
            >
              <View style={styles.placeResultIconShell}>
                <Ionicons name={item.type === 'hospital' ? 'medical-outline' : item.type === 'clinic' ? 'medkit-outline' : 'business-outline'} size={18} color="#667eea" />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.placeResultTitle} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                <View style={styles.placeResultBadgesRow}>
                  <View style={styles.placeTypePill}>
                    <Ionicons name={item.type === 'hospital' ? 'medical-outline' : item.type === 'clinic' ? 'medkit-outline' : 'business-outline'} size={12} color="#667eea" />
                    <Text style={styles.placeTypePillText}>{item.type === 'clinic' ? 'Clinic' : item.type === 'hospital' ? 'Hospital' : (item.type || '')}</Text>
                  </View>

                  <View style={[styles.placeVerifyPill, item.is_verified ? styles.placeVerifyOn : styles.placeVerifyOff]}>
                    <Ionicons name={item.is_verified ? 'checkmark-circle' : 'alert-circle'} size={12} color={item.is_verified ? '#16a34a' : '#f59e0b'} />
                    <Text style={[styles.placeVerifyPillText, item.is_verified ? styles.placeVerifyTextOn : styles.placeVerifyTextOff]}>
                      {item.is_verified ? 'Verified' : 'Unverified'}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedPlace?.id === item.id ? (
                <View style={styles.placeResultSelectedPill}>
                  <Ionicons name="checkmark" size={14} color="#667eea" />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#b0b7c3" />
              )}
            </TouchableOpacity>
          ))
        ) : (
          searchAttempted && !searching ? (
            <Text style={styles.emptyText}>No places found</Text>
          ) : null
        )}
      </ScrollView>
      {query.trim().length >= 3 && searchAttempted && !searching && results.length === 0 && (
        <TouchableOpacity style={styles.addNewBtn} onPress={addNewPlace}>
          <Ionicons name="business-outline" size={18} color="#fff" />
          <Text style={styles.addNewText}>Create Workplace</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPlaceSection = () => {
    if (selectedPlace) {
      const d = selectedPlaceDetails;
      return (
        <View style={styles.card}>
          <View style={styles.selectedPlaceHeaderRow}>
            <View style={styles.selectedPlaceIconShell}>
              <Ionicons name={selectedPlace.type === 'hospital' ? 'medical-outline' : selectedPlace.type === 'clinic' ? 'medkit-outline' : 'business-outline'} size={18} color="#667eea" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.selectedPlaceTitle} numberOfLines={1} ellipsizeMode="tail">{selectedPlace.name}</Text>
              <View style={styles.selectedPlaceBadgesRow}>
                <View style={styles.placeTypePill}>
                  <Ionicons name={selectedPlace.type === 'hospital' ? 'medical-outline' : selectedPlace.type === 'clinic' ? 'medkit-outline' : 'business-outline'} size={12} color="#667eea" />
                  <Text style={styles.placeTypePillText}>{selectedPlace.type === 'clinic' ? 'Clinic' : selectedPlace.type === 'hospital' ? 'Hospital' : (selectedPlace.type || '')}</Text>
                </View>
                <View style={[styles.placeVerifyPill, selectedPlace.is_verified ? styles.placeVerifyOn : styles.placeVerifyOff]}>
                  <Ionicons name={selectedPlace.is_verified ? 'checkmark-circle' : 'alert-circle'} size={12} color={selectedPlace.is_verified ? '#16a34a' : '#f59e0b'} />
                  <Text style={[styles.placeVerifyPillText, selectedPlace.is_verified ? styles.placeVerifyTextOn : styles.placeVerifyTextOff]}>
                    {selectedPlace.is_verified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {!!d && (
            <View style={styles.selectedPlaceDetailRow}>
              <Ionicons name="location-outline" size={16} color="#667eea" />
              <Text style={styles.selectedPlaceDetailText} numberOfLines={2}>
                {[d.address?.line1, d.address?.line2, d.address?.area_locality, d.address?.city, d.address?.state, d.address?.pincode, d.address?.country]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>
      );
    }
    if (createNew) {
      return (
        <View style={styles.card}>
          <Text style={styles.label}>Place name</Text>
          <TextInput style={[styles.input, fieldErrors.name && styles.inputError]} value={draftPlace.name} onChangeText={(t) => setDraftPlace({ ...draftPlace, name: t })} placeholder="Enter name" />
          <Text style={[styles.label, { marginTop: 12 }]}>Type</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.key} style={[styles.typeChip, draftPlace.type === opt.key && styles.typeChipActive]} onPress={() => setDraftPlace({ ...draftPlace, type: opt.key })}>
                <Text style={[styles.typeChipText, draftPlace.type === opt.key && styles.typeChipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 12 }]}>Address line 1</Text>
          <TextInput style={[styles.input, fieldErrors.address_line1 && styles.inputError]} value={draftPlace.address_line1} onChangeText={(t) => setDraftPlace({ ...draftPlace, address_line1: t })} placeholder="Line 1" />
          <Text style={[styles.label, { marginTop: 12 }]}>Address line 2 (optional)</Text>
          <TextInput style={styles.input} value={draftPlace.address_line2} onChangeText={(t) => setDraftPlace({ ...draftPlace, address_line2: t })} placeholder="Line 2" />
          <Text style={[styles.label, { marginTop: 12 }]}>Locality</Text>
          <TextInput style={[styles.input, fieldErrors.address_area_locality && styles.inputError]} value={draftPlace.address_area_locality} onChangeText={(t) => setDraftPlace({ ...draftPlace, address_area_locality: t })} placeholder="Area / Locality" />
          <Text style={[styles.label, { marginTop: 12 }]}>City</Text>
          <TextInput style={[styles.input, fieldErrors.address_city && styles.inputError]} value={draftPlace.address_city} onChangeText={(t) => setDraftPlace({ ...draftPlace, address_city: t })} placeholder="City" />
          <Text style={[styles.label, { marginTop: 12 }]}>State</Text>
          <TextInput style={[styles.input, fieldErrors.address_state && styles.inputError]} value={draftPlace.address_state} onChangeText={(t) => setDraftPlace({ ...draftPlace, address_state: String(t).replace(/\d/g, '') })} placeholder="State" />
          <Text style={[styles.label, { marginTop: 12 }]}>Pincode</Text>
          <TextInput style={[styles.input, fieldErrors.address_pincode && styles.inputError]} value={draftPlace.address_pincode} onChangeText={(t) => setDraftPlace({ ...draftPlace, address_pincode: t })} keyboardType="number-pad" placeholder="Pincode" />
          <Text style={[styles.label, { marginTop: 12 }]}>Official phone</Text>
          <TextInput style={[styles.input, fieldErrors.official_phone && styles.inputError]} value={draftPlace.official_phone} onChangeText={(t) => {
            const only = String(t).replace(/\D/g, '').slice(0, 10);
            setDraftPlace({ ...draftPlace, official_phone: only });
          }} keyboardType="phone-pad" placeholder="Phone" maxLength={10} />
        </View>
      );
    }
    return null;
  };

  const renderRole = () => (
    <View style={styles.card}>
      <Text style={styles.label}>Select role</Text>
      <View style={styles.roleRow}>
        {ROLE_OPTIONS.map((opt, idx) => {
          const active = role === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.roleCard, active && styles.roleCardActive, idx === ROLE_OPTIONS.length - 1 && { marginRight: 0 }]}
              activeOpacity={0.9}
              onPress={() => setRole(opt.key)}
            >
              <View style={[styles.roleIconShell, active && styles.roleIconShellActive]}>
                <Ionicons name={ROLE_ICONS[opt.key]} size={18} color={active ? '#667eea' : '#64748b'} />
              </View>
              <Text style={[styles.roleCardText, active && styles.roleCardTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDocument = () => {
    const fileDisplayName = (() => {
      const name = doc?.file?.name;
      if (!name) return 'File selected';
      const n = String(name);
      const MAX = 36;
      if (n.length <= MAX) return n;
      const head = n.slice(0, 18);
      const tail = n.slice(-17);
      return `${head}\u2026${tail}`;
    })();
    return (
      <View style={[styles.card, isResubmission && styles.centerCard]}>
        {!!docError && <Text style={styles.errorText}>{docError}</Text>}
        <Text style={styles.label}>Document type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: width - 64 }}>
          {docTypeOptions.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.docTypeChip, doc.type === t.key && styles.docTypeChipActive]} onPress={() => setDocType(t.key)}>
              <Text style={[styles.docTypeText, doc.type === t.key && styles.docTypeTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {fieldErrors.doc_type && <Text style={styles.fieldErrorText}>Select a document type</Text>}

        <Text style={[styles.label, { marginTop: 12 }]}>Document name</Text>
        <TextInput style={[styles.input, fieldErrors.doc_name && styles.inputError]} value={doc.name} onChangeText={(t) => setDocName(t)} placeholder="e.g., Clinic License" />
        {fieldErrors.doc_name && <Text style={styles.fieldErrorText}>Enter a valid name (2–100 chars)</Text>}

        <Text style={[styles.label, { marginTop: 12 }]}>File</Text>
        {doc.file ? (
          <View style={styles.fileCard}>
            <View style={styles.fileRow}>
              <Ionicons name="document-text-outline" size={18} color="#667eea" />
              <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">{fileDisplayName}</Text>
            </View>
            <View style={styles.fileActions}>
              <TouchableOpacity style={styles.replaceBtn} onPress={pickDoc}>
                <Ionicons name="swap-horizontal" size={16} color="#667eea" />
                <Text style={styles.replaceText}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtnPlain} onPress={clearDoc}>
                <Ionicons name="trash" size={16} color="#a94442" />
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.uploadBox, fieldErrors.doc_file && styles.inputError]} onPress={pickDoc}>
            <View style={styles.uploadIconShell}>
              <Ionicons name="cloud-upload-outline" size={22} color="#667eea" />
            </View>
            <Text style={styles.uploadTitle}>Tap to upload</Text>
            <Text style={styles.uploadText}>PDF / Image • Max 10 MB</Text>
          </TouchableOpacity>
        )}
        {fieldErrors.doc_file && <Text style={styles.fieldErrorText}>Please upload a document file</Text>}

        <Text style={styles.helperText}>Only one document is required.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isResubmission ? 'Resubmit Document' : 'Join Workplace'}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={[{ paddingBottom: 120 }, isResubmission && styles.centeredScrollContent]}>
        {!isResubmission && renderSearch()}
        {!isResubmission && renderPlaceSection()}
        {!isResubmission && renderRole()}

        {isResubmission && (
          <View style={[styles.centerCardWrap]}>
            <LinearGradient
              colors={canResubmitDoc ? ['#667eea', '#764ba2'] : resubmitRoleRejected ? ['#0f172a', '#7f1d1d'] : ['#0f172a', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resubmitHeroCard}
            >
              <View style={styles.resubmitHeroHeader}>
                <View style={styles.resubmitHeroIconShell}>
                  <Ionicons name={canResubmitDoc ? 'document-text-outline' : resubmitRoleRejected ? 'close-circle' : 'time-outline'} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resubmitHeroTitle} numberOfLines={2}>
                    {resubmitPlaceName ? toTitleCaseWords(resubmitPlaceName) : 'Workplace'}
                  </Text>
                  <View style={styles.resubmitHeroPillsRow}>
                    {!!resubmitRole && (
                      <View style={styles.resubmitHeroPill}>
                        <Ionicons name="person-outline" size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.resubmitHeroPillText}>{toTitleCaseWords(String(resubmitRole).replace(/_/g, ' '))}</Text>
                      </View>
                    )}
                    {!!resubmitRoleStatus && (
                      <View style={styles.resubmitHeroPill}>
                        <Ionicons name={resubmitRoleRejected ? 'close-circle' : 'time-outline'} size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.resubmitHeroPillText}>Role: {toTitleCaseWords(String(resubmitRoleStatus).replace(/_/g, ' '))}</Text>
                      </View>
                    )}
                    {!!resubmitLatestDocStatus && (
                      <View style={styles.resubmitHeroPill}>
                        <Ionicons name="document-outline" size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.resubmitHeroPillText}>Doc: {toTitleCaseWords(String(resubmitLatestDocStatus).replace(/_/g, ' '))}</Text>
                      </View>
                    )}
                    {Number.isFinite(Number(resubmitAttemptsCount)) && (
                      <View style={styles.resubmitHeroPill}>
                        <Ionicons name="repeat-outline" size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.resubmitHeroPillText}>Attempts: {Number(resubmitAttemptsCount)}/{Number(resubmitAttemptsMax)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.resubmitHeroMessage} numberOfLines={3}>
                {resubmitRoleRejected
                  ? 'This workplace role request was rejected. Document re-upload is not available for rejected role requests.'
                  : attemptsExceeded
                    ? 'You have reached the maximum number of document submissions for this workplace role.'
                    : canResubmitDoc
                      ? 'Your document was rejected. Upload a corrected document to continue the review.'
                      : 'No action is required right now. Please wait for the review to complete.'}
              </Text>

              {!!resubmitLatestDocType && !!resubmitLatestDocName && (
                <View style={styles.resubmitHeroDocRow}>
                  <Ionicons name="document-text-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.resubmitHeroDocText} numberOfLines={1}>
                    {toTitleCaseWords(String(resubmitLatestDocType).replace(/_/g, ' '))} • {String(resubmitLatestDocName)}
                  </Text>
                </View>
              )}
            </LinearGradient>

            {!!resubmitReviewNotes && !resubmitRoleRejected && (
              <View style={[styles.card, styles.centerCard, styles.resubmitNotesCard]}>
                <View style={styles.notesHeaderRow}>
                  <Ionicons name="chatbox-ellipses-outline" size={18} color="#0f172a" />
                  <Text style={styles.notesHeaderText}>Review Note</Text>
                </View>
                <Text style={styles.notesBodyText}>{String(resubmitReviewNotes)}</Text>
              </View>
            )}
          </View>
        )}

        {renderDocument()}
      </ScrollView>
      <View style={styles.footer}>
        {isResubmission && !canResubmitDoc && (
          <View style={styles.resubmitLockedRow}>
            <Ionicons name="lock-closed-outline" size={14} color="#64748b" />
            <Text style={styles.resubmitLockedText}>Resubmission is currently disabled for this request.</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, (successVisible || submitting || (isResubmission ? !canResubmitDoc : attemptsExceeded)) && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={successVisible || submitting || (isResubmission ? !canResubmitDoc : attemptsExceeded)}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{isResubmission ? 'Submit Document' : 'Submit Request'}</Text>}
        </TouchableOpacity>
      </View>
      {!!submitError && (
        <View style={styles.overlayBackdrop}>
          <View style={styles.overlayCard}>
            <View style={styles.successIconWrap}>
              <View style={[styles.successIconInner, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
                <Ionicons name="alert" size={46} color="#f59e0b" />
              </View>
            </View>
            <Text style={styles.successTitle}>Unable to Submit</Text>
            <Text style={styles.successSubtitle}>{submitError}</Text>
            <TouchableOpacity style={styles.overlayPrimaryBtn} activeOpacity={0.9} onPress={() => { setSubmitError(''); }}>
              <Text style={styles.overlayPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {successVisible && (
        <View style={styles.overlayBackdrop}>
          <View style={styles.overlayCard}>
            <View style={styles.successIconWrap}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark" size={46} color="#16a34a" />
              </View>
            </View>
            <Text style={styles.successTitle}>{isResubmission ? 'Document Submitted' : 'Request Submitted'}</Text>
            <Text style={styles.successSubtitle}>
              {isResubmission ? 'Your document has been submitted for review.' : 'Your workplace enrollment request has been submitted for review.'}
            </Text>
            <TouchableOpacity
              style={[styles.overlayPrimaryBtn, navigatingOut && { opacity: 0.7 }]}
              activeOpacity={0.9}
              disabled={navigatingOut}
              onPress={() => {
                if (navigatingOut) return;
                setNavigatingOut(true);
                setSuccessVisible(false);
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Dashboard',
                      params: { screen: 'DoctorDashboardMain', params: { refresh: true } },
                    },
                  ],
                });
              }}
            >
              <Text style={styles.overlayPrimaryText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2c3e50' },
  stepHeader: { paddingHorizontal: 16, paddingTop: 16 },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: '#e6e9f2', overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: '#667eea' },
  stepChipsRow: { flexDirection: 'row', marginTop: 10 },
  stepChip: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  stepChipActive: { borderColor: '#667eea', backgroundColor: '#eef2ff' },
  stepChipDone: { borderColor: '#667eea' },
  stepChipText: { color: '#7f8c8d', fontWeight: '700', fontSize: 12 },
  stepChipTextActive: { color: '#667eea' },
  stepTitle: { marginTop: 10, fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  centeredScrollContent: { alignItems: 'center', paddingTop: 14 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f3f4' },
  centerCard: { width: Math.min(width - 32, 420) },
  centerCardWrap: { width: Math.min(width - 32, 420) },
  label: { fontSize: 14, color: '#2c3e50', marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e6e9f2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fafbff', color: '#2c3e50' },
  inputError: { borderColor: '#ff6b6b' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e6e9f2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fafbff' },
  searchInput: { flex: 1, marginLeft: 8, color: '#2c3e50' },
  errorText: { color: '#a94442', fontSize: 12, marginTop: 8 },
  fieldErrorText: { color: '#a94442', fontSize: 12, marginTop: 6 },
  noticeCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, marginBottom: 0, borderRadius: 16, padding: 14, borderWidth: 1 },
  noticeCardError: { borderColor: '#f5c2c7', backgroundColor: '#fef2f2' },
  noticeTextError: { color: '#991b1b', fontSize: 12, fontWeight: '700' },
  resubmitCard: { borderColor: '#eef2f7' },
  resubmitTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  resubmitSubtitle: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#667eea' },
  resubmitMeta: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#334155' },
  resubmitNotesBox: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#fafbff', borderWidth: 1, borderColor: '#eef2ff' },
  resubmitNotesLabel: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  resubmitNotesText: { marginTop: 6, fontSize: 12, fontWeight: '600', color: '#334155', lineHeight: 18 },
  resultsList: { marginTop: 10, maxHeight: 320 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f6f7f9' },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#eef2ff', backgroundColor: '#fafbff', borderRadius: 12, marginBottom: 8 },
  resultLeftIcon: { marginRight: 12 },
  resultIconGrad: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resultRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  chevron: { marginLeft: 8 },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#2c3e50' },
  resultMeta: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  resultTypeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#eef2ff' },
  resultTypeChipText: { fontSize: 12, fontWeight: '700', color: '#667eea' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },
  verified: { backgroundColor: '#e8f5e9' },
  provisional: { backgroundColor: '#fff7e6' },
  verifiedText: { color: '#0f9d58', marginLeft: 6, fontSize: 12, fontWeight: '700' },
  provisionalText: { color: '#f4b400', marginLeft: 6, fontSize: 12, fontWeight: '700' },
  placeResultCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#eef2f7', backgroundColor: '#fff', marginBottom: 10 },
  placeResultCardActive: { borderColor: '#c7d2fe', backgroundColor: '#f8f9ff' },
  placeResultIconShell: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#dbeafe' },
  placeResultTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  placeResultBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  placeTypePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#eef2ff', marginRight: 8, marginBottom: 8 },
  placeTypePillText: { marginLeft: 6, fontSize: 12, fontWeight: '700', color: '#667eea' },
  placeVerifyPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 },
  placeVerifyOn: { backgroundColor: '#dcfce7' },
  placeVerifyOff: { backgroundColor: '#ffedd5' },
  placeVerifyPillText: { marginLeft: 6, fontSize: 12, fontWeight: '800' },
  placeVerifyTextOn: { color: '#16a34a' },
  placeVerifyTextOff: { color: '#c2410c' },
  placeResultSelectedPill: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#7f8c8d', fontSize: 13, marginTop: 8 },
  addNewBtn: { marginTop: 12, backgroundColor: '#667eea', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  addNewText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  readonlyTitle: { fontSize: 18, fontWeight: '800', color: '#2c3e50' },
  readonlyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f6f7f9' },
  readonlyLabel: { color: '#7f8c8d', fontSize: 13 },
  readonlyValue: { color: '#2c3e50', fontSize: 13, flex: 1, textAlign: 'right', marginLeft: 16 },
  selectedPlaceHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  selectedPlaceIconShell: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#dbeafe' },
  selectedPlaceTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  selectedPlaceBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  selectedPlaceDetailRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f3f4' },
  selectedPlaceDetailText: { marginLeft: 10, color: '#334155', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 17 },
  statusRow: { marginTop: 12 },
  statusMsg: { color: '#2c3e50' },
  typeRow: { flexDirection: 'row', marginTop: 4 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e6e9f2', marginRight: 8, backgroundColor: '#fff' },
  typeChipActive: { borderColor: '#667eea', backgroundColor: '#eef2ff' },
  typeChipText: { color: '#2c3e50', fontWeight: '600' },
  typeChipTextActive: { color: '#667eea' },
  divider: { height: 1, backgroundColor: '#f1f3f4', marginVertical: 12 },
  subtle: { color: '#7f8c8d', fontSize: 12 },
  radioGroup: {},
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f6f7f9' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#c7ced6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioOuterActive: { borderColor: '#667eea' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#667eea' },
  radioLabel: { color: '#2c3e50', fontWeight: '600' },
  noteText: { color: '#7f8c8d', fontSize: 12, marginTop: 4 },
  docRow: { marginBottom: 16 },
  roleRow: { flexDirection: 'row', marginTop: 4 },
  roleCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e6e9f2', backgroundColor: '#fff', marginRight: 8, alignItems: 'center' },
  roleCardActive: { borderColor: '#c7d2fe', backgroundColor: '#f8f9ff' },
  roleCardIcon: { marginBottom: 6 },
  roleIconShell: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  roleIconShellActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  roleCardText: { color: '#2c3e50', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  roleCardTextActive: { color: '#667eea' },
  docTypeChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e6e9f2', marginRight: 8 },
  docTypeChipActive: { borderColor: '#667eea', backgroundColor: '#eef2ff' },
  docTypeText: { color: '#2c3e50', fontSize: 12 },
  docTypeTextActive: { color: '#667eea', fontWeight: '700' },
  removeBtn: { position: 'absolute', right: 0, top: 0, padding: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  fileName: { marginLeft: 8, color: '#2c3e50', flex: 1, flexShrink: 1 },
  fileCard: { borderWidth: 1, borderColor: '#eef2ff', backgroundColor: '#fafbff', borderRadius: 12, padding: 12, marginTop: 8 },
  fileActions: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  replaceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  replaceText: { color: '#667eea', fontWeight: '700', marginLeft: 6 },
  removeBtnPlain: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  removeText: { color: '#a94442', fontWeight: '700', marginLeft: 6 },
  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  uploadIconShell: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' },
  uploadTitle: { marginTop: 10, color: '#0f172a', fontSize: 14, fontWeight: '800' },
  uploadText: { color: '#7f8c8d', marginTop: 6, fontSize: 12 },
  addDocBtn: { backgroundColor: '#667eea', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  addDocText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  helperText: { marginTop: 8, color: '#7f8c8d', fontSize: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f6f7f9' },
  summaryLabel: { color: '#7f8c8d' },
  summaryValue: { color: '#2c3e50', fontWeight: '600' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f3f4' },
  resubmitLockedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  resubmitLockedText: { marginLeft: 8, color: '#64748b', fontSize: 12, fontWeight: '700' },
  nextBtn: { backgroundColor: '#667eea', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { color: '#fff', fontWeight: '800' },
  submitBtn: { backgroundColor: '#10ac84', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontWeight: '800' },
  overlayBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlayCard: { width: '92%', borderRadius: 22, paddingVertical: 24, paddingHorizontal: 20, backgroundColor: '#fff', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12 },
  successIconWrap: { width: 100, height: 100, marginBottom: 16 },
  successIconInner: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#bbf7d0' },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 18, paddingHorizontal: 10, lineHeight: 20 },
  overlayBtn: { borderRadius: 16, overflow: 'hidden', alignSelf: 'stretch', marginHorizontal: 4 },
  overlayBtnGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  overlayBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  overlayPrimaryBtn: { alignSelf: 'stretch', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#667eea' },
  overlayPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  overlaySecondaryBtn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 14 },
  overlaySecondaryText: { color: '#667eea', fontSize: 14, fontWeight: '700' },

  resubmitHeroCard: { borderRadius: 18, padding: 14, overflow: 'hidden', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 12 },
  resubmitHeroHeader: { flexDirection: 'row', alignItems: 'center' },
  resubmitHeroIconShell: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  resubmitHeroTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  resubmitHeroPillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  resubmitHeroPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', marginRight: 8, marginBottom: 8 },
  resubmitHeroPillText: { marginLeft: 6, fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.92)' },
  resubmitHeroMessage: { marginTop: 10, color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  resubmitHeroDocRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  resubmitHeroDocText: { marginLeft: 8, color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '800', flex: 1 },

  resubmitNotesCard: { marginTop: 12, marginBottom: 0, marginHorizontal: 0 },
  notesHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  notesHeaderText: { marginLeft: 10, fontSize: 13, fontWeight: '900', color: '#0f172a' },
  notesBodyText: { marginTop: 10, fontSize: 12, fontWeight: '700', color: '#334155', lineHeight: 18 },
});

export default JoinWorkplaceScreen;
