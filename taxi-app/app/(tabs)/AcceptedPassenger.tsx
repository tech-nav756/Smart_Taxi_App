import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getToken, fetchData } from '../api/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface PassengerDetails {
  requestId: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  startingStop: string;
  destinationStop: string;
  status: string;
  route: string;
}

type RootStackParamList = {
  AcceptedPassenger: undefined;
  LiveChat: { chatSessionId: string };
};

type AcceptedPassengersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AcceptedPassenger'
>;

const AcceptedPassengersScreen = () => {
  const [passengerDetails, setPassengerDetails] = useState<PassengerDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<AcceptedPassengersScreenNavigationProp>();
  const apiUrl = 'https://fluffy-space-trout-7vgv67xv9xrhw77-3000.app.github.dev';

  useEffect(() => {
    fetchPassengerDetails();
  }, []);

  const fetchPassengerDetails = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please login.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetchData(apiUrl, 'api/rideRequest/acceptedPassengerDetails', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response && response.passengerDetails) {
        setPassengerDetails(response.passengerDetails);
      } else {
        Alert.alert('Error', 'Failed to fetch passenger details.');
      }
    } catch (error) {
      console.error('Error fetching passenger details:', error);
      Alert.alert('Error', 'Failed to fetch passenger details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (requestId: string) => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please login.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetchData(apiUrl, 'api/chat/driver-initiate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });
      if (response && response.chatSessionId) {
        navigation.navigate('LiveChat', { chatSessionId: response.chatSessionId });
      } else {
        Alert.alert('Error', 'Failed to initiate chat.');
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
      Alert.alert('Error', 'Failed to initiate chat.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#003E7E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Passenger Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003E7E" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!passengerDetails || passengerDetails.length === 0) {
    return (
      <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#003E7E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Passenger Details</Text>
        </View>
        <View style={styles.container}>
          <Text>No passenger details found.</Text>
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
        <Text style={styles.navTitle}>Passenger Details</Text>
      </View>
      <ScrollView style={styles.container}>
        {passengerDetails.map((passenger) => (
          <View key={passenger.requestId} style={styles.contentContainer}>
            <Text style={styles.requestText}>Request ID: {passenger.requestId}</Text>
            <Text style={styles.requestText}>Passenger Name: {passenger.passengerName}</Text>
            <Text style={styles.requestText}>Passenger Email: {passenger.passengerEmail}</Text>
            <Text style={styles.requestText}>Passenger Phone: {passenger.passengerPhone}</Text>
            <Text style={styles.requestText}>Starting Stop: {passenger.startingStop}</Text>
            <Text style={styles.requestText}>Destination Stop: {passenger.destinationStop}</Text>
            <Text style={styles.requestText}>Status: {passenger.status}</Text>
            <Text style={styles.requestText}>Route: {passenger.route}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.chatButton} onPress={() => handleChat(passenger.requestId)}>
                <Text style={styles.buttonText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => Alert.alert('Cancel', 'Cancel functionality not implemented.')}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
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
  container: {
    flex: 1,
    padding: 20,
  },
  requestText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  contentContainer: {
    backgroundColor: '#F7F9FC',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  chatButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '40%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    width: '40%',
    alignItems: 'center',
  },
  buttonText: {
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

export default AcceptedPassengersScreen;
