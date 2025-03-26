import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchData, getToken } from '../api/api';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');
const apiUrl = "https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev";

const RideRequestScreen: React.FC = () => {
  const [requestType, setRequestType] = useState<'ride' | 'pickup'>('ride');
  const [startingStop, setStartingStop] = useState<string>('');
  const [destinationStop, setDestinationStop] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigation = useNavigation<StackNavigationProp<any, 'RideRequest'>>();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Not authorized. Please log in.');
        setLoading(false);
        return;
      }

      let endpoint = '';
      let body: any = {};

      if (requestType === 'ride') {
        if (!startingStop || !destinationStop) {
          setError('Both starting and destination stops are required for a ride request.');
          setLoading(false);
          return;
        }
        endpoint = 'api/rideRequest/ride';
        body = { startingStop, destinationStop };
      } else {
        if (!startingStop) {
          setError('Starting stop is required for a pickup request.');
          setLoading(false);
          return;
        }
        endpoint = 'api/rideRequest/pickup';
        body = { startingStop };
      }

      const data = await fetchData(apiUrl, endpoint, {
        method: 'POST',
        body,
      });

      setSuccessMessage('Request submitted successfully!');
      setStartingStop('');
      setDestinationStop('');
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Ride Request</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, requestType === 'ride' && styles.activeToggle]}
            onPress={() => setRequestType('ride')}
          >
            <Text style={[styles.toggleText, requestType === 'ride' && styles.activeToggleText]}>
              Ride
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, requestType === 'pickup' && styles.activeToggle]}
            onPress={() => setRequestType('pickup')}
          >
            <Text style={[styles.toggleText, requestType === 'pickup' && styles.activeToggleText]}>
              Pickup
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Starting Stop:</Text>
          <TextInput
            style={styles.input}
            value={startingStop}
            onChangeText={setStartingStop}
            placeholder="Enter starting stop"
            placeholderTextColor="#aaa"
          />

          {requestType === 'ride' && (
            <>
              <Text style={styles.label}>Destination Stop:</Text>
              <TextInput
                style={styles.input}
                value={destinationStop}
                onChangeText={setDestinationStop}
                placeholder="Enter destination stop"
                placeholderTextColor="#aaa"
              />
            </>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Text>
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        </View>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Home")}>
          <FontAwesome name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("LiveChat")}>
          <FontAwesome name="comment" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('TaxiManagement')}>
          <FontAwesome name="map" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Profile')}>
          <FontAwesome name="user" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E94560',
    borderRadius: 30,
    marginHorizontal: 10,
  },
  activeToggle: {
    backgroundColor: '#E94560',
  },
  toggleText: {
    fontSize: 18,
    color: '#E94560',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#fff',
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  label: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#E94560',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
  successText: {
    color: 'green',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
  navBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(233, 69, 96, 0.9)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 10,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RideRequestScreen;
