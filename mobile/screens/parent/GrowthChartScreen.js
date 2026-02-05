import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Dimensions,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Image,
	Platform,
	ActivityIndicator,
	Modal,
	Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { predictionsService } from '../../services/predictionsService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width } = Dimensions.get('window');

const GrowthChartScreen = ({ route, navigation }) => {
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
	const [activeChart, setActiveChart] = useState('percentile'); // 'weight' | 'height' | 'bmi' | 'percentile'
	const [trendData, setTrendData] = useState([]);
	const [loadingTrend, setLoadingTrend] = useState(false);
	const [trendError, setTrendError] = useState('');
	const [showChildSelector, setShowChildSelector] = useState(false);
	const [showChildOverlay, setShowChildOverlay] = useState(false);
	const sheetAnim = useRef(new Animated.Value(0)).current;

	const chartConfig = {
		backgroundColor: '#ffffff',
		backgroundGradientFrom: '#f2f3ff',
		backgroundGradientTo: '#ffffff',
		decimalPlaces: 1,
		color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
		labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
		style: {
			borderRadius: 16,
		},
		propsForDots: {
			r: '5',
			strokeWidth: '2',
			stroke: '#667eea',
		},
		propsForBackgroundLines: {
			stroke: 'rgba(255,255,255,0.4)',
		},
	};

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
		const loadTrend = async () => {
			if (!selectedChildId) {
				setTrendData([]);
				return;
			}
			if (loadingChildren || switchingChild) return;

			try {
				setLoadingTrend(true);
				setTrendError('');
				const data = await predictionsService.getTrendForChild(selectedChildId);
				const list = Array.isArray(data) ? data : data?.trend || [];
				const sorted = [...list].sort((a, b) => {
					const da = new Date(a.created_at || a.date);
					const db = new Date(b.created_at || b.date);
					return da - db;
				});
				setTrendData(sorted);
			} catch (err) {
				setTrendData([]);
				setTrendError('Unable to load growth trend. Please try again.');
			} finally {
				setLoadingTrend(false);
			}
		};

		loadTrend();
	}, [selectedChildId, loadingChildren, switchingChild]);

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

	const renderTrendBanner = () => {
		if (loadingTrend) {
			return (
				<View style={styles.trendBannerWrapper}>
					<View style={styles.trendBannerCard}>
						<View style={styles.trendBannerIconCircle}>
							<ActivityIndicator color="#667eea" />
						</View>
						<View style={styles.trendBannerText}>
							<Text style={styles.trendBannerTitle}>Loading growth data</Text>
						</View>
					</View>
				</View>
			);
		}

		if (trendError) {
			return (
				<View style={styles.trendBannerWrapper}>
					<View style={styles.trendBannerCard}>
						<View style={styles.trendBannerIconCircle}>
							<Ionicons name="warning-outline" size={20} color="#e74c3c" />
						</View>
						<View style={styles.trendBannerText}>
							<Text style={styles.trendBannerTitle}>Problem loading growth</Text>
						</View>
					</View>
				</View>
			);
		}

		if (!trendData.length) {
			return (
				<View style={styles.trendBannerWrapper}>
					<View style={styles.trendBannerCard}>
						<View style={styles.trendBannerIconCircle}>
							<Ionicons name="analytics-outline" size={20} color="#667eea" />
						</View>
						<View style={styles.trendBannerText}>
							<Text style={styles.trendBannerTitle}>No growth data yet</Text>
						</View>
					</View>
				</View>
			);
		}

		return null;
	};

	const renderChart = () => {
		let legendLabel = '';
		let ySuffix = '';
		let lineColorRGB = '52, 152, 219'; // default weight color
		const points = trendData
			.map((point) => {
				const d = new Date(point.created_at || point.date);
				if (Number.isNaN(d.getTime())) return null;
				const label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

				let rawValue = null;
				switch (activeChart) {
					case 'height':
						legendLabel = 'Height (cm)';
						ySuffix = ' cm';
						lineColorRGB = '230, 126, 34'; // orange
						rawValue = point.height_cm;
						break;
					case 'bmi':
						legendLabel = 'BMI';
						ySuffix = '';
						lineColorRGB = '155, 89, 182'; // purple
						rawValue = point.bmi;
						break;
					case 'percentile':
						legendLabel = 'Growth Percentile';
						ySuffix = '%';
						lineColorRGB = '46, 204, 113'; // green
						rawValue = point.growth_percentile;
						break;
					case 'weight':
					default:
						legendLabel = 'Weight (kg)';
						ySuffix = ' kg';
						lineColorRGB = '52, 152, 219'; // blue
						rawValue = point.weight_kg;
						break;
				}

				const value = Number(rawValue);
				if (rawValue == null || Number.isNaN(value)) return null;
				return { label, value };
			})
			.filter(Boolean);

		if (!points.length) {
			return null;
		}

		const rawLabels = points.map((p) => p.label);
		const safeValues = points.map((p) => p.value);
		let labels = rawLabels;

		// If there are many points, only show some labels to keep the x-axis readable
		if (rawLabels.length > 8) {
			const step = Math.ceil(rawLabels.length / 6); // aim for ~6 visible labels
			labels = rawLabels.map((label, index) => (index % step === 0 ? label : ''));
		}

		const data = {
			labels,
			datasets: [
				{
					data: safeValues,
					color: (opacity = 1) => `rgba(${lineColorRGB}, ${opacity})`,
					strokeWidth: 2,
				},
			],
			legend: [legendLabel],
		};

		// Give each point some horizontal space; allow horizontal scroll when there is a lot of data
		const minPerPoint = 40; // px per data point
		const chartWidth = Math.max(width - 80, Math.max(200, points.length * minPerPoint));

		return (
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingRight: 8 }}
			>
				<LineChart
					data={data}
					width={chartWidth}
					height={250}
					yAxisSuffix={ySuffix}
					chartConfig={chartConfig}
					fromZero
					segments={4}
					bezier
					style={styles.chart}
				/>
			</ScrollView>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScreenHeader
				title="Growth Charts"
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

				{/* Growth Trend Status Banner */}
				{renderTrendBanner()}

				{/* Chart Section */}
				{!loadingTrend && !trendError && trendData.length > 0 && (
					<View style={styles.chartContainer}>
						<LinearGradient
							colors={['#667eea', '#764ba2']}
							style={styles.chartCard}
						>
							<View style={styles.chartHeader}>
								<Text style={styles.chartTitle}>Child's Growth Progress</Text>
								<View style={styles.toggleButtons}>
									<TouchableOpacity
										style={[
											styles.toggleButton,
											activeChart === 'percentile' && styles.activeButton,
										]}
										onPress={() => setActiveChart('percentile')}
									>
										<Text
											style={[
												styles.toggleText,
												activeChart === 'percentile' && styles.activeText,
											]}
										>
											Percentile
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.toggleButton,
											activeChart === 'weight' && styles.activeButton,
										]}
										onPress={() => setActiveChart('weight')}
									>
										<Text
											style={[
												styles.toggleText,
												activeChart === 'weight' && styles.activeText,
											]}
										>
											Weight
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.toggleButton,
											activeChart === 'height' && styles.activeButton,
										]}
										onPress={() => setActiveChart('height')}
									>
										<Text
											style={[
												styles.toggleText,
												activeChart === 'height' && styles.activeText,
											]}
										>
											Height
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.toggleButton,
											activeChart === 'bmi' && styles.activeButton,
										]}
										onPress={() => setActiveChart('bmi')}
									>
										<Text
											style={[
												styles.toggleText,
												activeChart === 'bmi' && styles.activeText,
											]}
										>
											BMI
										</Text>
									</TouchableOpacity>
								</View>
							</View>
							{renderChart()}
						</LinearGradient>
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
}

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
	chartContainer: {
		margin: 24,
  },
  chartCard: {
    borderRadius: 24,
    padding: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeButton: {
    backgroundColor: '#fff',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  activeText: {
    color: '#667eea',
  	},
	chart: {
		borderRadius: 16,
		marginTop: 8,
	},
	trendBannerWrapper: {
		paddingHorizontal: 20,
		marginTop: 24,
	},
	trendBannerCard: {
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
	trendBannerIconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#eef0ff',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	trendBannerText: {
		flex: 1,
	},
	trendBannerTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#2c3e50',
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

export default GrowthChartScreen;
