import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Dimensions,
	TouchableOpacity,
	Image,
	Modal,
	ActivityIndicator,
	Animated,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelectedChild } from '../../contexts/SelectedChildContext';
import { predictionsService } from '../../services/predictionsService';

const { width } = Dimensions.get('window');

const GrowthChartScreen = ({ navigation }) => {
	const {
		children,
		selectedChild,
		selectedChildId,
		loadingChildren,
		switchingChild,
		selectChild,
	} = useSelectedChild();

	const [activeChart, setActiveChart] = useState('percentile');
	const [trendData, setTrendData] = useState([]);
	const [loadingTrend, setLoadingTrend] = useState(false);
	const [trendError, setTrendError] = useState('');
	const [showChildSelector, setShowChildSelector] = useState(false);

	// Core Animations
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;

	// Specific animation for Chart switching
	const chartOpacity = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
			Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
		]).start();
	}, []);

	// Trigger chart animation on activeChart change
	useEffect(() => {
		chartOpacity.setValue(0);
		Animated.timing(chartOpacity, {
			toValue: 1,
			duration: 500,
			useNativeDriver: true,
		}).start();
	}, [activeChart]);

	// Data Loading
	useEffect(() => {
		const loadTrend = async () => {
			if (!selectedChildId) { setTrendData([]); return; }
			if (loadingChildren || switchingChild) return;

			try {
				setLoadingTrend(true);
				setTrendError('');
				const data = await predictionsService.getTrendForChild(selectedChildId);
				const list = Array.isArray(data) ? data : data?.trend || [];
				const sorted = [...list].sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
				setTrendData(sorted);
			} catch (err) {
				setTrendData([]);
				setTrendError('Unable to load growth data.');
			} finally {
				setLoadingTrend(false);
			}
		};
		loadTrend();
	}, [selectedChildId, loadingChildren, switchingChild]);

	// Helpers
	const getTheme = () => {
		switch (activeChart) {
			case 'weight': return { primary: '#4F46E5', secondary: '#818CF8', label: 'Weight', suffix: 'kg', icon: 'scale-bathroom', dotIcon: 'balloon' };
			case 'height': return { primary: '#059669', secondary: '#34D399', label: 'Height', suffix: 'cm', icon: 'human-male-height', dotIcon: 'pine-tree' };
			case 'bmi': return { primary: '#7C3AED', secondary: '#A78BFA', label: 'BMI', suffix: '', icon: 'calculator', dotIcon: 'heart' };
			default: return { primary: '#F59E0B', secondary: '#FCD34D', label: 'Percentile', suffix: '%', icon: 'chart-line', dotIcon: 'star' };
		}
	};

	const theme = getTheme();

	// Get Latest Value for Big Stat
	const latestValue = useMemo(() => {
		if (!trendData.length) return '--';
		const latest = trendData[trendData.length - 1];
		if (activeChart === 'weight') return latest.weight_kg;
		if (activeChart === 'height') return latest.height_cm;
		if (activeChart === 'bmi') return latest.bmi;
		return latest.growth_percentile;
	}, [trendData, activeChart]);

	const renderChart = () => {
		if (loadingTrend) return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />;
		if (trendError || !trendData.length) return (
			<View style={styles.emptyState}>
				<Text style={styles.emptyText}>{trendError || "No growth data recorded yet."}</Text>
			</View>
		);

		const points = trendData.map(p => {
			const d = new Date(p.created_at || p.date);
			const label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
			let val = 0;
			if (activeChart === 'weight') val = p.weight_kg;
			if (activeChart === 'height') val = p.height_cm;
			if (activeChart === 'bmi') val = p.bmi;
			if (activeChart === 'percentile') val = p.growth_percentile;
			return { label, value: Number(val) || 0 };
		}).filter(p => !isNaN(p.value));

		// Decimate labels
		const labels = points.map(p => p.label);
		const visibleLabels = labels.map((l, i) => (i % Math.max(1, Math.ceil(labels.length / 5)) === 0 ? l : ''));

		return (
			<Animated.View style={{ opacity: chartOpacity }}>
				<LineChart
					data={{ labels: visibleLabels, datasets: [{ data: points.map(p => p.value) }] }}
					width={width - 80} // Card Width with padding
					height={220}
					yAxisSuffix={theme.suffix}
					chartConfig={{
						backgroundColor: '#FFF',
						backgroundGradientFrom: '#FFF',
						backgroundGradientTo: '#FFF',
						decimalPlaces: 1,
						color: (opacity = 1) => theme.primary,
						labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
						propsForDots: { r: "5", strokeWidth: "2", stroke: theme.secondary },
						propsForBackgroundLines: { strokeDasharray: "", stroke: "#F3F4F6" }
					}}
					bezier
					style={{ marginVertical: 8, borderRadius: 16 }}
					withInnerLines={true}
					withOuterLines={false}
					renderDotContent={({ x, y, index }) => (
						<View key={index} style={{ position: 'absolute', top: y - 12, left: x - 12 }}>
							<MaterialCommunityIcons name={theme.dotIcon} size={24} color={theme.primary} />
						</View>
					)}
				/>
			</Animated.View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* FIXED BACKGROUND DECORATION */}
			<View style={styles.bgDecorations} pointerEvents="none">
				<MaterialCommunityIcons name="ruler" size={350} color="rgba(0,0,0,0.06)" style={styles.bgRuler} />
				<MaterialCommunityIcons name="white-balance-sunny" size={120} color="rgba(251, 191, 36, 0.15)" style={styles.bgSun} />
				<MaterialCommunityIcons name="foot-print" size={80} color="rgba(59, 130, 246, 0.08)" style={styles.bgFoot1} />
				<MaterialCommunityIcons name="foot-print" size={60} color="rgba(16, 185, 129, 0.08)" style={styles.bgFoot2} />
				<MaterialCommunityIcons name="duck" size={70} color="rgba(245, 158, 11, 0.1)" style={styles.bgDuck} />
				<MaterialCommunityIcons name="balloon" size={90} color="rgba(239, 68, 68, 0.08)" style={styles.bgBalloon} />
				<MaterialCommunityIcons name="star-four-points" size={50} color="rgba(255,255,255, 0.5)" style={styles.bgStar1} />
			</View>

			{/* HEADER */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
					<Ionicons name="arrow-back" size={24} color="#1F2937" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Growth Chart</Text>
				<TouchableOpacity style={styles.childBtn} onPress={() => setShowChildSelector(true)}>
					{selectedChild?.avatar ? (
						<Image source={{ uri: selectedChild.avatar }} style={styles.avatarSmall} />
					) : (
						<View style={[styles.avatarSmall, { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }]}>
							<Text style={{ color: '#FFF', fontWeight: 'bold' }}>{selectedChild?.name?.[0] || '?'}</Text>
						</View>
					)}
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

				{/* TAB SELECTOR */}
				<View style={styles.segmentedControl}>
					{['percentile', 'weight', 'height', 'bmi'].map(tab => {
						const isActive = activeChart === tab;
						return (
							<TouchableOpacity
								key={tab}
								style={[styles.segmentBtn, isActive && { backgroundColor: theme.primary }]}
								onPress={() => setActiveChart(tab)}
							>
								<Text style={[styles.segmentText, isActive && { color: '#FFF' }]}>
									{tab.charAt(0).toUpperCase() + tab.slice(1)}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* MAIN CHART CARD */}
				<Animated.View style={[styles.mainCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
					<View style={styles.cardHeader}>
						<View>
							<Text style={styles.metricLabel}>Current {theme.label}</Text>
							<View style={styles.metricRow}>
								<Text style={[styles.metricValue, { color: theme.primary }]}>{latestValue}</Text>
								<Text style={styles.metricSuffix}>{theme.suffix}</Text>
							</View>
						</View>
						<View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
							<MaterialCommunityIcons name={theme.icon} size={24} color={theme.primary} />
						</View>
					</View>

					{renderChart()}

				</Animated.View>

				{/* INSIGHT CARD */}
				<Animated.View style={[styles.insightCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
					<Text style={styles.insightTitle}>Growth Update</Text>
					<Text style={styles.insightText}>
						{selectedChild?.name} is growing fast! 🚀 The current trend suggests a healthy development path. Keep monitoring monthly!
					</Text>
				</Animated.View>

			</ScrollView>

			{/* CHILD SELECTOR MODAL */}
			<Modal visible={showChildSelector} transparent animationType="fade" onRequestClose={() => setShowChildSelector(false)}>
				<TouchableOpacity style={styles.modalOverlay} onPress={() => setShowChildSelector(false)} activeOpacity={1}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Child</Text>
						{children.map(child => (
							<TouchableOpacity
								key={child.id}
								style={styles.childRow}
								onPress={() => { selectChild(child.id); setShowChildSelector(false); }}
							>
								<View style={[styles.avatarSmall, { marginRight: 12, backgroundColor: '#E5E7EB' }]}>
									{child.avatar ? <Image source={{ uri: child.avatar }} style={styles.avatarSmall} /> : null}
								</View>
								<Text style={[styles.childName, child.id === selectedChildId && { color: theme.primary, fontWeight: '700' }]}>
									{child.name}
								</Text>
								{child.id === selectedChildId && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
							</TouchableOpacity>
						))}
					</View>
				</TouchableOpacity>
			</Modal>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8FAFC',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 12,
		zIndex: 10,
		backgroundColor: '#F8FAFC', // Match bg to hide scroll over
	},
	childSelectorBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#FFF',
		marginHorizontal: 20,
		marginBottom: 16,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 2,
	},
	childSelectorName: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginLeft: 8,
	},
	avatarMini: {
		width: 24,
		height: 24,
		borderRadius: 12,
	},
	backBtn: {
		padding: 8,
		borderRadius: 12,
		backgroundColor: '#FFF',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 2,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
	},
	childBtn: {
		padding: 2,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: '#FFF',
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	avatarSmall: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
		minHeight: '100%',
	},
	// Background Artifacts - FIXED
	bgDecorations: {
		...StyleSheet.absoluteFillObject,
		zIndex: -1,
	},
	bgRuler: {
		position: 'absolute',
		right: -60,
		top: 100,
		opacity: 0.5, // Brighter
		transform: [{ rotate: '90deg' }]
	},
	bgSun: {
		position: 'absolute',
		left: -20,
		top: -20,
	},
	bgFoot1: {
		position: 'absolute',
		bottom: 150,
		left: 40,
		transform: [{ rotate: '-15deg' }]
	},
	bgFoot2: {
		position: 'absolute',
		bottom: 250,
		right: 30,
		transform: [{ rotate: '25deg' }]
	},
	bgDuck: {
		position: 'absolute',
		top: 180,
		left: -10,
		opacity: 0.6,
	},
	bgBalloon: {
		position: 'absolute',
		top: 300,
		right: -20,
		transform: [{ rotate: '15deg' }]
	},
	bgStar1: {
		position: 'absolute',
		bottom: 50,
		right: 100,
	},

	// Segmented Control
	segmentedControl: {
		flexDirection: 'row',
		backgroundColor: '#FFF',
		padding: 4,
		borderRadius: 16,
		marginBottom: 24,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 2,
	},
	segmentBtn: {
		flex: 1,
		paddingVertical: 10,
		alignItems: 'center',
		borderRadius: 12,
	},
	segmentText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#6B7280',
	},

	// Main Card
	mainCard: {
		backgroundColor: '#FFF',
		borderRadius: 24,
		padding: 20,
		marginBottom: 24,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 15,
		elevation: 8, // High premium shadow
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 16,
	},
	metricLabel: {
		fontSize: 14,
		color: '#6B7280',
		fontWeight: '500',
		marginBottom: 4,
	},
	metricRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	metricValue: {
		fontSize: 32,
		fontWeight: '800',
		color: '#111827',
	},
	metricSuffix: {
		fontSize: 16,
		color: '#9CA3AF',
		marginLeft: 4,
		fontWeight: '600',
	},
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyState: {
		height: 220,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		color: '#9CA3AF',
		fontStyle: 'italic',
	},

	// Insight
	insightCard: {
		backgroundColor: '#FFF',
		padding: 20,
		borderRadius: 20,
		borderLeftWidth: 4,
		borderLeftColor: '#F59E0B',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 3,
		marginBottom: 40,
	},
	insightTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 8,
	},
	insightText: {
		fontSize: 14,
		color: '#4B5563',
		lineHeight: 22,
	},

	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
		padding: 24,
	},
	modalContent: {
		backgroundColor: '#FFF',
		borderRadius: 24,
		padding: 24,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 10,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 16,
		color: '#111827',
	},
	childRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	childName: {
		fontSize: 16,
		color: '#374151',
		flex: 1,
	},
});

export default GrowthChartScreen;
