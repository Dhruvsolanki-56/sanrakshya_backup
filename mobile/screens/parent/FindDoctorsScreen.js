import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  Image,
  Dimensions,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// -- Helper: Get Theme based on specialty --
const getSpecialtyTheme = (specialty) => {
  if (specialty.includes('Pediatrician')) {
    return {
      bg: '#F0F9FF', // Light Blue
      accent: '#0284C7',
      artifacts: [
        { icon: 'teddy-bear', size: 120, right: -20, bottom: -20, opacity: 0.1 },
        { icon: 'baby-carriage', size: 60, right: 60, bottom: 40, opacity: 0.05 },
        { icon: 'toy-brick', size: 40, right: 10, bottom: 80, opacity: 0.05 },
        { icon: 'bottle-tonic-plus', size: 50, left: -10, top: -10, opacity: 0.05 }
      ]
    };
  }
  if (specialty.includes('Cardiol')) {
    return {
      bg: '#FEF2F2', // Light Red
      accent: '#DC2626',
      artifacts: [
        { icon: 'heart-pulse', size: 120, right: -20, bottom: -20, opacity: 0.1 },
        { icon: 'heart-box', size: 60, right: 70, bottom: 30, opacity: 0.05 },
        { icon: 'heart', size: 40, right: 20, bottom: 90, opacity: 0.05 },
        { icon: 'doctor', size: 50, left: -10, top: -10, opacity: 0.05 }
      ]
    };
  }
  if (specialty.includes('Dermatol')) {
    return {
      bg: '#ECFDF5', // Light Emerald
      accent: '#059669',
      artifacts: [
        { icon: 'water', size: 120, right: -20, bottom: -20, opacity: 0.1 },
        { icon: 'leaf', size: 60, right: 60, bottom: 40, opacity: 0.05 },
        { icon: 'flower', size: 40, right: 10, bottom: 80, opacity: 0.05 }, // Using flower/leaf as visual proxies for skin/nature
        { icon: 'face-woman-shimmer', size: 50, left: -10, top: -10, opacity: 0.05 }
      ]
    };
  }
  if (specialty.includes('Neuro')) {
    return {
      bg: '#FAF5FF', // Light Purple
      accent: '#7C3AED',
      artifacts: [
        { icon: 'brain', size: 120, right: -20, bottom: -20, opacity: 0.1 },
        { icon: 'thought-bubble', size: 60, right: 70, bottom: 40, opacity: 0.05 },
        { icon: 'head-snowflake', size: 40, right: 20, bottom: 80, opacity: 0.05 },
        { icon: 'lightbulb', size: 50, left: -10, top: -10, opacity: 0.05 }
      ]
    };
  }
  return {
    bg: '#FFFFFF',
    accent: '#475569',
    artifacts: [
      { icon: 'doctor', size: 120, right: -20, bottom: -20, opacity: 0.05 },
      { icon: 'clipboard-pulse', size: 50, left: -10, top: -10, opacity: 0.05 }
    ]
  };
};

const FindDoctorsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All', 'Rating', 'Available'
  const [showFilterModal, setShowFilterModal] = useState(false);

  const specialties = [
    { id: 'All', label: 'All' },
    { id: 'Pediatrician', label: 'Pediatrician' },
    { id: 'Cardiologist', label: 'Cardiologist' },
    { id: 'Dermatologist', label: 'Dermatologist' },
    { id: 'Neurologist', label: 'Neurologist' },
  ];

  const doctors = [
    {
      id: 1,
      name: 'Dr. Anjali Sharma',
      specialty: 'Pediatrician',
      rating: 4.9,
      reviews: 234,
      hospital: 'Apollo Children\'s Hospital',
      fee: '₹800',
      image: '👩‍⚕️',
      verified: true,
      nextAvailable: 'Today, 2:30 PM',
    },
    {
      id: 2,
      name: 'Dr. Rajesh Gupta',
      specialty: 'Pediatric Cardiologist',
      rating: 4.8,
      reviews: 189,
      hospital: 'Fortis Escorts Heart Inst.',
      fee: '₹1200',
      image: '👨‍⚕️',
      verified: true,
      nextAvailable: 'Tomorrow, 10:00 AM',
    },
    {
      id: 3,
      name: 'Dr. Priya Mehta',
      specialty: 'Dermatologist',
      rating: 4.7,
      reviews: 156,
      hospital: 'Skin & Glow Clinic',
      fee: '₹900',
      image: '👩‍⚕️',
      verified: true,
      nextAvailable: 'Today, 4:00 PM',
    },
    {
      id: 4,
      name: 'Dr. Vikram Singh',
      specialty: 'Neurologist',
      rating: 4.9,
      reviews: 298,
      hospital: 'Vimhans Nayati Hospital',
      fee: '₹1500',
      image: '👨‍⚕️',
      verified: false,
      nextAvailable: 'Mon, 9:00 AM',
    }
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doctor.specialty === selectedSpecialty;

    // Filter Handling
    if (selectedFilter === 'Available') {
      return matchesSearch && matchesSpecialty && doctor.nextAvailable.includes('Today');
    }
    return matchesSearch && matchesSpecialty;
  }).sort((a, b) => { // Sort handling
    if (selectedFilter === 'Rating') {
      return b.rating - a.rating;
    }
    return 0; // Default order
  });

  const filters = [
    { id: 'All', label: 'All', icon: 'apps' },
    { id: 'Rating', label: 'Top Rated', icon: 'star' },
    { id: 'Available', label: 'Available Today', icon: 'calendar' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      {/* COMPACT NAV HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR - Standard & Clean */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or specialty..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* SPECIALTY TABS */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {specialties.map(s => {
            const isActive = selectedSpecialty === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setSelectedSpecialty(s.id)}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{s.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* DOCTOR LIST */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredDoctors.map(doc => {
          const theme = getSpecialtyTheme(doc.specialty);
          return (
            <TouchableOpacity
              key={doc.id}
              style={[styles.card, { backgroundColor: theme.bg }]}
              activeOpacity={0.9}
            >
              {/* Background Artifacts (Multi-Icon) */}
              {theme.artifacts.map((art, idx) => (
                <View
                  key={idx}
                  style={{
                    position: 'absolute',
                    right: art.right,
                    left: art.left,
                    top: art.top,
                    bottom: art.bottom,
                    opacity: art.opacity,
                    zIndex: -1
                  }}
                >
                  <MaterialCommunityIcons name={art.icon} size={art.size} color={theme.accent} />
                </View>
              ))}

              <View style={styles.cardMain}>
                {/* Avatar */}
                <View style={[styles.avatarBox, { backgroundColor: '#FFF' }]}>
                  <Text style={{ fontSize: 32 }}>{doc.image}</Text>
                  {doc.verified && (
                    <View style={styles.badge}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.infoCol}>
                  <View style={styles.topRow}>
                    <Text style={styles.name}>{doc.name}</Text>
                    <View style={styles.ratingBox}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.rating}>{doc.rating}</Text>
                    </View>
                  </View>

                  <Text style={[styles.specialty, { color: theme.accent }]}>{doc.specialty}</Text>
                  <Text style={styles.hospital}>{doc.hospital}</Text>

                  <View style={styles.bottomRow}>
                    <View style={styles.availBox}>
                      <Ionicons name="time-outline" size={12} color="#059669" />
                      <Text style={styles.availText}>{doc.nextAvailable}</Text>
                    </View>
                    <Text style={styles.fee}>{doc.fee}</Text>
                  </View>
                </View>
              </View>

              {/* Action Bar */}
              <View style={[styles.cardFooter, { borderTopColor: 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: '#FFF' }]}>
                  <Text style={styles.secondaryBtnText}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
                  <Text style={styles.primaryBtnText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
      {/* FILTER MODAL */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter & Sort</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={24} color="#1F2937" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.filterOptions}>
                  {filters.map(f => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.modalOption, selectedFilter === f.id && styles.activeModalOption]}
                      onPress={() => {
                        setSelectedFilter(f.id);
                        setShowFilterModal(false);
                      }}
                    >
                      <Ionicons name={f.icon} size={20} color={selectedFilter === f.id ? '#FFF' : '#4B5563'} />
                      <Text style={[styles.modalOptionText, selectedFilter === f.id && styles.activeModalOptionText]}>
                        {f.label}
                      </Text>
                      {selectedFilter === f.id && <Ionicons name="checkmark" size={20} color="#FFF" style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray bg
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)', // Lighter overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  activeModalOption: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  activeModalOptionText: {
    color: '#FFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  filterBtn: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersRow: {
    marginBottom: 8,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterChip: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  filterText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  tabsContainer: {
    paddingBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#2563EB', // Royal Blue
    borderColor: '#2563EB',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden', // Ensurebg icon stays inside
    position: 'relative',
  },
  cardInfoBg: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 1,
    zIndex: -1,
  },
  cardMain: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    marginLeft: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#2563EB',
    marginBottom: 2,
    fontWeight: '500',
  },
  hospital: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  fee: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default FindDoctorsScreen;
