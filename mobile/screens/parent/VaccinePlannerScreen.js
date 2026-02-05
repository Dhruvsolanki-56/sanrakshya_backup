import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Platform,
	ActivityIndicator,
	Image,
	Modal,
	TouchableWithoutFeedback,
	Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { storage } from '../../services/storage';
import { userService } from '../../services/userService';
import { vaccinesService } from '../../services/vaccinesService';

const VaccinePlannerScreen = ({ navigation }) => {
	const [children, setChildren] = useState([]);
	const [currentChildIndex, setCurrentChildIndex] = useState(0);
	const [loadingChildren, setLoadingChildren] = useState(true);
	const [childrenError, setChildrenError] = useState('');
	const currentChild = useMemo(() => children[currentChildIndex], [children, currentChildIndex]);
	const [vaccines, setVaccines] = useState([]);
	const [loadingVaccines, setLoadingVaccines] = useState(false);
	const [vaccinesError, setVaccinesError] = useState('');
	const [showChildSelector, setShowChildSelector] = useState(false);
	const [showChildOverlay, setShowChildOverlay] = useState(false);
	const sheetAnim = useRef(new Animated.Value(0)).current;

	const loadChildren = useCallback(async () => {
		setLoadingChildren(true);
		setChildrenError('');
		try {
			const data = await userService.getParentHome();
			const mapped = await Promise.all(
				(data?.children || []).map(async (c, idx) => {
					const id = String(c.child_id || idx + 1);
					let avatar;
					let avatarSource;
					try {
						const src = await userService.getChildPhotoSource(id, c.photo_url || c.avatar_url || null);
						avatarSource = src || undefined;
						avatar = src?.uri;
					} catch (_) {
						avatar = undefined;
						avatarSource = undefined;
					}
					return {
						id,
						name: c.name || c.full_name || 'Child',
						dobRaw: c.date_of_birth || null,
						avatar,
						avatarSource,
						ageYears: typeof c.age_years === 'number' ? c.age_years : null,
						ageMonths: typeof c.age_months === 'number' ? c.age_months : null,
					};
				})
			);
			setChildren(mapped);
			if (!mapped.length) return;

			const storedId = await storage.getSelectedChildId();
			if (storedId) {
				const idx = mapped.findIndex(c => String(c.id) === String(storedId));
				setCurrentChildIndex(idx >= 0 ? idx : 0);
			} else {
				setCurrentChildIndex(0);
				await storage.saveSelectedChildId(mapped[0].id);
			}
		} catch (err) {
			setChildrenError('Unable to load children. Please try again.');
		} finally {
			setLoadingChildren(false);
		}
	}, []);

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

	useEffect(() => {
		loadChildren();
	}, [loadChildren]);

	useEffect(() => {
		const loadStatuses = async () => {
			if (!currentChild?.id) {
				setVaccines([]);
				return;
			}
			if (loadingChildren) return;

			try {
				setLoadingVaccines(true);
				setVaccinesError('');
				const data = await vaccinesService.getStatuses(currentChild.id);
				const list = Array.isArray(data) ? data : data?.statuses || [];
				const categoryOrder = { Core: 0, Optional: 1, Regional: 2, Supplemental: 3 };
				const sorted = [...list].sort((a, b) => {
					const catA = a.schedule?.category || '';
					const catB = b.schedule?.category || '';
					const ordA = categoryOrder[catA] ?? 99;
					const ordB = categoryOrder[catB] ?? 99;
					if (ordA !== ordB) return ordA - ordB;
					const nameA = (a.schedule?.vaccine_name || '').toLowerCase();
					const nameB = (b.schedule?.vaccine_name || '').toLowerCase();
					return nameA.localeCompare(nameB);
				});
				setVaccines(sorted);
			} catch (err) {
				setVaccines([]);
				setVaccinesError('Unable to load vaccine plan. Please try again.');
			} finally {
				setLoadingVaccines(false);
			}
		};

		loadStatuses();
	}, [currentChild?.id, loadingChildren]);

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

	const getStatusStyle = (status) => {
		switch (status) {
			case 'Completed':
				return { container: styles.completedContainer, text: styles.completedText, label: 'Completed' };
			case 'Missed':
				return { container: styles.missedContainer, text: styles.missedText, label: 'Missed' };
			case 'Pending':
			default:
				return { container: styles.pendingContainer, text: styles.pendingText, label: 'Pending' };
		}
	};

	const getCategoryIcon = (category) => {
		switch (category) {
			case 'Core':
				return {
					icon: 'shield-checkmark',
					colors: ['#667eea', '#764ba2'],
				};
			case 'Optional':
				return {
					icon: 'star',
					colors: ['#f39c12', '#f1c40f'],
				};
			case 'Regional':
				return {
					icon: 'earth',
					colors: ['#e67e22', '#d35400'],
				};
			case 'Supplemental':
				return {
					icon: 'leaf',
					colors: ['#16a085', '#1abc9c'],
				};
			default:
				return {
					icon: 'ellipse-outline',
					colors: ['#95a5a6', '#7f8c8d'],
				};
		}
	};

	const renderVaccineCard = (item) => {
		const schedule = item.schedule || {};
		const statusInfo = getStatusStyle(item.status);
		const dosesRequired = schedule.doses_required ?? 0;
		const remaining = item.remaining_doses ?? 0;
		const taken = Math.max(dosesRequired - remaining, 0);
		const categoryInfo = getCategoryIcon(schedule.category);

		return (
			<View key={schedule.id || schedule.vaccine_name} style={styles.vaccineCard}>
				<View style={styles.vaccineHeaderRow}>
					<LinearGradient
						colors={categoryInfo.colors}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.categoryIconCircle}
					>
						<Ionicons name={categoryInfo.icon} size={16} color="#fff" />
					</LinearGradient>
					<View style={{ flex: 1 }}>
						<Text style={styles.vaccineName}>{schedule.vaccine_name}</Text>
						<Text style={styles.vaccineDisease}>{schedule.disease_prevented}</Text>
					</View>
					<View style={[styles.statusBadge, statusInfo.container]}>
						<Text style={statusInfo.text}>{statusInfo.label}</Text>
					</View>
				</View>
				<Text style={styles.vaccineMeta}>{schedule.recommended_age}</Text>
				<Text style={styles.vaccineDoses}>
					Doses: {taken}/{dosesRequired || 0} completed
				</Text>
			</View>
		);
	};

	const coreVaccines = vaccines.filter((v) => v.schedule?.category === 'Core');
	const optionalVaccines = vaccines.filter((v) => v.schedule?.category === 'Optional');
	const regionalVaccines = vaccines.filter((v) => v.schedule?.category === 'Regional');
	const supplementalVaccines = vaccines.filter((v) => v.schedule?.category === 'Supplemental');
	const otherVaccines = vaccines.filter(
		(v) => !['Core', 'Optional', 'Regional', 'Supplemental'].includes(v.schedule?.category)
	);

	return (
		<SafeAreaView style={styles.container}>
			<ScreenHeader
				title="Vaccine Calendar"
				onBackPress={() => navigation.goBack()}
			/>

			<ScrollView showsVerticalScrollIndicator={false}>
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
								disabled={!children.length}
							>
								<View style={styles.childInfoRow}>
									{currentChild?.avatarSource?.uri ? (
										<Image
											source={currentChild.avatarSource}
											style={styles.childAvatarImg}
										/>
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
								<Ionicons name="chevron-down" size={20} color="#7f8c8d" />
							</TouchableOpacity>
						)}
						{childrenError ? (
							<ErrorState
								message={childrenError}
								fullWidth
							/>
						) : null}
					</View>

				{/* Vaccine Plan Status */}
				{loadingVaccines && (
					<View style={styles.planBannerWrapper}>
						<View style={styles.planBannerCard}>
							<ActivityIndicator color="#667eea" style={{ marginRight: 10 }} />
							<View style={{ flex: 1 }}>
								<Text style={styles.planBannerTitle}>Loading vaccine plan</Text>
							</View>
						</View>
					</View>
				)}

				{!loadingVaccines && vaccinesError ? (
					<View style={styles.planBannerWrapper}>
						<View style={styles.planBannerCard}>
							<Ionicons
								name="warning-outline"
								size={18}
								color="#e74c3c"
								style={{ marginRight: 10 }}
							/>
							<View style={{ flex: 1 }}>
								<Text style={styles.planBannerTitle}>{vaccinesError}</Text>
							</View>
						</View>
					</View>
				) : null}

				{!loadingVaccines && !vaccinesError && !vaccines.length ? (
					<View style={styles.planBannerWrapper}>
						<View style={styles.planBannerCard}>
							<Ionicons
								name="analytics-outline"
								size={18}
								color="#667eea"
								style={{ marginRight: 10 }}
							/>
							<View style={{ flex: 1 }}>
								<Text style={styles.planBannerTitle}>No vaccine information found yet</Text>
							</View>
						</View>
					</View>
				) : null}

				{/* Core vaccines - most required */}
				{coreVaccines.length > 0 && (
					<View style={styles.categorySection}>
						<Text style={styles.categoryTitle}>Most required vaccines (Core)</Text>
						<Text style={styles.categorySubtitle}>
							These core vaccines are strongly recommended to protect your child from serious illnesses.
						</Text>
						{coreVaccines.map(renderVaccineCard)}
					</View>
				)}

				{/* Optional vaccines */}
				{optionalVaccines.length > 0 && (
					<View style={styles.categorySection}>
						<Text style={styles.categoryTitle}>Optional vaccines</Text>
						{optionalVaccines.map(renderVaccineCard)}
					</View>
				)}

				{/* Regional vaccines */}
				{regionalVaccines.length > 0 && (
					<View style={styles.categorySection}>
						<Text style={styles.categoryTitle}>Regional vaccines</Text>
						{regionalVaccines.map(renderVaccineCard)}
					</View>
				)}

				{/* Supplemental vaccines */}
				{supplementalVaccines.length > 0 && (
					<View style={styles.categorySection}>
						<Text style={styles.categoryTitle}>Supplemental vaccines</Text>
						{supplementalVaccines.map(renderVaccineCard)}
					</View>
				)}

				{/* Other vaccines (uncategorized) */}
				{otherVaccines.length > 0 && (
					<View style={styles.categorySection}>
						<Text style={styles.categoryTitle}>Other vaccines</Text>
						{otherVaccines.map(renderVaccineCard)}
					</View>
				)}
			</ScrollView>

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
												setCurrentChildIndex(idx);
												await storage.saveSelectedChildId(child.id);
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
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: 16,
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
	errorText: {
		marginTop: 8,
		fontSize: 12,
		color: '#d93025',
	},
	planBannerWrapper: {
		paddingHorizontal: 20,
		marginTop: 24,
	},
	planBannerCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 16,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderWidth: 1,
		borderColor: '#eef0ff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	planBannerTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#2c3e50',
	},
	categorySection: {
		paddingHorizontal: 20,
		marginTop: 24,
		marginBottom: 8,
	},
	categoryTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: 4,
	},
	categorySubtitle: {
		fontSize: 13,
		color: '#7f8c8d',
		marginBottom: 12,
	},
	vaccineCard: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#f1f3f4',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 1,
	},
	vaccineHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	categoryIconCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	vaccineName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#2c3e50',
	},
	vaccineDisease: {
		fontSize: 13,
		color: '#7f8c8d',
		marginTop: 2,
	},
	vaccineMeta: {
		fontSize: 13,
		color: '#7f8c8d',
		marginTop: 4,
	},
	vaccineDoses: {
		fontSize: 13,
		color: '#34495e',
		marginTop: 4,
	},
	statusBadge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	completedContainer: {
		backgroundColor: 'rgba(16, 172, 132, 0.12)',
	},
	completedText: {
		color: '#10ac84',
		fontSize: 12,
		fontWeight: '700',
	},
	missedContainer: {
		backgroundColor: 'rgba(231, 76, 60, 0.12)',
	},
	missedText: {
		color: '#e74c3c',
		fontSize: 12,
		fontWeight: '700',
	},
	pendingContainer: {
		backgroundColor: 'rgba(241, 196, 15, 0.12)',
	},
	pendingText: {
		color: '#f39c12',
		fontSize: 12,
		fontWeight: '700',
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
});

export default VaccinePlannerScreen;
