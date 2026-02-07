import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { symptomQuestions } from '../../data/symptomData';

const { width } = Dimensions.get('window');

const BOT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'; // Cute robot icon

const SymptomCheckerScreen = ({ navigation }) => {
  // State
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      text: "Hi! I'm Dr. AI 🤖\nI can help check symptoms quickly. What seems to be the trouble?",
    },
  ]);
  const [showOptions, setShowOptions] = useState(true);
  const [currentSymptom, setCurrentSymptom] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState(null);

  const flatListRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isTyping]);

  // Handle Symptom Selection
  const handleSymptomSelect = (symptomKey) => {
    // Add User Message
    const userMsg = { id: Date.now().toString(), type: 'user', text: symptomKey.charAt(0).toUpperCase() + symptomKey.slice(1) };
    setMessages(prev => [...prev, userMsg]);
    setShowOptions(false);

    // Simulate thinking
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentSymptom(symptomKey);
      setQuestionIndex(0);
      setAnswers([]);

      const firstQ = symptomQuestions[symptomKey].follow_ups[0];
      const botMsg = {
        id: Date.now().toString() + 'b',
        type: 'bot',
        text: firstQ.question,
        options: firstQ.options
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  // Handle Option Selection
  const handleAnswerSelect = (answer) => {
    // Add User Answer
    const userMsg = { id: Date.now().toString(), type: 'user', text: answer };
    setMessages(prev => [...prev, userMsg]);
    setMessages(prev => prev.map(msg => msg.options ? { ...msg, options: null } : msg)); // Remove prev options

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    setIsTyping(true);

    // Logic for next step
    setTimeout(() => {
      setIsTyping(false);
      const symptomData = symptomQuestions[currentSymptom];

      if (questionIndex < symptomData.follow_ups.length - 1) {
        // Next Question
        const nextIdx = questionIndex + 1;
        setQuestionIndex(nextIdx);
        const nextQ = symptomData.follow_ups[nextIdx];
        const botMsg = {
          id: Date.now().toString() + 'b',
          type: 'bot',
          text: nextQ.question,
          options: nextQ.options
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        // Final Result
        const analysis = symptomData.analysis(newAnswers);
        setResult(analysis);
        const botMsg = {
          id: Date.now().toString() + 'res',
          type: 'bot',
          text: "I've analyzed the symptoms. Here is my recommendation:",
          isResult: true,
          data: analysis
        };
        setMessages(prev => [...prev, botMsg]);
      }
    }, 1200);
  };

  const handleReset = () => {
    setMessages([{
      id: Date.now().toString(),
      type: 'bot',
      text: "Let's check something else. What's the main symptom?",
    }]);
    setResult(null);
    setCurrentSymptom(null);
    setQuestionIndex(0);
    setAnswers([]);
    setShowOptions(true);
  };

  // Render Items
  const renderMessage = ({ item }) => {
    if (item.type === 'user') {
      return (
        <View style={styles.userMsgWrapper}>
          <LinearGradient colors={['#2563EB', '#4F46E5']} style={styles.userMsgBubble}>
            <Text style={styles.userMsgText}>{item.text}</Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.botMsgWrapper}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: BOT_AVATAR }} style={styles.botAvatar} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.botMsgBubble}>
            <Text style={styles.botMsgText}>{item.text}</Text>
          </View>

          {/* Show Result Card if it's a result message */}
          {item.isResult && item.data && (
            <View style={[styles.resultCard, getResultStyle(item.data.urgency)]}>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons
                  name={item.data.urgency === 'high' ? 'alert-decagram' : item.data.urgency === 'medium' ? 'medical-bag' : 'emoticon-happy'}
                  size={24}
                  color={getUrgencyColor(item.data.urgency)}
                />
                <Text style={[styles.resultTitle, { color: getUrgencyColor(item.data.urgency) }]}>
                  {item.data.recommendation}
                </Text>
              </View>
              <Text style={styles.resultSummary}>{item.data.summary}</Text>

              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>Check Another Symptom</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Show Options Chips if available */}
          {item.options && (
            <View style={styles.optionsContainer}>
              {item.options.map((opt, idx) => (
                <TouchableOpacity key={idx} style={styles.chip} onPress={() => handleAnswerSelect(opt)}>
                  <Text style={styles.chipText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const getResultStyle = (urgency) => {
    switch (urgency) {
      case 'high': return { backgroundColor: '#FEF2F2', borderColor: '#EF4444' };
      case 'medium': return { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' };
      default: return { backgroundColor: '#ECFDF5', borderColor: '#10B981' };
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return '#EF4444';
      case 'medium': return '#D97706';
      default: return '#059669';
    }
  }

  // Initial Symptom Grid
  const renderSymptomGrid = () => (
    <View style={styles.symptomGrid}>
      {Object.keys(symptomQuestions).map((key) => {
        let iconName = 'thermometer';
        let bg = '#FEE2E2';
        let color = '#EF4444';

        if (key === 'cough') { iconName = 'weather-windy'; bg = '#E0F2FE'; color = '#0EA5E9'; }
        if (key === 'rash') { iconName = 'allergy'; bg = '#FCE7F3'; color = '#EC4899'; }

        return (
          <TouchableOpacity key={key} style={[styles.symptomCard, { backgroundColor: bg }]} onPress={() => handleSymptomSelect(key)}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF' }]}>
              <MaterialCommunityIcons name={iconName} size={28} color={color} />
            </View>
            <Text style={[styles.symptomText, { color }]}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  );

  // Background Artifacts
  const renderBackground = () => (
    <View style={styles.bgDecorations} pointerEvents="none">
      <MaterialCommunityIcons name="stethoscope" size={120} color="rgba(59, 130, 246, 0.05)" style={styles.bgIcon1} />
      <MaterialCommunityIcons name="pill" size={80} color="rgba(16, 185, 129, 0.05)" style={styles.bgIcon2} />
      <MaterialCommunityIcons name="bandage" size={100} color="rgba(245, 158, 11, 0.05)" style={styles.bgIcon3} />
      <MaterialCommunityIcons name="teddy-bear" size={140} color="rgba(239, 68, 68, 0.04)" style={styles.bgIcon4} />
      <MaterialCommunityIcons name="heart-pulse" size={60} color="rgba(139, 92, 246, 0.05)" style={styles.bgIcon5} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Dr. AI Checker</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <MaterialCommunityIcons name="information-variant" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {renderBackground()}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          ListFooterComponent={() => (
            <>
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <Text style={{ color: '#6B7280', fontStyle: 'italic' }}>Dr. AI is thinking...</Text>
                </View>
              )}
              {showOptions && !isTyping && renderSymptomGrid()}
              <View style={{ height: 40 }} />
            </>
          )}
        />
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  helpBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },

  // Chat
  chatList: {
    padding: 20,
  },
  botMsgWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    maxWidth: '85%',
  },
  avatarContainer: {
    marginRight: 10,
    justifyContent: 'flex-end', // Align bottom of avatar
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
  },
  botMsgBubble: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  botMsgText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },

  userMsgWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    maxWidth: '80%',
  },
  userMsgBubble: {
    padding: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  userMsgText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },

  // Options / Chips
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  chipText: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  // Symptom Grid
  symptomGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  symptomCard: {
    width: 100,
    height: 110,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  symptomText: {
    fontWeight: '700',
    fontSize: 14,
  },

  // Result Card
  resultCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
    flex: 1,
  },
  resultSummary: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  typingIndicator: {
    marginLeft: 50,
    marginBottom: 20,
  },

  // Background Decorations
  bgDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  bgIcon1: { position: 'absolute', top: 50, right: -20, transform: [{ rotate: '15deg' }] },
  bgIcon2: { position: 'absolute', top: 300, left: -20, transform: [{ rotate: '-15deg' }] },
  bgIcon3: { position: 'absolute', bottom: 150, right: 10, transform: [{ rotate: '30deg' }] },
  bgIcon4: { position: 'absolute', bottom: -20, left: 20, transform: [{ rotate: '-10deg' }] },
  bgIcon5: { position: 'absolute', top: 150, left: '40%', opacity: 0.6 },
});

export default SymptomCheckerScreen;
