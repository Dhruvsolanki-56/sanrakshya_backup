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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { chatbotService } from '../../services/chatbotService';

const { width } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  const { childId, childName, parentName } = route?.params || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hello${parentName ? ` ${parentName.split(' ')[0]}` : ''}, I'm Bal Mitra. I'm here to gently guide you with ${
        childName || "your child's"
      } health, nutrition, sleep and daily care. What is on your mind today?`,
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [typingText, setTypingText] = useState('');

  const scrollViewRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const isUserAtBottomRef = useRef(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingPulseAnim = useRef(new Animated.Value(0)).current;
  const typingPulseLoopRef = useRef(null);

  const quickQuestions = [
    "Is my baby getting enough breastmilk?",
    'What vaccines are coming up next?',
    "Is my child's weight and height normal?",
    "How can I improve my child's sleep routine?",
    'What should my toddler eat in a day?',
  ];

  useEffect(() => {
    if (scrollViewRef.current && isUserAtBottomRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (typingPulseLoopRef.current) {
        typingPulseLoopRef.current.stop();
        typingPulseLoopRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (isBotTyping && !typingText) {
      if (!typingPulseLoopRef.current) {
        typingPulseLoopRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(typingPulseAnim, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(typingPulseAnim, {
              toValue: 0,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
        );
        typingPulseLoopRef.current.start();
      }
    } else {
      if (typingPulseLoopRef.current) {
        typingPulseLoopRef.current.stop();
        typingPulseLoopRef.current = null;
      }
      typingPulseAnim.setValue(0);
    }
  }, [isBotTyping, typingText, typingPulseAnim]);

  const startTypewriter = (answerText) => {
    if (!answerText) {
      setIsBotTyping(false);
      return;
    }

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    const cleanText = answerText;
    let index = 0;
    setTypingText('');

    typingIntervalRef.current = setInterval(() => {
      index += 1;
      setTypingText(cleanText.slice(0, index));

      if (index >= cleanText.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;

        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
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
      id: messages.length + 1,
      text: textToSend,
      isBot: false,
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsSending(true);
    setIsBotTyping(true);

    const effectiveChildId = childId || '1';

    try {
      const response = await chatbotService.askQuestion(effectiveChildId, textToSend);
      const answer = typeof response?.answer === 'string' ? response.answer : '';
      startTypewriter(answer);
    } catch (err) {
      const isNetworkError = err?.message === 'Network request failed';
      const errorText = isNetworkError
        ? "I'm having trouble reaching the server right now. Please check your internet connection and try again."
        : "Something went wrong while fetching guidance. Please try again in a moment.";

      const errorMessage = {
        id: messages.length + 2,
        text: errorText,
        isBot: true,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsBotTyping(false);
      setTypingText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setMessage(question);
  };

  const renderRichText = (text, isBot) => {
    if (!text) return null;

    const lines = text.split('\n');
    const blocks = [];
    let bullets = [];

    const flushBullets = () => {
      if (bullets.length) {
        blocks.push({ type: 'bullets', items: bullets });
        bullets = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushBullets();
        blocks.push({ type: 'spacer' });
        return;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        bullets.push(trimmed.slice(2));
      } else {
        flushBullets();
        blocks.push({ type: 'paragraph', text: trimmed });
      }
    });

    flushBullets();

    return blocks.map((block, index) => {
      if (block.type === 'paragraph') {
        return (
          <Text
            key={`p-${index}`}
            style={[styles.messageText, isBot ? styles.botMessageText : styles.userMessageText]}
          >
            {block.text}
          </Text>
        );
      }
      if (block.type === 'bullets') {
        return (
          <View key={`b-${index}`} style={styles.bulletList}>
            {block.items.map((item, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text
                  style={[styles.messageText, isBot ? styles.botMessageText : styles.userMessageText]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        );
      }
      return <View key={`s-${index}`} style={styles.paragraphSpacer} />;
    });
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 40;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isUserAtBottomRef.current = isAtBottom;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        // Use padding on both platforms so the input bar moves fully above the keyboard,
        // similar to WhatsApp style.
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={22} color="#2c3e50" />
            </TouchableOpacity>
            <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.aiAvatar}>
              <Ionicons name="chatbubbles" size={20} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>Bal Mitra</Text>
              <Text style={styles.headerSubtitle}>
                {childName ? `Guiding you for ${childName}` : 'Gentle guidance for your child'}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.isBot ? styles.botMessageWrapper : styles.userMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.isBot ? styles.botMessage : styles.userMessage,
                  msg.isError ? styles.errorMessage : null,
                ]}
              >
                {renderRichText(msg.text, msg.isBot)}
                <Text
                  style={[
                    styles.timestamp,
                    msg.isBot ? styles.botTimestamp : styles.userTimestamp,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          ))}

          {isBotTyping && (
            <View style={[styles.messageWrapper, styles.botMessageWrapper, styles.typingWrapper]}>
              <View style={[styles.messageBubble, styles.botMessage]}>
                {typingText ? (
                  renderRichText(typingText, true)
                ) : (
                  <Animated.View
                    style={[
                      styles.typingRow,
                      {
                        opacity: typingPulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1],
                        }),
                      },
                    ]}
                  >
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </Animated.View>
                )}
                <Text style={[styles.timestamp, styles.botTimestamp]}>Bal Mitra is typing...</Text>
              </View>
            </View>
          )}

            {/* Quick Questions */}
            <View style={styles.quickQuestionsContainer}>
              <Text style={styles.quickQuestionsTitle}>Ask about common parent worries</Text>
              <View style={styles.quickQuestionsRow}>
                {quickQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickQuestionButton}
                    onPress={() => handleQuickQuestion(question)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.quickQuestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Ask anything about your child's care..."
              placeholderTextColor="#7f8c8d"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!message.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim() || isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#f4f5fb',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messagesContent: {
    paddingBottom: 40,
  },
  messageWrapper: {
    marginBottom: 20,
  },
  botMessageWrapper: {
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  botMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorMessage: {
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  userMessage: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botMessageText: {
    color: '#2c3e50',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  botTimestamp: {
    color: '#7f8c8d',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickQuestionsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  quickQuestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  quickQuestionButton: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eef1ff',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9ff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#b2b7e5',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#b0b7c3',
    marginRight: 4,
  },
  paragraphSpacer: {
    height: 6,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#667eea',
    marginTop: 7,
    marginRight: 8,
  },
  typingHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f8f1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typingHeaderText: {
    fontSize: 11,
    color: '#10ac84',
    fontWeight: '500',
  },
});

export default ChatScreen;
