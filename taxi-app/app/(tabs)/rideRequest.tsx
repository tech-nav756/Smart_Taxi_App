import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchData, getToken } from '../api/api';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');
const apiUrl = 'https://fluffy-space-trout-7vgv67xv9xrhw77-3000.app.github.dev';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose, onNavigate }) => {
  const slideAnim = useRef(new Animated.Value(-250)).current; // Sidebar width
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -250,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.sidebar,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Menu</Text>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome name="close" size={24} color="#003E7E" />
        </TouchableOpacity>
      </View>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Shesha</Text>
      </View>
            <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate('Home'); onClose(); }}>
              <FontAwesome name="home" size={22} color="#003E7E" />
              <Text style={styles.sidebarButtonText}>Home</Text>
            </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate('requestRide'); onClose(); }}>
        <FontAwesome name="car" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Request Ride</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate('ViewTaxi'); onClose(); }}>
        <MaterialIcons name="directions-car" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>View Taxis</Text>
      </TouchableOpacity>
      <View style={styles.sidebarDivider} />
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate('ViewRequests'); onClose(); }}>
        <FontAwesome name="search" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Search Rides</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate('LiveChat'); onClose(); }}>
        <FontAwesome name="comment" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Live Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate('TaxiManagement'); onClose(); }}>
        <FontAwesome name="map" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Manage Taxi</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate('Profile'); onClose(); }}>
        <FontAwesome name="user" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Profile</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RideRequestScreen: React.FC = () => {
  const [requestType, setRequestType] = useState<'ride' | 'pickup'>('ride');
  const [startingStop, setStartingStop] = useState<string>('');
  const [destinationStop, setDestinationStop] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

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

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen);
  };
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
      <View style={styles.navBar}>
        <Text style={styles.navLogo}>Shesha</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
          <FontAwesome name="bars" size={28} color="#003E7E" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Sidebar
          isVisible={sidebarVisible}
          onClose={toggleSidebar}
          onNavigate={handleNavigate}
        />
        <ScrollView contentContainerStyle={styles.mainContent}>
          <Text style={styles.title}>Ride Request</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButtonType, requestType === 'ride' && styles.activeToggle]}
              onPress={() => setRequestType('ride')}
            >
              <Text style={[styles.toggleText, requestType === 'ride' && styles.activeToggleText]}>Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButtonType, requestType === 'pickup' && styles.activeToggle]}
              onPress={() => setRequestType('pickup')}
            >
              <Text style={[styles.toggleText, requestType === 'pickup' && styles.activeToggleText]}>Pickup</Text>
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
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Submit Request</Text>}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 20,
    backgroundColor: '#F7F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    zIndex: 10,
  },
  navLogo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003E7E',
  },
  toggleButton: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 30,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#F7F9FC',
    paddingTop: 60,
    paddingHorizontal: 15,
    zIndex: 9,
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#003E7E',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003E7E',
  },
  sidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  sidebarButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#003E7E',
    fontWeight: '600',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 15,
  },
  container: {
    flex: 1,
  },
  mainContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#003E7E',
    textAlign: 'center',
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleButtonType: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#003E7E',
    borderRadius: 30,
    marginHorizontal: 10,
  },
  activeToggle: {
    backgroundColor: '#003E7E',
  },
  toggleText: {
    fontSize: 18,
    color: '#003E7E',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#fff',
  },
  form: {
    backgroundColor: '#F7F9FC',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
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
    backgroundColor: '#003E7E',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
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
});

export default RideRequestScreen;