import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { fetchData } from '../api/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


const RideRequestScreen = () => {
  const [currentStop, setCurrentStop] = useState('');
  const [destinationStop, setDestinationStop] = useState('');
  const [rideType, setRideType] = useState('requestRide');
  const apiUrl = "https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev";
  
  const handleRequest = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found.');
        return;
      }

      const endpoint = rideType === 'requestRide' ? 'request' : 'pickup';
      const requestBody: Record<string, string> = { startStop: currentStop };
      if (rideType === 'requestRide') {
        requestBody['destinationStop'] = destinationStop;
      }

      const response = await fetchData(`${apiUrl}/api/rideRequest`, endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.message?.includes('successfully')) {
        Alert.alert('Success', response.message);
      } else {
        Alert.alert('Error', response.message || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send request. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ride Request</Text>

      <TextInput
        style={styles.input}
        placeholder="Current Stop"
        value={currentStop}
        onChangeText={setCurrentStop}
      />

      {rideType === 'requestRide' && (
        <TextInput
          style={styles.input}
          placeholder="Destination Stop"
          value={destinationStop}
          onChangeText={setDestinationStop}
        />
      )}

      <Picker selectedValue={rideType} onValueChange={setRideType}>
        <Picker.Item label="Request Ride" value="requestRide" />
        <Picker.Item label="Pick Up" value="pickUp" />
      </Picker>

      <Button title="Send Request" onPress={handleRequest} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
  },
});

export default RideRequestScreen;
