import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { getToken, fetchData } from '../api/api'; // Import getToken and fetchData
import { useNavigation } from '@react-navigation/native'; // React Navigation
import { StackNavigationProp } from '@react-navigation/stack';

const HomeScreen = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = new Animated.Value(0); // Initial opacity value
  const navigation = useNavigation<StackNavigationProp<any, 'Auth'>>();

  useEffect(() => {
    // Fetch token and user details
    const fetchUserData = async () => {
      const token = await getToken();
      if (token) {
        try {
          const apiUrl = 'https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev'; // Replace with your backend URL
          const endpoint = 'api/users/get-user'; // Endpoint to get user info
          
          const response = await fetchData(apiUrl, endpoint, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response?.user) {
            setUserName(response.user.name); // Set user name
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Error', 'Failed to fetch user data.');
        }
      }
      setIsLoading(false); // Stop loading once done
    };

    fetchUserData();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <Text style={styles.welcomeText}>
        🚖 Welcome {userName ? `back, ${userName}` : 'to Taxi Tracker'}
      </Text>

      {/* Taxi Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚦 Live Taxi Status</Text>
        <Text style={styles.cardContent}>🟢 5 taxis available</Text>
        <Text style={styles.cardContent}>⌛ Estimated Time: <Text style={styles.timeText}>15 mins</Text></Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="car" size={24} color="white" />
          <Text style={styles.buttonText}>Request Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={()=> navigation.navigate("ViewTaxi")}>
          <MaterialIcons name="speed" size={24} color="white" />
          <Text style={styles.buttonText}>View Taxis</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton}>
          <FontAwesome name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <FontAwesome name="map" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Profile')}>
          <FontAwesome name="user" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00bcd4', // Cool blue is now dominant
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'center',
    paddingTop: 50, // Adds some padding to the top to avoid the content being too close to the top edge
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffffA5', // Slightly transparent white card
    padding: 20,
    borderRadius: 15,
    width: '90%',
    marginVertical: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff647c', // Wintery red accent for the title
    marginBottom: 10,
  },
  cardContent: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  timeText: {
    color: '#ffcc00', // Warm yellow for time
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff647c', // Wintery red for buttons
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginHorizontal: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#ff647c', // Wintery red for bottom nav
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderRadius: 25,
  },
  navButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: '#fff',
  },
});

export default HomeScreen;
