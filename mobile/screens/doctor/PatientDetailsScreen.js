import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { patientHistory, clinicalFlags } from '../../data/patientHistory';
import { weightData, heightData } from '../../data/growthData';

const { width } = Dimensions.get('window');

const PatientDetailsScreen = ({ route, navigation }) => {
  const { patient } = route.params;
  const history = patientHistory[patient.name] || [];
  const flags = clinicalFlags[patient.name] || [];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
  };

  const getFlagStyle = (urgency) => {
    if (urgency === 'high') return { borderColor: '#ff6b6b', icon: 'alert-circle' };
    if (urgency === 'medium') return { borderColor: '#ffa726', icon: 'warning' };
    return { borderColor: '#10ac84', icon: 'information-circle' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Patient Info */}
        <View style={styles.patientInfoCard}>
          <Image source={{ uri: patient.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientAge}>{patient.age} years old</Text>
          </View>
        </View>

        {/* Clinical Flags */}
        {flags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinical Flags</Text>
            {flags.map(flag => {
              const flagStyle = getFlagStyle(flag.urgency);
              return (
                <View key={flag.id} style={[styles.flagCard, { borderColor: flagStyle.borderColor }]}>
                  <Ionicons name={flagStyle.icon} size={24} color={flagStyle.borderColor} style={styles.flagIcon} />
                  <View style={styles.flagContent}>
                    <Text style={styles.flagTitle}>{flag.title}</Text>
                    <Text style={styles.flagDetails}>{flag.details}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Growth Charts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Charts</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartLabel}>Weight (kg)</Text>
            <LineChart data={weightData} width={width - 48} height={220} chartConfig={chartConfig} bezier style={styles.chart} />
          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.chartLabel}>Height (cm)</Text>
            <LineChart data={heightData} width={width - 48} height={220} chartConfig={chartConfig} bezier style={styles.chart} />
          </View>
        </View>

        {/* Patient History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient History</Text>
          {history.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyIconContainer}>
                <Ionicons name={item.icon} size={24} color="#667eea" />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyDetails}>{item.details}</Text>
              </View>
            </View>
          ))}
        </View>
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
  patientInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 24 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  patientName: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  patientAge: { fontSize: 16, color: '#7f8c8d' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  flagCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 2 },
  flagIcon: { marginRight: 12 },
  flagContent: { flex: 1 },
  flagTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  flagDetails: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  chartContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  chartLabel: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  chart: { borderRadius: 16 },
  historyItem: { flexDirection: 'row', marginBottom: 16 },
  historyIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(102, 126, 234, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyContent: { flex: 1, justifyContent: 'center' },
  historyDate: { fontSize: 12, color: '#7f8c8d' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  historyDetails: { fontSize: 14, color: '#7f8c8d' },
});

export default PatientDetailsScreen;
