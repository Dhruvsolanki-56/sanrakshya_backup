import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/userService';

const ParentProfileEditScreen = ({ navigation, route }) => {
  const initial = route?.params?.parent || {};
  const [fullName, setFullName] = useState(initial.full_name || '');
  const [email, setEmail] = useState(initial.email || '');
  const [phoneNumber, setPhoneNumber] = useState(initial.phone_number || initial.phone || '');
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setPrefillLoading(true);
      setError('');
      try {
        const data = await userService.getCurrentParent();
        if (!active || !data) return;
        setFullName(data.full_name || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phone_number || '');
      } catch (err) {
        if (!active) return;
        if (err?.status === 401) setError('Your session has expired. Please login again.');
        else setError(err?.message || 'Failed to load profile');
      } finally {
        if (active) setPrefillLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const validate = () => {
    if (!fullName.trim()) return 'Enter full name';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    if (phoneNumber && !/^\+?[1-9]\d{6,14}$/.test(phoneNumber.replace(/\s|-/g, ''))) return 'Enter a valid phone number';
    return '';
  };

  const onSave = async () => {
    setError('');
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        email: email?.trim() || undefined,
        phone_number: phoneNumber ? phoneNumber.replace(/\s|-/g, '') : undefined,
      };
      await userService.updateParent(payload);
      Alert.alert('Success', 'Profile updated successfully', [
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
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput value={fullName} onChangeText={setFullName} placeholder="Enter full name" style={styles.input} editable={!prefillLoading} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" style={styles.input} editable={!prefillLoading} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter phone number" keyboardType="phone-pad" style={styles.input} editable={!prefillLoading} />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#d93025" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : <View style={{ height: 8 }} />}

        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={loading || prefillLoading}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.saveButtonInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading || prefillLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  inputGroup: { marginTop: 12 },
  inputLabel: { fontSize: 13, color: '#7f8c8d', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dadce0', borderRadius: 10, paddingHorizontal: 12, height: 46, color: '#2c3e50' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', borderColor: '#f5c6cb', borderWidth: 1, padding: 10, borderRadius: 8, marginTop: 12 },
  errorText: { color: '#d93025', fontSize: 12 },
  saveButton: { marginTop: 16, borderRadius: 10, overflow: 'hidden' },
  saveButtonInner: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ParentProfileEditScreen;
