import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FindDoctorsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('distance');

  const specialties = ['All', 'Pediatrician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Orthopedic', 'ENT'];
  const filters = [
    { id: 'distance', label: 'Nearest', icon: 'location-outline' },
    { id: 'rating', label: 'Top Rated', icon: 'star-outline' },
    { id: 'availability', label: 'Available Today', icon: 'calendar-outline' },
    { id: 'experience', label: 'Most Experienced', icon: 'medical-outline' }
  ];

  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Pediatrician',
      experience: '15 years',
      rating: 4.9,
      reviews: 234,
      distance: '0.8 km',
      hospital: 'Children\'s Medical Center',
      availability: 'Available Today',
      consultationFee: '$80',
      image: '👩‍⚕️',
      languages: ['English', 'Spanish'],
      education: 'MD, Harvard Medical School',
      specializations: ['Child Development', 'Vaccinations', 'Nutrition'],
      nextAvailable: 'Today 2:30 PM'
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Pediatrician',
      experience: '12 years',
      rating: 4.8,
      reviews: 189,
      distance: '1.2 km',
      hospital: 'City General Hospital',
      availability: 'Available Tomorrow',
      consultationFee: '$75',
      image: '👨‍⚕️',
      languages: ['English', 'Mandarin'],
      education: 'MD, Johns Hopkins University',
      specializations: ['Pediatric Cardiology', 'Growth Disorders'],
      nextAvailable: 'Tomorrow 10:00 AM'
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Dermatologist',
      experience: '10 years',
      rating: 4.7,
      reviews: 156,
      distance: '2.1 km',
      hospital: 'Skin Care Clinic',
      availability: 'Available Today',
      consultationFee: '$90',
      image: '👩‍⚕️',
      languages: ['English', 'Spanish', 'Portuguese'],
      education: 'MD, Stanford University',
      specializations: ['Pediatric Dermatology', 'Allergies', 'Eczema'],
      nextAvailable: 'Today 4:00 PM'
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      specialty: 'Cardiologist',
      experience: '18 years',
      rating: 4.9,
      reviews: 298,
      distance: '3.5 km',
      hospital: 'Heart & Vascular Institute',
      availability: 'Available Next Week',
      consultationFee: '$120',
      image: '👨‍⚕️',
      languages: ['English'],
      education: 'MD, Mayo Clinic',
      specializations: ['Pediatric Cardiology', 'Congenital Heart Disease'],
      nextAvailable: 'Next Monday 9:00 AM'
    }
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const getAvailabilityColor = (availability) => {
    if (availability.includes('Today')) return '#27AE60';
    if (availability.includes('Tomorrow')) return '#F39C12';
    return '#E74C3C';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <TouchableOpacity style={styles.mapButton}>
          <Ionicons name="map-outline" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialties, hospitals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#7F8C8D"
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterButton, selectedFilter === filter.id && styles.activeFilterButton]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons name={filter.icon} size={16} color={selectedFilter === filter.id ? '#fff' : '#7f8c8d'} />
              <Text style={[styles.filterText, selectedFilter === filter.id && styles.activeFilterText]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Specialties */}
      <View style={styles.specialtiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[styles.specialtyButton, selectedSpecialty === specialty && styles.activeSpecialtyButton]}
              onPress={() => setSelectedSpecialty(specialty)}
            >
              <Text style={[styles.specialtyText, selectedSpecialty === specialty && styles.activeSpecialtyText]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{filteredDoctors.length} doctors found</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort by {filters.find(f => f.id === selectedFilter)?.label}</Text>
          <Text style={styles.sortIcon}>↕️</Text>
        </TouchableOpacity>
      </View>

      {/* Doctors List */}
      <ScrollView style={styles.doctorsList} showsVerticalScrollIndicator={false}>
        {filteredDoctors.map((doctor) => (
          <View key={doctor.id} style={styles.doctorCard}>
            <View style={styles.doctorHeader}>
              <Text style={styles.doctorImage}>{doctor.image}</Text>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
                <View style={styles.doctorStats}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingIcon}>⭐</Text>
                    <Text style={styles.ratingText}>{doctor.rating}</Text>
                    <Text style={styles.reviewsText}>({doctor.reviews})</Text>
                  </View>
                  <Text style={styles.experienceText}>{doctor.experience} exp</Text>
                  <Text style={styles.distanceText}>📍 {doctor.distance}</Text>
                </View>
              </View>
              <View style={styles.doctorActions}>
                <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(doctor.availability) }]}>
                  <Text style={styles.availabilityText}>{doctor.availability}</Text>
                </View>
                <Text style={styles.consultationFee}>{doctor.consultationFee}</Text>
              </View>
            </View>

            <View style={styles.doctorDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Education:</Text>
                <Text style={styles.detailValue}>{doctor.education}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Languages:</Text>
                <Text style={styles.detailValue}>{doctor.languages.join(', ')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Specializations:</Text>
                <Text style={styles.detailValue}>{doctor.specializations.join(', ')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Available:</Text>
                <Text style={[styles.detailValue, { color: getAvailabilityColor(doctor.availability) }]}>
                  {doctor.nextAvailable}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.viewProfileButton}>
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookAppointmentButton}>
                <Text style={styles.bookAppointmentText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  filtersScroll: {
    paddingHorizontal: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  activeFilterButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  filterText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  specialtiesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  specialtyButton: {
    backgroundColor: '#E8F4FD',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeSpecialtyButton: {
    backgroundColor: '#9B59B6',
  },
  specialtyText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  activeSpecialtyText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 5,
  },
  sortIcon: {
    fontSize: 12,
  },
  doctorsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  doctorImage: {
    fontSize: 40,
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#9B59B6',
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorHospital: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  doctorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginRight: 2,
  },
  reviewsText: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  experienceText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginRight: 15,
  },
  distanceText: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  doctorActions: {
    alignItems: 'flex-end',
  },
  availabilityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  consultationFee: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  doctorDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: '#2C3E50',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewProfileButton: {
    flex: 0.48,
    backgroundColor: '#E8F4FD',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  viewProfileText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  bookAppointmentButton: {
    flex: 0.48,
    backgroundColor: '#9B59B6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookAppointmentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});

export default FindDoctorsScreen;
