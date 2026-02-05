import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dummy data for posts
const initialPosts = {
  'Newborns (0-3 months)': [
    { id: '1', user: 'Alice', avatar: 'https://randomuser.me/api/portraits/women/21.jpg', text: 'Any tips for getting a newborn to sleep through the night?' },
    { id: '2', user: 'Bob', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', text: 'We found swaddling really helps! And a white noise machine.' },
  ],
  'Toddlers (1-3 years)': [
    { id: '3', user: 'Charlie', avatar: 'https://randomuser.me/api/portraits/men/23.jpg', text: 'Potty training is a struggle. What worked for you all?' },
  ],
  'Allergies & Conditions': [],
  'General Parenting': [],
};

const ForumScreen = ({ route, navigation }) => {
  const { forumName } = route.params;
  const [posts, setPosts] = useState(initialPosts[forumName] || []);
  const [newPost, setNewPost] = useState('');

  const handleAddPost = () => {
    if (newPost.trim() === '') return;
    const newPostObject = {
      id: (posts.length + 1).toString(),
      user: 'Sarah', // Current user
      avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
      text: newPost,
    };
    setPosts([...posts, newPostObject]);
    setNewPost('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{forumName}</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {posts.map(post => (
            <View key={post.id} style={styles.postCard}>
              <Image source={{ uri: post.avatar }} style={styles.avatar} />
              <View style={styles.postContent}>
                <Text style={styles.postUser}>{post.user}</Text>
                <Text style={styles.postText}>{post.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Ask a question in ${forumName}...`}
            value={newPost}
            onChangeText={setNewPost}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleAddPost}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    padding: 24,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postContent: {
    flex: 1,
  },
  postUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  postText: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 4,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ForumScreen;
