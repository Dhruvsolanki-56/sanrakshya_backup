import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const VisitSummaryScreen = ({ route, navigation }) => {
  const { patient } = route.params;
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');

  const handleSendSummary = () => {
    if (!diagnosis || !notes) {
      Alert.alert('Missing Information', 'Please fill out the diagnosis and notes fields.');
      return;
    }
    // In a real app, this would send the data to a server.
    Alert.alert(
      'Summary Sent',
      `The visit summary for ${patient.name} has been sent to the parent.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Summary</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.patientName}>For: {patient.name}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Diagnosis</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Common Cold (Viral URI)"
            value={diagnosis}
            onChangeText={setDiagnosis}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes for Parent</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Ensure plenty of fluids and rest. Monitor for high fever..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prescription (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Children's Tylenol, 5ml every 4-6 hours as needed for fever."
            value={prescription}
            onChangeText={setPrescription}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.sendButton} onPress={handleSendSummary}>
          <Text style={styles.sendButtonText}>Send to Parent</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e1e8ed' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  content: { padding: 24 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 24, textAlign: 'center' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#e1e8ed' },
  textArea: { height: 120, textAlignVertical: 'top' },
  sendButton: { backgroundColor: '#10ac84', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  sendButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});

export default VisitSummaryScreen;
