import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Image,
	Modal,
	TouchableWithoutFeedback,
	Animated,
	Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { storage } from '../../services/storage';
import { userService } from '../../services/userService';
import { vaccinesService } from '../../services/vaccinesService';

const { width } = Dimensions.get('window');

// Status Filter Constants
const FILTER_UPCOMING = 'upcoming';
const FILTER_MISSED = 'missed';
const FILTER_COMPLETED = 'completed';

const VaccinePlannerScreen = ({ navigation }) => {
	const [children, setChildren] = useState([]);
	const [currentChildIndex, setCurrentChildIndex] = useState(0);
	const [loadingChildren, setLoadingChildren] = useState(true);
	const currentChild = useMemo(() => children[currentChildIndex], [children, currentChildIndex]);

	const [allVaccines, setAllVaccines] = useState([]); // Raw flat list
	const [stats, setStats] = useState({ upcoming: 0, missed: 0, completed: 0 });
	const [loadingVaccines, setLoadingVaccines] = useState(false);
	const [vaccinesError, setVaccinesError] = useState('');

	const [activeFilter, setActiveFilter] = useState(FILTER_UPCOMING);

	// Child Selector State
	const [showChildSelector, setShowChildSelector] = useState(false);
	const [showChildOverlay, setShowChildOverlay] = useState(false);
	const sheetAnim = useRef(new Animated.Value(0)).current;

	const loadChildren = useCallback(async () => {
		setLoadingChildren(true);
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
						avatarSource: avatar ? { uri: avatar } : undefined
					};
				})
			);
			setChildren(mapped);
			if (mapped.length > 0) {
				const storedId = await storage.getSelectedChildId();
				const idx = mapped.findIndex(c => String(c.id) === String(storedId));
				setCurrentChildIndex(idx >= 0 ? idx : 0);
			}
		} catch (err) { } finally { setLoadingChildren(false); }
	}, []);

	useEffect(() => { loadChildren(); }, [loadChildren]);

	useEffect(() => {
		const loadStatuses = async () => {
			if (!currentChild?.id || loadingChildren) return;

			try {
				setLoadingVaccines(true);
				setVaccinesError('');
				const data = await vaccinesService.getStatuses(currentChild.id);
				const list = Array.isArray(data) ? data : data?.statuses || [];

				// Calculate Stats
				let up = 0, mis = 0, comp = 0;
				list.forEach(v => {
					if (v.status === 'Completed') comp++;
					else if (v.status === 'Missed') mis++;
					else up++;
				});

				setStats({ upcoming: up, missed: mis, completed: comp });
				setAllVaccines(list);

				// Smart Default: If missed > 0, maybe prompt? But user said default to Upcoming.
				// However, user said "if too many missed an alert". We handle that in UI.

			} catch (err) {
				setVaccinesError('Unable to load vaccines.');
			} finally {
				setLoadingVaccines(false);
			}
		};
		loadStatuses();
	}, [currentChild?.id, loadingChildren]);

	// Filter Logic
	const filteredList = useMemo(() => {
		if (!allVaccines.length) return [];

		switch (activeFilter) {
			case FILTER_COMPLETED:
				return allVaccines.filter(v => v.status === 'Completed');
			case FILTER_MISSED:
				return allVaccines.filter(v => v.status === 'Missed');
			case FILTER_UPCOMING:
			default:
				return allVaccines.filter(v => v.status !== 'Completed' && v.status !== 'Missed');
		}
	}, [allVaccines, activeFilter]);

	// Grouping for List View (by Age)
	const groupedDisplayList = useMemo(() => {
		const groups = {};
		const ageOrder = ['Birth', '6 Weeks', '10 Weeks', '14 Weeks', '6 Months', '9 Months', '12 Months', '15 Months', '18 Months', '2 Years', '4-6 Years'];

		filteredList.forEach(v => {
			const age = v.schedule?.recommended_age || 'Other';
			if (!groups[age]) groups[age] = [];
			groups[age].push(v);
		});

		// Sort groups
		const sortedKeys = Object.keys(groups).sort((a, b) => {
			const idxA = ageOrder.indexOf(a);
			const idxB = ageOrder.indexOf(b);
			return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
		});

		return sortedKeys.map(key => ({ title: key, data: groups[key] }));
	}, [filteredList]);


	// Child Modal Logic
	const openChildModal = () => {
		if (loadingChildren || !children.length) return;
		setShowChildSelector(true);
		setShowChildOverlay(false);
		sheetAnim.setValue(0);
		Animated.timing(sheetAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(({ finished }) => { if (finished) setShowChildOverlay(true); });
	};

	const closeChildModal = () => {
		setShowChildOverlay(false);
		Animated.timing(sheetAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(({ finished }) => { if (finished) setShowChildSelector(false); });
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScreenHeader
				title="Vaccine Tracker"
				onBackPress={() => navigation.goBack()}
			/>

			{/* Top Child Selector Pill */}
			<View style={styles.topBar}>
				<TouchableOpacity
					style={styles.childPill}
					onPress={openChildModal}
				>
					{currentChild?.avatarSource?.uri ? (
						<Image source={currentChild.avatarSource} style={styles.miniAvatar} />
					) : (
						<View style={styles.miniAvatarPlaceholder}>
							<Text style={styles.miniAvatarText}>{(currentChild?.name || '?').charAt(0)}</Text>
						</View>
					)}
					<Text style={styles.childPillName}>{currentChild?.name || 'Loading...'}</Text>
					<Ionicons name="caret-down" size={12} color="#64748B" />
				</TouchableOpacity>
			</View>

			{loadingVaccines ? (
				<LoadingState message="Loading tracker..." />
			) : (
				<View style={{ flex: 1 }}>
					{/* Alert Banner */}
					{stats.missed > 0 && (
						<View style={styles.alertBanner}>
							<MaterialCommunityIcons name="alert-circle" size={20} color="#B91C1C" />
							<Text style={styles.alertText}>{stats.missed} Missed Vaccines! Please check immediately.</Text>
						</View>
					)}

					{/* Dashboard Stats / Filters */}
					<View style={styles.statsContainer}>
						{/* Upcoming (Blue) */}
						<TouchableOpacity
							style={[styles.statCard, activeFilter === FILTER_UPCOMING && styles.statCardActive, { backgroundColor: activeFilter === FILTER_UPCOMING ? '#EFF6FF' : '#FFF', borderColor: activeFilter === FILTER_UPCOMING ? '#3B82F6' : '#E2E8F0' }]}
							onPress={() => setActiveFilter(FILTER_UPCOMING)}
							activeOpacity={0.7}
						>
							<View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
								<MaterialCommunityIcons name="calendar-clock" size={22} color="#2563EB" />
							</View>
							<Text style={styles.statNumber}>{stats.upcoming}</Text>
							<Text style={styles.statLabel}>Upcoming</Text>
						</TouchableOpacity>

						{/* Missed (Red) */}
						<TouchableOpacity
							style={[styles.statCard, activeFilter === FILTER_MISSED && styles.statCardActive, { backgroundColor: activeFilter === FILTER_MISSED ? '#FEF2F2' : '#FFF', borderColor: activeFilter === FILTER_MISSED ? '#EF4444' : '#E2E8F0' }]}
							onPress={() => setActiveFilter(FILTER_MISSED)}
							activeOpacity={0.7}
						>
							<View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
								<MaterialCommunityIcons name="alert-circle-outline" size={22} color="#DC2626" />
							</View>
							<Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.missed}</Text>
							<Text style={styles.statLabel}>Missed</Text>
						</TouchableOpacity>

						{/* Completed (Green) */}
						<TouchableOpacity
							style={[styles.statCard, activeFilter === FILTER_COMPLETED && styles.statCardActive, { backgroundColor: activeFilter === FILTER_COMPLETED ? '#ECFDF5' : '#FFF', borderColor: activeFilter === FILTER_COMPLETED ? '#10B981' : '#E2E8F0' }]}
							onPress={() => setActiveFilter(FILTER_COMPLETED)}
							activeOpacity={0.7}
						>
							<View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
								<MaterialCommunityIcons name="check-decagram-outline" size={22} color="#059669" />
							</View>
							<Text style={[styles.statNumber, { color: '#059669' }]}>{stats.completed}</Text>
							<Text style={styles.statLabel}>Done</Text>
						</TouchableOpacity>
					</View>

					{/* Filtered List */}
					<ScrollView contentContainerStyle={styles.listContainer}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>
								{activeFilter === FILTER_UPCOMING ? 'Upcoming Schedule' :
									activeFilter === FILTER_MISSED ? 'Attention Required' : 'Completed History'}
							</Text>
						</View>

						{groupedDisplayList.length === 0 ? (
							<View style={styles.startDatePlaceholder}>
								<MaterialCommunityIcons name="clipboard-check-outline" size={60} color="#CBD5E1" />
								<Text style={styles.emptyText}>No vaccines found for this category.</Text>
							</View>
						) : (
							groupedDisplayList.map((group, gIdx) => (
								<View key={gIdx} style={styles.groupContainer}>
									<View style={styles.groupHeader}>
										<View style={styles.groupLine} />
										<Text style={styles.groupTitle}>{group.title}</Text>
										<View style={styles.groupLine} />
									</View>

									{group.data.map((vaccine, vIdx) => (
										<View key={vIdx} style={styles.vaccineCard}>
											<View style={[styles.statusStripe,
											vaccine.status === 'Completed' ? styles.bgGreen :
												(vaccine.status === 'Missed' ? styles.bgRed : styles.bgBlue)
											]} />
											<View style={styles.vaccineContent}>
												<Text style={styles.vaccineName}>{vaccine.schedule?.vaccine_name}</Text>
												<Text style={styles.vaccineDisease}>Protects against: {vaccine.schedule?.disease_prevented}</Text>

												<View style={styles.vaccineMetaRow}>
													{vaccine.status === 'Completed' ? (
														<View style={styles.metaBadgeGreen}>
															<Ionicons name="checkmark-sharp" size={12} color="#059669" />
															<Text style={styles.metaTextGreen}>Given on {new Date().toLocaleDateString()}</Text>
														</View>
													) : (
														<View style={styles.metaBadgeGray}>
															<Text style={styles.metaTextGray}>Dose {1}/{vaccine.schedule?.doses_required || 1}</Text>
														</View>
													)}
												</View>
											</View>
											{/* Action Button (Placeholder for 'Mark as Done') */}
											{vaccine.status !== 'Completed' && (
												<TouchableOpacity style={styles.actionBtn}>
													<Ionicons name="ellipse-outline" size={24} color="#94A3B8" />
												</TouchableOpacity>
											)}
											{vaccine.status === 'Completed' && (
												<Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 10 }} />
											)}
										</View>
									))}
								</View>
							))
						)}
						<View style={{ height: 40 }} />
					</ScrollView>
				</View>
			)}


			{/* Child Selector Modal - Reused */}
			<Modal
				visible={showChildSelector} transparent animationType="none" onRequestClose={closeChildModal}
			>
				<View style={styles.modalOverlay}>
					{showChildOverlay && <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeChildModal} />}
					<TouchableWithoutFeedback>
						<Animated.View style={[styles.childSelectorModal, { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
							<View style={styles.modalHeaderRow}>
								<Text style={styles.levelTitleModal}>Select Child</Text>
								<TouchableOpacity onPress={closeChildModal}><Ionicons name="close" size={24} color="#1E293B" /></TouchableOpacity>
							</View>
							<ScrollView>
								{children.map((child, idx) => (
									<TouchableOpacity key={child.id} style={styles.childRow} onPress={async () => { setCurrentChildIndex(idx); await storage.saveSelectedChildId(child.id); closeChildModal(); }}>
										{child.avatar ? <Image source={{ uri: child.avatar }} style={styles.miniAvatar} /> : <View style={styles.miniAvatarPlaceholder}><Text>{child.name.charAt(0)}</Text></View>}
										<Text style={styles.childRowName}>{child.name}</Text>
										{idx === currentChildIndex && <Ionicons name="checkmark" size={20} color="#6366F1" />}
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
	topBar: { alignItems: 'center', paddingVertical: 10, zIndex: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },

	// Child Pill
	childPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
	miniAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
	miniAvatarPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
	miniAvatarText: { fontSize: 10, fontWeight: 'bold' },
	childPillName: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginRight: 6 },

	// Alert Banner
	alertBanner: { backgroundColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, marginHorizontal: 16, marginTop: 16, borderRadius: 8 },
	alertText: { color: '#B91C1C', fontWeight: '600', marginLeft: 8, fontSize: 13 },

	// Stats / Filters
	statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
	statCard: { flex: 1, height: 100, borderRadius: 16, backgroundColor: '#FFF', padding: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, borderWidth: 1, elevation: 1 },
	statCardActive: { elevation: 4, borderWidth: 1.5 },
	iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
	statNumber: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
	statLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },

	// List
	listContainer: { paddingHorizontal: 16 },
	sectionHeader: { marginBottom: 12 },
	sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

	groupContainer: { marginBottom: 20 },
	groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
	groupLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
	groupTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginHorizontal: 12, textTransform: 'uppercase', letterSpacing: 1 },

	vaccineCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, alignItems: 'center' },
	statusStripe: { width: 6, height: '100%' },
	bgGreen: { backgroundColor: '#10B981' },
	bgRed: { backgroundColor: '#EF4444' },
	bgBlue: { backgroundColor: '#3B82F6' },

	vaccineContent: { flex: 1, padding: 16 },
	vaccineName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
	vaccineDisease: { fontSize: 13, color: '#64748B', marginBottom: 8 },

	vaccineMetaRow: { flexDirection: 'row' },
	metaBadgeGreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
	metaTextGreen: { fontSize: 10, color: '#059669', fontWeight: '600', marginLeft: 4 },
	metaBadgeGray: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
	metaTextGray: { fontSize: 10, color: '#64748B', fontWeight: '600' },

	actionBtn: { padding: 10 },

	emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 10 },
	startDatePlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },

	// Modal
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	childSelectorModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
	modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
	levelTitleModal: { fontSize: 18, fontWeight: '700' },
	childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
	childRowName: { marginLeft: 10, fontSize: 16, flex: 1 }
});

export default VaccinePlannerScreen;
