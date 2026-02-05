import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { allPatients } from '../../data/patientData';

const PatientListScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredPatients = useMemo(() => {
    let filtered = allPatients;

    if (activeFilter !== 'All') {
      filtered = filtered.filter(p => p.status === activeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, activeFilter]);

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity style={styles.patientItem} onPress={() => navigation.navigate('PatientDetails', { patient: item })}>
      <Image source={{ uri: item.avatar }} style={styles.patientAvatar} />
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientAge}>{item.age} years old</Text>
      </View>
      {item.flags > 0 && (
        <View style={styles.flagIndicator}>
          <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
          <Text style={styles.flagCount}>{item.flags}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={24} color="#c5d0e0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Patients</Text>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {['All', 'Active', 'At Risk', 'Inactive'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderPatientItem}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="sad-outline" size={60} color="#c5d0e0" />
            <Text style={styles.emptyStateText}>No patients found.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f3f4' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#2c3e50' },
  controlsContainer: { padding: 20, backgroundColor: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f4', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: '#2c3e50' },
  filterContainer: { flexDirection: 'row', marginTop: 16 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f3f4', marginRight: 8 },
  activeFilterButton: { backgroundColor: '#667eea' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#7f8c8d' },
  activeFilterText: { color: '#fff' },
  listContentContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  patientItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginVertical: 6, shadowColor: '#667eea', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  patientAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  patientAge: { fontSize: 14, color: '#7f8c8d', marginTop: 2 },
  flagIndicator: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  flagCount: { marginLeft: 4, color: '#ff6b6b', fontWeight: 'bold' },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#7f8c8d', marginTop: 16 },
});

export default PatientListScreen;
