import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { getToken, fetchData } from '../api/api';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

// Define your navigation parameter types
type RootStackParamList = {
  Home: { acceptedTaxiId?: string };
  // ... other routes
};

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const apiUrl = "https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev";
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monitoredTaxi, setMonitoredTaxi] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  
  const route = useRoute<HomeScreenRouteProp>();
  const acceptedTaxiId = route.params?.acceptedTaxiId;
  const navigation = useNavigation<StackNavigationProp<any, 'Home'>>();

  useEffect(() => {
    // Fetch user data with token
    const fetchUserData = async () => {
      const token = await getToken();
      if (token) {
        try {
          const endpoint = 'api/users/get-user';
          const response = await fetchData(apiUrl, endpoint, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response?.user) {
            setUserName(response.user.name);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Error', 'Failed to fetch user data.');
        }
      }
      setIsLoading(false);
    };

    fetchUserData();

    // Parallel animations for fade in and slide up effect
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Function to fetch live taxi details using the monitorTaxi endpoint.
  const handleMonitorTaxi = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please login to monitor taxis.');
      return;
    }
    if (!acceptedTaxiId) {
      Alert.alert('No Taxi Assigned', 'There is no taxi assigned to your ride yet.');
      return;
    }
    try {
      const endpoint = `api/taxis/${acceptedTaxiId}/monitor`;
      const response = await fetchData(apiUrl, endpoint, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.taxiInfo) {
        setMonitoredTaxi(response.taxiInfo);
        Alert.alert('Taxi Monitored', 'Live taxi details are now available.');
      } else {
        Alert.alert('Error', 'Failed to fetch taxi details.');
      }
    } catch (error) {
      console.error('Error monitoring taxi:', error);
      Alert.alert('Error', 'Failed to monitor taxi.');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.gradient}>
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeText}>
          {userName ? `Welcome back, ${userName}!` : 'Welcome to Taxi Tracker!'}
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Taxi Status</Text>
          <Text style={styles.cardContent}>🟢 5 taxis available</Text>
          <Text style={styles.cardContent}>
            ⌛ Estimated Time: <Text style={styles.timeText}>15 mins</Text>
          </Text>
          <TouchableOpacity style={[styles.actionButton, { marginTop: 15 }]} onPress={handleMonitorTaxi}>
            <FontAwesome name="eye" size={24} color="white" />
            <Text style={styles.buttonText}>Monitor Taxi</Text>
          </TouchableOpacity>
        </View>
        {monitoredTaxi && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monitored Taxi Details</Text>
            <Text style={styles.cardContent}>Plate: {monitoredTaxi.numberPlate}</Text>
            <Text style={styles.cardContent}>Status: {monitoredTaxi.status}</Text>
            <Text style={styles.cardContent}>Current Stop: {monitoredTaxi.currentStop}</Text>
            <Text style={styles.cardContent}>Load: {monitoredTaxi.currentLoad}</Text>
            <Text style={styles.cardContent}>Route: {monitoredTaxi.routeName}</Text>
            <Text style={styles.cardContent}>Next Stop: {monitoredTaxi.nextStop}</Text>
            <Text style={styles.cardContent}>Driver: {monitoredTaxi.driverUsername}</Text>
          </View>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("requestRide")}>
            <FontAwesome name="car" size={24} color="white" />
            <Text style={styles.buttonText}>Request Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("ViewTaxi")}>
            <MaterialIcons name="speed" size={24} color="white" />
            <Text style={styles.buttonText}>View Taxis</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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

const Loading = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <FontAwesome name="spinner" size={50} color="#fff" />
      </Animated.View>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: width * 0.9,
    borderRadius: 20,
    padding: 25,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E94560',
    marginBottom: 15,
  },
  cardContent: {
    fontSize: 18,
    color: '#333',
    marginBottom: 5,
  },
  timeText: {
    fontWeight: 'bold',
    color: '#F2C14E',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E94560',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: '600',
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
  navButton: { justifyContent: 'center', alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F2027',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { fontSize: 22, color: '#ffffff', marginTop: 15 },
});

export default HomeScreen;
