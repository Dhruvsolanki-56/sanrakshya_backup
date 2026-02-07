import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { chatbotService } from '../../services/chatbotService';
import { symptomQuestions } from '../../data/symptomData';

const { width } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  const { childId, childName, parentName } = route?.params || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hi${parentName ? ` ${parentName.split(' ')[0]}` : ''}! 👋 I'm your AI Helper!\nI can help with ${childName || "your child's"} health, symptoms, diet, sleep & more. Just ask! ✨`,
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [typingText, setTypingText] = useState('');

  // Symptom Checker State
  const [showSymptomGrid, setShowSymptomGrid] = useState(false);
  const [currentSymptom, setCurrentSymptom] = useState(null);
  const [symptomQuestionIndex, setSymptomQuestionIndex] = useState(0);
  const [symptomAnswers, setSymptomAnswers] = useState([]);

  const scrollViewRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const isUserAtBottomRef = useRef(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingPulseAnim = useRef(new Animated.Value(0)).current;
  const typingPulseLoopRef = useRef(null);

  const quickQuestions = [
    { text: "Symptom Checker 🩺", isSymptomChecker: true },
    { text: "My child has a fever 🤒" },
    { text: "Is my baby getting enough breastmilk? 🍼" },
    { text: 'Next vaccines due? 💉' },
    { text: "Tips for better sleep? 😴" },
    { text: 'Healthy toddler meals? 🥦' },
  ];

  useEffect(() => {
    if (scrollViewRef.current && isUserAtBottomRef.current) {
      setTimeout(() => scrollViewRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isBotTyping, showSymptomGrid]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (typingPulseLoopRef.current) typingPulseLoopRef.current.stop();
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  // Typing Pulse Animation
  useEffect(() => {
    if (isBotTyping && !typingText) {
      if (!typingPulseLoopRef.current) {
        typingPulseLoopRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(typingPulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(typingPulseAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          ]),
        );
        typingPulseLoopRef.current.start();
      }
    } else {
      if (typingPulseLoopRef.current) {
        typingPulseLoopRef.current.stop();
        typingPulseLoopRef.current = null;
      }
      typingPulseAnim.setValue(0.4);
    }
  }, [isBotTyping, typingText]);

  const startTypewriter = (answerText) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (!answerText || typeof answerText !== 'string') {
      setIsBotTyping(false);
      setTypingText('');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "I'm here to help! Please ask me again. 😊",
          isBot: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    const cleanText = answerText.trim();
    let index = 0;
    setTypingText('');

    typingIntervalRef.current = setInterval(() => {
      index += 2;
      const currentText = cleanText.slice(0, index);
      setTypingText(currentText);

      if (index >= cleanText.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: cleanText,
            isBot: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setTypingText('');
        setIsBotTyping(false);
      }
    }, 15);
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const textToSend = message.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      isBot: false,
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsSending(true);
    setIsBotTyping(true);
    setTypingText('');
    setShowSymptomGrid(false); // Hide symptom grid when sending

    isUserAtBottomRef.current = true;

    try {
      const effectiveChildId = childId || '1';
      const response = await chatbotService.askQuestion(effectiveChildId, textToSend);
      const answer = response?.answer;
      startTypewriter(answer);
    } catch (err) {
      console.log('Chat error:', err);
      const errorText = "Oops! My connection is a bit fuzzy. Please try again! 📡";
      setMessages((prev) => [...prev, {
        id: Date.now(),
        text: errorText,
        isBot: true,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setTypingText('');
      setIsBotTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestionPress = (q) => {
    if (q.isSymptomChecker) {
      // Show symptom grid
      const botMsg = {
        id: Date.now(),
        text: "Let's check the symptoms! What's the main concern? 🩺",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setShowSymptomGrid(true);
      setCurrentSymptom(null);
      setSymptomQuestionIndex(0);
      setSymptomAnswers([]);
    } else {
      setMessage(q.text.replace(/ [\u{1F300}-\u{1F9FF}]$/u, '')); // Remove emoji
    }
  };

  // Symptom Checker Logic
  const handleSymptomSelect = (symptomKey) => {
    // Add user message
    const userMsg = {
      id: Date.now(),
      text: symptomKey.charAt(0).toUpperCase() + symptomKey.slice(1),
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setShowSymptomGrid(false);

    // Set current symptom and show first follow-up question
    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      setCurrentSymptom(symptomKey);
      setSymptomQuestionIndex(0);
      setSymptomAnswers([]);

      const firstQ = symptomQuestions[symptomKey].follow_ups[0];
      const botMsg = {
        id: Date.now(),
        text: firstQ.question,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        symptomOptions: firstQ.options, // Special property for symptom options
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  const handleSymptomAnswer = (answer) => {
    // Add user answer
    const userMsg = {
      id: Date.now(),
      text: answer,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Clear options from previous message
    setMessages((prev) => prev.map(msg => msg.symptomOptions ? { ...msg, symptomOptions: null } : msg));

    const newAnswers = [...symptomAnswers, answer];
    setSymptomAnswers(newAnswers);

    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      const symptomData = symptomQuestions[currentSymptom];

      if (symptomQuestionIndex < symptomData.follow_ups.length - 1) {
        // Next question
        const nextIdx = symptomQuestionIndex + 1;
        setSymptomQuestionIndex(nextIdx);
        const nextQ = symptomData.follow_ups[nextIdx];
        const botMsg = {
          id: Date.now(),
          text: nextQ.question,
          isBot: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          symptomOptions: nextQ.options,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        // Final result
        const analysis = symptomData.analysis(newAnswers);
        const botMsg = {
          id: Date.now(),
          text: "I've analyzed the symptoms. Here's my recommendation:",
          isBot: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          symptomResult: analysis, // Special property for result
        };
        setMessages((prev) => [...prev, botMsg]);

        // Reset symptom state
        setCurrentSymptom(null);
        setSymptomQuestionIndex(0);
        setSymptomAnswers([]);
      }
    }, 1000);
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    isUserAtBottomRef.current = isAtBottom;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return '#EF4444';
      case 'medium': return '#D97706';
      default: return '#059669';
    }
  };

  const getUrgencyBg = (urgency) => {
    switch (urgency) {
      case 'high': return '#FEF2F2';
      case 'medium': return '#FFFBEB';
      default: return '#ECFDF5';
    }
  };

  // Background Artifacts
  const renderBackground = () => (
    <View style={styles.bgDecorations} pointerEvents="none">
      {/* Mixed Child & Bot Artifacts */}
      <MaterialCommunityIcons name="robot-happy-outline" size={140} color="rgba(59, 130, 246, 0.06)" style={styles.bgIconRobot} />
      <MaterialCommunityIcons name="smart-card-outline" size={90} color="rgba(16, 185, 129, 0.05)" style={styles.bgIcon1} />
      <MaterialCommunityIcons name="baby-bottle-outline" size={80} color="rgba(236, 72, 153, 0.05)" style={styles.bgIcon2} />
      <MaterialCommunityIcons name="brain" size={110} color="rgba(124, 58, 237, 0.05)" style={styles.bgIcon3} />
      <MaterialCommunityIcons name="chat-question-outline" size={90} color="rgba(245, 158, 11, 0.05)" style={styles.bgIconChat} />
      <MaterialCommunityIcons name="heart-pulse" size={70} color="rgba(239, 68, 68, 0.05)" style={styles.bgIcon4} />
      <MaterialCommunityIcons name="sparkles" size={50} color="rgba(251, 191, 36, 0.1)" style={styles.bgIcon5} />
      <MaterialCommunityIcons name="stethoscope" size={100} color="rgba(6, 182, 212, 0.05)" style={styles.bgIcon6} />
    </View>
  );

  // Symptom Grid Component
  const renderSymptomGrid = () => (
    <View style={styles.symptomGridContainer}>
      {Object.keys(symptomQuestions).map((key) => {
        let iconName = 'thermometer';
        let bg = '#FEE2E2';
        let color = '#EF4444';

        if (key === 'cough') { iconName = 'weather-windy'; bg = '#E0F2FE'; color = '#0EA5E9'; }
        if (key === 'rash') { iconName = 'allergy'; bg = '#FCE7F3'; color = '#EC4899'; }

        return (
          <TouchableOpacity
            key={key}
            style={[styles.symptomCard, { backgroundColor: bg }]}
            onPress={() => handleSymptomSelect(key)}
          >
            <View style={styles.symptomIconBox}>
              <MaterialCommunityIcons name={iconName} size={28} color={color} />
            </View>
            <Text style={[styles.symptomCardText, { color }]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Helper</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Always Here</Text>
          </View>
        </View>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134346.png' }}
          style={styles.headerAvatar}
        />
      </View>

      <View style={styles.contentWrapper}>
        {renderBackground()}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            if (isUserAtBottomRef.current && scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: true });
            }
          }}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, msg.isBot ? styles.botRow : styles.userRow]}>
              {msg.isBot && (
                <View style={styles.msgAvatarContainer}>
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134346.png' }} style={styles.msgAvatar} />
                </View>
              )}
              <View style={[styles.bubble, msg.isBot ? styles.botBubble : styles.userBubble, msg.isError && styles.errorBubble]}>
                <Text style={[styles.msgText, msg.isBot ? styles.botText : styles.userText]}>{msg.text}</Text>
                <Text style={[styles.timeText, msg.isBot ? styles.botTime : styles.userTime]}>{msg.timestamp}</Text>

                {/* Symptom Options */}
                {msg.symptomOptions && (
                  <View style={styles.symptomOptionsContainer}>
                    {msg.symptomOptions.map((opt, idx) => (
                      <TouchableOpacity key={idx} style={styles.symptomOptionChip} onPress={() => handleSymptomAnswer(opt)}>
                        <Text style={styles.symptomOptionText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Symptom Result Card */}
                {msg.symptomResult && (
                  <View style={[styles.resultCard, { backgroundColor: getUrgencyBg(msg.symptomResult.urgency), borderColor: getUrgencyColor(msg.symptomResult.urgency) }]}>
                    <View style={styles.resultHeader}>
                      <MaterialCommunityIcons
                        name={msg.symptomResult.urgency === 'high' ? 'alert-decagram' : msg.symptomResult.urgency === 'medium' ? 'medical-bag' : 'emoticon-happy'}
                        size={24}
                        color={getUrgencyColor(msg.symptomResult.urgency)}
                      />
                      <Text style={[styles.resultTitle, { color: getUrgencyColor(msg.symptomResult.urgency) }]}>
                        {msg.symptomResult.recommendation}
                      </Text>
                    </View>
                    <Text style={styles.resultSummary}>{msg.symptomResult.summary}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Symptom Grid - shown inline */}
          {showSymptomGrid && renderSymptomGrid()}

          {isBotTyping && (
            <View style={[styles.messageRow, styles.botRow]}>
              <View style={styles.msgAvatarContainer}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134346.png' }} style={styles.msgAvatar} />
              </View>
              {!typingText ? (
                <View style={[styles.bubble, styles.botBubble, styles.dotsOnlyBubble]}>
                  <Animated.View style={[styles.typingDots, { opacity: typingPulseAnim }]}>
                    <View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} />
                  </Animated.View>
                </View>
              ) : (
                <View style={[styles.bubble, styles.botBubble]}>
                  <Text style={[styles.msgText, styles.botText]}>{typingText}</Text>
                </View>
              )}
            </View>
          )}

          {/* Quick Questions Chips */}
          <View style={styles.quickQContainer}>
            <Text style={styles.quickQTitle}>Quick Advice 💡</Text>
            <View style={styles.chipsRow}>
              {quickQuestions.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, q.isSymptomChecker && styles.symptomCheckerChip]}
                  onPress={() => handleQuickQuestionPress(q)}
                >
                  <Text style={[styles.chipText, q.isSymptomChecker && styles.symptomCheckerChipText]}>{q.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* INPUT AREA */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Ask anything about your child..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!message.trim() || isSending) && styles.disabledSend]}
            onPress={handleSend}
            disabled={!message.trim() || isSending}
          >
            {isSending ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="send" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  contentWrapper: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 2 }
  },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 12 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  statusText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF' },

  // Messages
  messagesContainer: { flex: 1, paddingHorizontal: 20 },
  messagesContent: { paddingTop: 20, paddingBottom: 20 },

  messageRow: { flexDirection: 'row', marginBottom: 16, maxWidth: '100%' },
  botRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },

  msgAvatarContainer: { marginRight: 8, justifyContent: 'flex-end', paddingBottom: 4 },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF' },

  bubble: { padding: 16, borderRadius: 20, maxWidth: '80%' },
  botBubble: { backgroundColor: '#FFF', borderTopLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  userBubble: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  errorBubble: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },

  msgText: { fontSize: 16, lineHeight: 22 },
  botText: { color: '#374151' },
  userText: { color: '#FFF' },

  timeText: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  botTime: { color: '#9CA3AF' },
  userTime: { color: 'rgba(255,255,255,0.7)' },

  typingDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' },
  dotsOnlyBubble: { minWidth: 60, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },

  // Quick Questions
  quickQContainer: { marginTop: 20 },
  quickQTitle: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#EFF6FF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE' },
  chipText: { fontSize: 13, color: '#2563EB', fontWeight: '500' },
  symptomCheckerChip: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  symptomCheckerChipText: { color: '#DC2626' },

  // Input
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: '#E5E7EB' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 },
  disabledSend: { backgroundColor: '#E0E7FF', elevation: 0 },

  // Background
  bgDecorations: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: -1 },
  bgIconRobot: { position: 'absolute', top: 80, right: -20, transform: [{ rotate: '15deg' }] },
  bgIconChat: { position: 'absolute', top: '40%', left: -20, transform: [{ rotate: '-10deg' }] },
  bgIcon1: { position: 'absolute', top: 50, left: 20, opacity: 0.5 },
  bgIcon2: { position: 'absolute', bottom: 250, right: -10, transform: [{ rotate: '-5deg' }] },
  bgIcon3: { position: 'absolute', bottom: 150, left: 20, transform: [{ rotate: '10deg' }] },
  bgIcon4: { position: 'absolute', bottom: -10, right: 40 },
  bgIcon5: { position: 'absolute', top: 150, left: '40%', opacity: 0.6 },
  bgIcon6: { position: 'absolute', bottom: 80, left: '35%', opacity: 0.4 },

  // Symptom Grid
  symptomGridContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  symptomCard: {
    width: 100,
    height: 110,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  symptomIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  symptomCardText: { fontWeight: '700', fontSize: 14 },

  // Symptom Options
  symptomOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  symptomOptionChip: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  symptomOptionText: { color: '#4F46E5', fontWeight: '600' },

  // Symptom Result Card
  resultCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  resultTitle: { fontSize: 16, fontWeight: '800', marginLeft: 8, flex: 1 },
  resultSummary: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});

export default ChatScreen;
