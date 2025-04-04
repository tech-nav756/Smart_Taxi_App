import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getToken, fetchData } from '../api/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface TaxiDetails {
  taxiId: string;
  numberPlate: string;
  driverName: string;
  route: string;
  currentStop: string;
  capacity: number;
  currentLoad: number;
  status: string;
}

type RootStackParamList = {
  AcceptedRequests: undefined;
  ViewAcceptedTaxi: { requestId: string };
};

type AcceptedRequestsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AcceptedRequests'
>;

const AcceptedRequestsScreen = () => {
  const [taxiDetails, setTaxiDetails] = useState<TaxiDetails | null>(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const navigation = useNavigation<AcceptedRequestsScreenNavigationProp>();
  const apiUrl = 'https://fluffy-space-trout-7vgv67xv9xrhw77-3000.app.github.dev'; // Replace with your actual API URL

  useEffect(() => {
    fetchTaxiDetails();
  }, []);

  const fetchTaxiDetails = async () => {
    setLoading(true); // Set loading to true when fetching starts
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please login.');
      setLoading(false); // Set loading to false on error
      return;
    }

    try {
      const response = await fetchData(apiUrl, 'api/rideRequest/acceptedRequests', { // Replace with your correct endpoint
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response && response.taxiDetails) {
        setTaxiDetails(response.taxiDetails);
      } else {
        Alert.alert('Error', 'Failed to fetch taxi details.');
      }
    } catch (error) {
      console.error('Error fetching taxi details:', error);
      Alert.alert('Error', 'Failed to fetch taxi details.');
    } finally {
      setLoading(false); // Set loading to false when fetching completes (success or error)
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#003E7E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Taxi Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003E7E" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!taxiDetails) {
    return (
      <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="#003E7E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Taxi Details</Text>
        </View>
        <View style={styles.container}>
          <Text>No taxi details found.</Text>
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
        <Text style={styles.navTitle}>Taxi Details</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.requestText}>Taxi ID: {taxiDetails.taxiId}</Text>
          <Text style={styles.requestText}>Number Plate: {taxiDetails.numberPlate}</Text>
          <Text style={styles.requestText}>Driver Name: {taxiDetails.driverName}</Text>
          <Text style={styles.requestText}>Route: {taxiDetails.route}</Text>
          <Text style={styles.requestText}>Current Stop: {taxiDetails.currentStop}</Text>
          <Text style={styles.requestText}>Capacity: {taxiDetails.capacity}</Text>
          <Text style={styles.requestText}>Current Load: {taxiDetails.currentLoad}</Text>
          <Text style={styles.requestText}>Status: {taxiDetails.status}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.chatButton} onPress={() => Alert.alert('Chat', 'Chat functionality not implemented.')}>
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => Alert.alert('Cancel', 'Cancel functionality not implemented.')}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 20,
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
        alignItems: 'center'
    },
    loadingText:{
        marginTop: 10,
        fontSize: 16,
        color: '#003E7E',
    }
});

export default AcceptedRequestsScreen;