import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import io from 'socket.io-client'; 
import { Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'https://probable-space-goggles-wrg6qqg6x49wh9gg-4000.app.github.dev'; // Update with your server URL

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  latitude?: number;
  longitude?: number;
}

type SocketType = ReturnType<typeof io>;

const LiveChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const socketRef = useRef<SocketType | null>(null);

  // Connect to the Socket.io server on mount.
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
    });

    // Listen for incoming messages.
    socketRef.current.on('chatMessage', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for location updates if needed.
    socketRef.current.on('locationUpdate', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Request location permissions and subscribe to updates.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Subscribe to continuous location updates.
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 5000, distanceInterval: 5 },
        (newLocation) => {
          setLocation(newLocation);
          // Send location update via socket.
          socketRef.current?.emit('locationUpdate', {
            id: Date.now().toString(),
            sender: 'passenger',
            text: 'Location update',
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );
    })();
  }, []);

  // Send a chat message.
  const sendMessage = () => {
    if (!currentMessage.trim()) return;
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'passenger',
      text: currentMessage,
    };
    socketRef.current?.emit('chatMessage', message);
    setMessages(prev => [...prev, message]);
    setCurrentMessage('');
  };

  // Render each chat message.
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.sender}>{item.sender}:</Text>
        <Text style={styles.messageText}>{item.text}</Text>
        {item.latitude && item.longitude && (
          <Text style={styles.locationText}>
            (Lat: {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)})
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messageList}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={currentMessage}
          onChangeText={setCurrentMessage}
          placeholder="Type your message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  messageList: { flex: 1, padding: 10 },
  messageContainer: { marginBottom: 12, padding: 8, backgroundColor: '#f1f1f1', borderRadius: 4 },
  sender: { fontWeight: 'bold' },
  messageText: { fontSize: 16 },
  locationText: { fontSize: 12, color: '#555' },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 8 },
  sendButton: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  sendButtonText: { color: '#007bff', fontWeight: 'bold' },
});

export default LiveChatScreen;
