import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getToken, fetchData } from '../api/api';
import { Manager } from 'socket.io-client';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  createdAt: string;
}

// Function to fetch current user details from your endpoint.
const getUserDetails = async (apiUrl: string): Promise<{ id: string } | null> => {
  const token = await getToken();
  if (!token) return null;
  
  try {
    const response = await fetchData(apiUrl, 'api/users/get-user', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response && response.user && response.user.id) {
      return { id: response.user.id };
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
  }
  return null;
};

const LiveChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatSessionId } = route.params as { chatSessionId: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const socket = useRef<any>(null);
  const apiUrl = 'https://fluffy-space-trout-7vgv67xv9xrhw77-3000.app.github.dev';

  useEffect(() => {
    fetchChatMessages();
    setupSocket();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [chatSessionId]);

  const fetchChatMessages = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please login.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetchData(apiUrl, `api/chat/${chatSessionId}/messages`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response) {
        setMessages(response);
      } else {
        Alert.alert('Error', 'Failed to fetch chat messages.');
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      Alert.alert('Error', 'Failed to fetch chat messages.');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please login.');
      return;
    }

    // Get current user's ID using the new endpoint.
    const userDetails = await getUserDetails(apiUrl);
    if (!userDetails) {
      Alert.alert('Error', 'Failed to fetch user details.');
      return;
    }

    const manager = new Manager(apiUrl, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    socket.current = manager.socket('/'); // Connect to the default namespace

    socket.current.on('connect', () => {
      console.log('Socket connected');
      // Authenticate the socket connection using the fetched user ID.
      socket.current.emit('authenticate', userDetails.id);
      socket.current.emit('joinChatRoom', chatSessionId);
    });

    // Listen for messages sent via the socket.
    socket.current.on('receiveMessage', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.current.on('connect_error', (err: any) => {
      console.error('Socket connect error:', err);
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    // Emit the message over the socket connection.
    socket.current.emit('sendMessage', {
      chatSessionId,
      content: newMessage,
    });
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.message,
        item.sender._id === socket.current?.id ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.senderText}>{item.sender.name}</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#003E7E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Live Chat</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003E7E" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#003E7E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Live Chat</Text>
      </View>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  backButton: {
    marginRight: 10,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003E7E',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  message: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
  },
  senderText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#003E7E',
  },
});

export default LiveChatScreen;
