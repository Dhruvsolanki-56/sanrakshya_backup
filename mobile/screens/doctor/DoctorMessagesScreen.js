import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const allConversations = [
  { id: '1', parentName: 'Sarah Johnson (Emma)', lastMessage: 'Thank you for the prescription, doctor!', timestamp: '10:45 AM', unread: 0, avatar: 'https://randomuser.me/api/portraits/women/45.jpg' },
  { id: '2', parentName: 'Michael Chen (Alex)', lastMessage: 'Quick question about the dosage...', timestamp: '9:30 AM', unread: 2, avatar: 'https://randomuser.me/api/portraits/men/46.jpg' },
  { id: '3', parentName: 'Jessica Williams (Sophie)', lastMessage: 'Her fever has subsided. Thanks!', timestamp: 'Yesterday', unread: 0, avatar: 'https://randomuser.me/api/portraits/women/47.jpg' },
  { id: '4', parentName: 'David Brown (Liam)', lastMessage: 'Is it normal for the cough to persist?', timestamp: 'Yesterday', unread: 1, avatar: 'https://randomuser.me/api/portraits/men/48.jpg' },
  { id: '5', parentName: 'Linda Martinez (Noah)', lastMessage: 'Great, we will schedule the follow-up.', timestamp: '2 days ago', unread: 0, avatar: 'https://randomuser.me/api/portraits/women/49.jpg' },
];

const DoctorMessagesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const filteredConversations = useMemo(() => {
    let conversations = allConversations;

    if (activeTab === 'Unread') {
      conversations = conversations.filter(c => c.unread > 0);
    }

    if (searchQuery) {
      conversations = conversations.filter(c => c.parentName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return conversations;
  }, [searchQuery, activeTab]);

  const AnimatedConversationItem = ({ item, index }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(itemAnim, {
            toValue: 1,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={{ opacity: itemAnim, transform: [{ scale: itemAnim }] }}>
            <TouchableOpacity style={styles.conversationItem}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.conversationContent}>
                    <Text style={styles.parentName}>{item.parentName}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                </View>
                <View style={styles.conversationMeta}>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                    {item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>{item.unread}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Search and Tabs */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#7f8c8d"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.tabContainer}>
          {['All', 'Unread'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <AnimatedConversationItem item={item} index={index} />}
        ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color="#c5d0e0" />
                <Text style={styles.emptyStateText}>No messages found.</Text>
                <Text style={styles.emptyStateSubtext}>Your conversations with parents will appear here.</Text>
            </View>
        )}
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#2c3e50',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#667eea',
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  conversationContent: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  lastMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#b0b9c6',
  },
  unreadBadge: {
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#b0b9c6',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default DoctorMessagesScreen;
