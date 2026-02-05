import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { predictionsService } from '../../services/predictionsService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

// --------------------------------------------------------------------------
//                               HELPERS
// --------------------------------------------------------------------------

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getFeedingLabel = (type, ageGroup) => {
  if (type === null || type === undefined) return 'N/A';
  if (ageGroup === 'INFANT') {
    const map = { 0: 'Breastmilk', 1: 'Formula', 2: 'Mixed' };
    return map[type] || 'N/A';
  } else if (ageGroup === 'TODDLER') {
    const map = { 0: 'Family Food', 1: 'Mixed', 2: 'Milk' };
    return map[type] || 'N/A';
  }
  return type === 0 ? 'Family Food' : 'Mixed';
};

const getVaccineLabel = (status) => {
  if (status === null || status === undefined) return 'N/A';
  const map = { 0: 'Up to Date', 1: 'Partial', 2: 'Delayed' };
  return map[status] || 'N/A';
};

const getNutritionLabel = (flag) => {
  if (flag === null || flag === undefined) return 'NA';
  return flag === 0 ? 'Normal' : 'Risk';
};

// Generate PDF HTML (Enhanced Design with Watermark)
const generatePDFHTML = (child, report) => {
  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { margin: 0; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; background: #fff; margin: 0; padding: 40px; position: relative; }
          
          /* WATERMARK */
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(99, 102, 241, 0.04);
            font-weight: 900;
            z-index: -1;
            white-space: nowrap;
            letter-spacing: 10px;
          }

          .header-bg {
             background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);
             height: 120px;
             position: absolute;
             top: 0; left: 0; right: 0;
             z-index: -1;
          }
          
          .header-content {
             margin-top: 20px;
             margin-bottom: 40px;
             padding: 20px;
             background: #fff;
             border-radius: 16px;
             box-shadow: 0 4px 15px rgba(0,0,0,0.05);
             text-align: center;
             border-bottom: 3px solid #6366f1;
          }

          .title { font-size: 26px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 14px; color: #64748B; margin-top: 5px; font-weight: 500; }
          
          .section-label { 
             font-size: 14px; 
             font-weight: 700; 
             color: #4F46E5; 
             text-transform: uppercase; 
             margin-bottom: 15px; 
             letter-spacing: 0.5px;
             border-left: 4px solid #4F46E5;
             padding-left: 10px;
          }

          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          
          .card { 
            background: #fff; 
            border-radius: 12px; 
            padding: 20px; 
            border: 1px solid #e2e8f0; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            page-break-inside: avoid;
          }
          
          .card-title { font-size: 16px; font-weight: bold; color: #334155; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px dashed #cbd5e1; }
          
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; align-items: center; }
          .label { color: #64748B; font-weight: 500; }
          .value { font-weight: 700; color: #0F172A; background: #F8FAFC; padding: 4px 8px; border-radius: 6px; }
          
          .risk-high { background: #fee2e2; color: #dc2626; }
          .risk-med { background: #fef3c7; color: #d97706; }
          .risk-low { background: #dcfce7; color: #16a34a; }

          .highlight { color: #4F46E5; }

          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">SANRAKSHYA</div>
        <div class="header-bg"></div>
        
        <div class="header-content">
          <div class="title">AI Health Assessment</div>
          <div class="subtitle">Child: <span class="highlight">${child?.name}</span> • Generated: ${formatDate(report?.created_at)}</div>
        </div>

        <div class="section-label">Detailed Analysis</div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Physical Metrics</div>
            <div class="row"><span class="label">Weight</span><span class="value">${report?.weight_kg ?? '--'} kg</span></div>
            <div class="row"><span class="label">Height</span><span class="value">${report?.height_cm ?? '--'} cm</span></div>
            <div class="row"><span class="label">BMI</span><span class="value">${report?.bmi ? report.bmi.toFixed(1) : '--'}</span></div>
            <div class="row"><span class="label">MUAC</span><span class="value">${report?.muac_cm ?? '--'} cm</span></div>
          </div>
          <div class="card">
            <div class="card-title">Growth Analysis</div>
            <div class="row"><span class="label">Weight Status</span><span class="value">${report?.weight_zscore_flag || 'N/A'}</span></div>
            <div class="row"><span class="label">Height Status</span><span class="value">${report?.height_zscore_flag || 'N/A'}</span></div>
            <div class="row"><span class="label">Percentile</span><span class="value highlight">${report?.growth_percentile ? Math.round(report.growth_percentile * 100) + 'th' : '--'}</span></div>
          </div>
        </div>

        <div class="grid">
           <div class="card">
            <div class="card-title">Risk Assessment</div>
            <div class="row"><span class="label">Fever Probability</span><span class="value ${report?.prob_fever > 0.5 ? 'risk-high' : 'risk-low'}">${report?.prob_fever ? Math.round(report.prob_fever * 100) + '%' : 'Low'}</span></div>
            <div class="row"><span class="label">Cold/Flu Probability</span><span class="value ${report?.prob_cold > 0.5 ? 'risk-high' : 'risk-low'}">${report?.prob_cold ? Math.round(report.prob_cold * 100) + '%' : 'Low'}</span></div>
            <div class="row"><span class="label">Diarrhea Probability</span><span class="value ${report?.prob_diarrhea > 0.5 ? 'risk-high' : 'risk-low'}">${report?.prob_diarrhea ? Math.round(report.prob_diarrhea * 100) + '%' : 'Low'}</span></div>
          </div>
          <div class="card">
            <div class="card-title">Lifestyle & Habits</div>
            <div class="row"><span class="label">Sleep (Daily)</span><span class="value">${report?.sleep_hours ?? '--'} hrs</span></div>
            <div class="row"><span class="label">Diet Type</span><span class="value">${getFeedingLabel(report?.feeding_type, report?.age_group)}</span></div>
            <div class="row"><span class="label">Vaccination</span><span class="value ${report?.vaccination_status !== 0 ? 'risk-med' : 'risk-low'}">${getVaccineLabel(report?.vaccination_status)}</span></div>
            <div class="row"><span class="label">Nutrition</span><span class="value ${report?.nutrition_flag === 1 ? 'risk-high' : 'risk-low'}">${getNutritionLabel(report?.nutrition_flag)}</span></div>
          </div>
        </div>

        ${(report?.milestone_sit_delay_prob > 0.3 || report?.milestones_walking_delay_prob > 0.3) ? `
          <div class="card" style="border: 1px solid #f97316; background: #fff7ed;">
             <div class="card-title" style="color: #c2410c;">Milestone Delays Detected</div>
             ${report?.milestone_sit_delay_prob > 0.3 ? `<div class="row"><span class="label">Sitting Delay Risk</span><span class="value risk-med">${Math.round(report.milestone_sit_delay_prob * 100)}%</span></div>` : ''}
              ${report?.milestones_walking_delay_prob > 0.3 ? `<div class="row"><span class="label">Walking Delay Risk</span><span class="value risk-med">${Math.round(report.milestones_walking_delay_prob * 100)}%</span></div>` : ''}
          </div>
        ` : ''}

        <div class="footer">
          SANRAKSHYA AI HEALTH ALGORITHM • NOT A MEDICAL DIAGNOSIS • CONSULT A PEDIATRICIAN
        </div>
      </body>
    </html>
  `;
};


// --------------------------------------------------------------------------
//                               COMPONENTS
// --------------------------------------------------------------------------

const MetricCard = ({ label, value, unit, icon, color, subValue }) => (
  // ... existing code ...
  <View style={[styles.metricCard]}>
    <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit && <Text style={styles.metricUnit}>{unit}</Text>}
      </View>
      {subValue && (
        <View style={styles.metricBadge}>
          <Text style={[styles.metricSub, { color }]}>{subValue}</Text>
        </View>
      )}
    </View>
  </View>
);

const RiskGauge = ({ label, probability, icon }) => {
  // ... existing code ...
  const isHigh = probability > 0.5;
  const isMed = probability > 0.2 && probability <= 0.5;

  // Color logic
  let color = '#10B981'; // Green
  let status = 'Low Risk';
  if (isHigh) { color = '#EF4444'; status = 'High Risk'; }
  else if (isMed) { color = '#F59E0B'; status = 'Monitor'; }

  const widthPercent = Math.max(10, probability * 100) + '%';

  return (
    <View style={styles.riskRow}>
      <View style={[styles.riskIconBox, { backgroundColor: color + '15' }]}>
        <FontAwesome5 name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={styles.riskLabel}>{label}</Text>
          <Text style={[styles.riskValue, { color }]}>{Math.round(probability * 100)}%</Text>
        </View>
        <View style={styles.riskTrack}>
          <View style={[styles.riskFill, { width: widthPercent, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
};


const ZScoreBar = ({ label, status, value }) => {
  // ... existing code ...
  let position = '50%';
  let color = '#10B981';
  let shortStatus = 'Normal';

  if (status?.toLowerCase().includes('low')) { position = '20%'; color = '#F59E0B'; shortStatus = 'Low'; }
  else if (status?.toLowerCase().includes('high')) { position = '80%'; color = '#3B82F6'; shortStatus = 'High'; }
  else if (status?.toLowerCase().includes('normal')) { position = '50%'; color = '#10B981'; shortStatus = 'Ok'; }

  return (
    <View style={styles.zRow}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={styles.zLabel}>{label}</Text>
        <Text style={[styles.zValue, { color }]}>{status ? status.split('(')[0] : 'N/A'}</Text>
      </View>
      <View style={styles.zTrack}>
        <View style={[styles.zPill, { left: position, backgroundColor: color }]} />
        <View style={[styles.zTick, { left: '50%' }]} />
      </View>
      <View style={styles.zLabels}>
        <Text style={styles.zAxis}>Low</Text>
        <Text style={styles.zAxis}>Normal</Text>
        <Text style={styles.zAxis}>High</Text>
      </View>
    </View>
  );
};


const AIHealthReportsScreen = ({ navigation }) => {
  const { children, selectedChild, selectedChildId, selectChild } = useSelectedChild();
  const currentChild = selectedChild;

  // -- State --
  const [latestReport, setLatestReport] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingInfo, setMissingInfo] = useState([]);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Helper: Map backend field names to user-friendly labels and correct ADD screens
  const getMissingInfoDetails = (field) => {
    const mapping = {
      // Physical measurements -> AddMeasurement screen
      'weight_kg': { label: 'Weight Measurement', screen: 'AddMeasurement', icon: 'scale' },
      'height_cm': { label: 'Height Measurement', screen: 'AddMeasurement', icon: 'resize' },
      'muac_cm': { label: 'MUAC Measurement', screen: 'AddMeasurement', icon: 'ellipse' },

      // Meal/Nutrition logs -> AddMeals screen
      'meal_logs_last_7_days': { label: 'Recent Meal Logs', screen: 'AddMeals', icon: 'restaurant' },
      'feeding_type': { label: 'Feeding/Diet Type', screen: 'AddMeals', icon: 'nutrition' },
      'feeding_frequency': { label: 'Feeding Frequency', screen: 'AddMeals', icon: 'time' },

      // Sleep -> AddMeasurement (sleep is part of daily measurements)
      'sleep_hours': { label: 'Sleep Hours', screen: 'AddMeasurement', icon: 'moon' },
      'anthropometry.avg_sleep_hours_per_day': { label: 'Average Sleep Hours', screen: 'AddMeasurement', icon: 'moon' },

      // Vaccination -> AddVaccination screen
      'vaccination_status': { label: 'Vaccination Records', screen: 'AddVaccination', icon: 'shield-checkmark' },
      'vaccination.core_status': { label: 'Core Vaccination Status', screen: 'AddVaccination', icon: 'shield-checkmark' },

      // Illness logs -> AddSymptoms screen
      'illness_logs_last_90_days': { label: 'Recent Illness Logs', screen: 'AddSymptoms', icon: 'medkit' },
      'illness_fever': { label: 'Fever History', screen: 'AddSymptoms', icon: 'thermometer' },
      'illness_cold': { label: 'Cold/Flu History', screen: 'AddSymptoms', icon: 'snow' },
      'illness_diarrhea': { label: 'Diarrhea History', screen: 'AddSymptoms', icon: 'water' },

      // Milestones -> AddMilestone screen
      'milestones.current_group_status': { label: 'Milestone Check', screen: 'AddMilestone', icon: 'flag' },
    };

    // Check for exact match first
    if (mapping[field]) return mapping[field];

    // Handle partial matches (e.g., "anthropometry.xyz" -> try "xyz")
    const parts = field.split('.');
    if (parts.length > 1 && mapping[parts[parts.length - 1]]) {
      return mapping[parts[parts.length - 1]];
    }

    // Default fallback
    return {
      label: field.replace(/_/g, ' ').replace(/\./g, ' - ').replace(/\b\w/g, l => l.toUpperCase()),
      screen: 'ParentHome',
      icon: 'help-circle'
    };
  };

  // -- Data Loading --
  const loadLatestReport = async () => {
    if (!selectedChildId) return;
    try {
      if (!refreshing) setLoading(true);
      const data = await predictionsService.getLatestReportForChild(selectedChildId);
      setLatestReport(data || null);
      if (data) Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (err) {
      setLatestReport(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHistory = async () => {
    setShowHistoryModal(true);
    try {
      const data = await predictionsService.getReportsForChild(selectedChildId);
      setAllReports(Array.isArray(data) ? data : data?.reports || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => { loadLatestReport(); }, [selectedChildId]);
  const onRefresh = () => { setRefreshing(true); loadLatestReport(); };

  // Auto-generate report when returning from data entry screen
  useFocusEffect(
    React.useCallback(() => {
      if (pendingGenerate && currentChild?.id) {
        setPendingGenerate(false);
        // Delay slightly to let screen fully mount
        setTimeout(() => handleGenerateReport(), 500);
      }
    }, [pendingGenerate, currentChild?.id])
  );

  // Navigate to add missing data and set flag for auto-generate on return
  const navigateToAddData = (screen, label) => {
    setShowMissingModal(false);
    setPendingGenerate(true);
    navigation.navigate(screen, { returnTo: 'AIHealthReports' });
  };

  const handleGenerateReport = async () => {
    if (!currentChild?.id) return Alert.alert('Select Child', 'Please select a child first.');
    setIsGenerating(true);
    try {
      const resp = await predictionsService.requestReportForChild(currentChild.id);
      // Success case - check if report was created or if there's still missing data
      const missing = resp?.required_missing || resp?.missing_inputs || [];
      if (missing.length > 0) {
        setMissingInfo(missing);
        setShowMissingModal(true);
        return;
      }
      Alert.alert('Success', 'Report generated!');
      await loadLatestReport();
    } catch (err) {
      // Parse error response - handle multiple possible formats (apiClient uses err.data)
      const responseData = err?.data || err?.response?.data;
      let missingFields = [];

      // Format 1: { detail: { required_missing: [...] } }
      if (responseData?.detail?.required_missing) {
        missingFields = responseData.detail.required_missing;
      }
      // Format 2: { required_missing: [...] }
      else if (responseData?.required_missing) {
        missingFields = responseData.required_missing;
      }
      // Format 3: { detail: { missing_inputs: [...] } }
      else if (responseData?.detail?.missing_inputs) {
        missingFields = responseData.detail.missing_inputs;
      }
      // Format 4: Array directly
      else if (Array.isArray(responseData?.detail)) {
        missingFields = responseData.detail;
      }

      if (missingFields.length > 0) {
        setMissingInfo(missingFields);
        setShowMissingModal(true);
      } else {
        // Show actual error message if available
        const errorMsg = responseData?.detail?.message || responseData?.detail || 'Could not generate report. Please add health data first.';
        Alert.alert('Error', typeof errorMsg === 'string' ? errorMsg : 'Could not generate report.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!latestReport) return;
    setIsDownloading(true);
    try {
      const html = generatePDFHTML(currentChild, latestReport);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Could not generate PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!currentChild) return <View style={styles.center}><ActivityIndicator color="#4F46E5" /></View>;
  const r = latestReport;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={['#F8FAFC', '#E0E7FF']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          {/* Enhanced Child Selector */}
          <TouchableOpacity style={styles.childSelectBtn} onPress={() => setShowChildSelector(true)}>
            <Text style={styles.childSelectText}>{currentChild.name}</Text>
            <Ionicons name="caret-down" size={14} color="#4F46E5" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleDownloadPDF} disabled={!r}>
              {isDownloading ? <ActivityIndicator size="small" color="#4F46E5" /> : <Ionicons name="share-outline" size={24} color="#4F46E5" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={loadHistory}>
              <MaterialCommunityIcons name="history" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

          {/* GENERATE HERO (Modified with prominent button) */}
          <LinearGradient colors={['#4F46E5', '#6366f1']} style={styles.heroCard}>
            <View style={styles.heroInner}>
              <View>
                <Text style={styles.heroTitle}>AI Analysis</Text>
                <Text style={styles.heroDate}>{r ? `Generated on ${formatDate(r.created_at)}` : 'No recent analysis'}</Text>
              </View>
              <MaterialCommunityIcons name="robot" size={40} color="rgba(255,255,255,0.2)" />
            </View>
            {/* Big Button Restored */}
            <TouchableOpacity style={styles.fullGenBtn} onPress={handleGenerateReport} disabled={isGenerating}>
              {isGenerating ? <ActivityIndicator color="#4F46E5" size="small" /> : (
                <Text style={styles.fullGenText}>{r ? 'Generate New Report' : 'Generate First Report'}</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {loading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
          ) : r ? (
            <Animated.View style={{ opacity: fadeAnim }}>

              {/* 1. KEY METRICS (BENTO GRID) */}
              <Text style={styles.sectionHeader}>Physical Overview</Text>
              <View style={styles.bentoGrid}>
                <MetricCard
                  label="Weight"
                  value={r.weight_kg ?? '--'}
                  unit="kg"
                  icon="scale-bathroom"
                  color="#0EA5E9"
                  subValue={r.weight_zscore_flag ? r.weight_zscore_flag.split('(')[0] : null}
                />
                <MetricCard
                  label="Height"
                  value={r.height_cm ?? '--'}
                  unit="cm"
                  icon="human-male-height"
                  color="#8B5CF6"
                  subValue={r.height_zscore_flag ? r.height_zscore_flag.split('(')[0] : null}
                />
                <MetricCard label="BMI" value={r.bmi ? r.bmi.toFixed(1) : '--'} icon="calculator" color="#F59E0B" />
                <MetricCard label="MUAC" value={r.muac_cm ?? '--'} unit="cm" icon="arm-flex" color="#EC4899" />
              </View>

              {/* 2. GROWTH ANALYSIS (VISUAL SCALES) */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="trending-up" size={20} color="#10B981" />
                  <Text style={styles.cardTitle}>Growth Trends</Text>
                </View>
                <View style={styles.cardBody}>
                  <ZScoreBar label="Weight for Age" status={r.weight_zscore_flag} />
                  <View style={styles.divider} />
                  <ZScoreBar label="Height for Age" status={r.height_zscore_flag} />

                  <View style={styles.percentileBox}>
                    <Text style={styles.percentileLabel}>Overall Growth Percentile</Text>
                    <Text style={styles.percentileValue}>{r.growth_percentile ? Math.round(r.growth_percentile * 100) : '--'}th</Text>
                  </View>
                </View>
              </View>

              {/* 3. RISK ANALYSIS (GAUGES) */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="medkit" size={20} color="#EF4444" />
                  <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Illness Probability</Text>
                </View>
                <View style={styles.cardBody}>
                  <RiskGauge label="Fever Risk" probability={r.prob_fever || 0} icon="thermometer-half" />
                  <RiskGauge label="Cold / Flu" probability={r.prob_cold || 0} icon="head-side-cough" />
                  <RiskGauge label="Infection / Diarrhea" probability={r.prob_diarrhea || 0} icon="biohazard" />
                </View>
              </View>

              {/* 4. DAILY HABITS (PILLS) */}
              <Text style={styles.sectionHeader}>Lifestyle & Habits</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitRow}>

                <View style={styles.habitCard}>
                  <Ionicons name="moon" size={24} color="#6366F1" />
                  <Text style={styles.habitValue}>{r.sleep_hours || '--'} hrs</Text>
                  <Text style={styles.habitLabel}>Sleep</Text>
                </View>

                <View style={styles.habitCard}>
                  <MaterialCommunityIcons name="baby-bottle" size={24} color="#F59E0B" />
                  <Text style={styles.habitValue}>{getFeedingLabel(r.feeding_type, r.age_group).split(' ')[0]}</Text>
                  <Text style={styles.habitLabel}>Diet</Text>
                </View>

                <View style={styles.habitCard}>
                  <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
                  <Text style={styles.habitValue}>{getVaccineLabel(r.vaccination_status)}</Text>
                  <Text style={styles.habitLabel}>Vaccine</Text>
                </View>

                <View style={styles.habitCard}>
                  <MaterialCommunityIcons name="food-apple" size={24} color={r.nutrition_flag === 1 ? '#EF4444' : '#10B981'} />
                  <Text style={[styles.habitValue, { color: r.nutrition_flag === 1 ? '#EF4444' : '#1E293B' }]}>{getNutritionLabel(r.nutrition_flag)}</Text>
                  <Text style={styles.habitLabel}>Nutrition</Text>
                </View>

              </ScrollView>

              {/* 5. MILESTONE ALERTS */}
              {(r.milestone_sit_delay_prob || r.milestones_walking_delay_prob) && (
                <View style={[styles.card, { borderColor: '#F59E0B', borderWidth: 1 }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="warning" size={20} color="#F59E0B" />
                    <Text style={[styles.cardTitle, { color: '#D97706' }]}>Milestone Delays Detected</Text>
                  </View>
                  <View style={{ padding: 15 }}>
                    {r.milestone_sit_delay_prob > 0.3 && <Text style={styles.delayText}>• Sitting Delay Risk ({Math.round(r.milestone_sit_delay_prob * 100)}%)</Text>}
                    {r.milestones_walking_delay_prob > 0.3 && <Text style={styles.delayText}>• Walking Delay Risk ({Math.round(r.milestones_walking_delay_prob * 100)}%)</Text>}
                  </View>
                </View>
              )}

            </Animated.View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>Tap refresh to generate analysis</Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* MODAL: Child Selector (Simple List) */}
        <Modal visible={showChildSelector} transparent animationType="fade">
          <TouchableOpacity style={styles.modalBg} onPress={() => setShowChildSelector(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Child</Text>
              {children.map(c => (
                <TouchableOpacity key={c.id} style={styles.childOption} onPress={() => { selectChild(c.id); setShowChildSelector(false); }}>
                  <Text style={[styles.childOptionText, c.id === currentChild.id && { color: '#4F46E5', fontWeight: 'bold' }]}>{c.name}</Text>
                  {c.id === currentChild.id && <Ionicons name="checkmark" size={20} color="#4F46E5" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* MODAL: History */}
        <Modal visible={showHistoryModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Report History</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close-circle" size={30} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {allReports.map((item, i) => (
                <TouchableOpacity key={i} style={styles.historyItem} onPress={() => { setLatestReport(item); setShowHistoryModal(false); }}>
                  <View>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                    <Text style={styles.historySub}>{item.weight_kg}kg • {getNutritionLabel(item.nutrition_flag)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

        {/* MODAL: Missing Info (Detailed) */}
        <Modal visible={showMissingModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Missing Information</Text>
                <TouchableOpacity onPress={() => setShowMissingModal(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#64748B', marginBottom: 20, textAlign: 'center' }}>To generate an AI report, please add the following data:</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {missingInfo.map((field, i) => {
                  const details = getMissingInfoDetails(field);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.missingItem}
                      onPress={() => navigateToAddData(details.screen, details.label)}
                    >
                      <View style={[styles.missingIcon, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name={details.icon} size={18} color="#4F46E5" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.missingLabel}>{details.label}</Text>
                        <Text style={styles.missingAction}>Tap to add →</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.missingHint}>After adding data, report will generate automatically</Text>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  iconBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

  // Enhanced Child Selector
  childSelectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E7FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  childSelectText: { fontSize: 14, fontWeight: '700', color: '#4F46E5', marginRight: 6 },

  content: { padding: 20 },

  heroCard: { borderRadius: 24, padding: 8, marginBottom: 24, shadowColor: '#4F46E5', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  heroInner: { backgroundColor: 'rgba(255,255,255,0.1)', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  heroDate: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  // Prominent Generate Button
  fullGenBtn: { backgroundColor: '#FFF', margin: 8, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  fullGenText: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },

  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  // BENTO GRID
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: { width: (width - 52) / 2, backgroundColor: '#FFF', padding: 16, borderRadius: 18, shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  metricIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 4 },
  metricUnit: { fontSize: 12, color: '#94A3B8', marginLeft: 2, fontWeight: '600' },
  metricBadge: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 8 },
  metricSub: { fontSize: 10, fontWeight: '700' },

  // CARDS
  card: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginLeft: 10 },
  cardBody: { padding: 20 },

  // GROWTH BARS
  zRow: { marginBottom: 16 },
  zLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  zValue: { fontSize: 13, fontWeight: '700' },
  zTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  zPill: { position: 'absolute', width: 8, height: 6, borderRadius: 3 },
  zTick: { position: 'absolute', width: 2, height: 6, backgroundColor: '#94A3B8' },
  zLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  zAxis: { fontSize: 10, color: '#94A3B8' },
  percentileBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  percentileLabel: { fontSize: 12, color: '#64748B' },
  percentileValue: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginTop: 2 },

  // RISK GAUGES
  riskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  riskIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  riskLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  riskValue: { fontSize: 12, fontWeight: '700' },
  riskTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  riskFill: { height: '100%', borderRadius: 3 },

  // HABITS
  habitRow: { gap: 12, paddingBottom: 20 },
  habitCard: { backgroundColor: '#FFF', width: 100, padding: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 5 },
  habitValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 12, textAlign: 'center' },
  habitLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },

  // MILESTONE
  delayText: { color: '#B45309', fontSize: 13, marginBottom: 4 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94A3B8', marginTop: 10 },

  // MODALS
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  childOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between' },
  childOptionText: { fontSize: 16, color: '#64748B' },

  historyContainer: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  historyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  historyItem: { backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  historyDate: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  historySub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },

  // MISSING INFO MODAL
  missingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E0E7FF' },
  missingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  missingLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  missingAction: { fontSize: 12, color: '#4F46E5', fontWeight: '500', marginTop: 2 },
  missingHint: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16, fontStyle: 'italic' },

});

export default AIHealthReportsScreen;
