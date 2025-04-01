import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchData, getToken } from '../api/api';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface RideRequest {
  _id: string;
  passenger: string;
  startingStop: string;
  destinationStop: string;
  requestType: string;
  status: string;
}

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const apiUrl = 'https://shesha.onrender.com';

const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose, onNavigate }) => {
  const slideAnim = useRef(new Animated.Value(-250)).current;
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

const ViewRequestScreen: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const navigation = useNavigation<StackNavigationProp<any, 'ViewRequests'>>();

  const fetchNearbyRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      const data = await fetchData(apiUrl, 'api/rideRequest/driver/nearby', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests(data.rideRequests || []);
    } catch (err: any) {
      console.error('Error fetching nearby requests:', err);
      setError(err.message || 'Failed to fetch nearby requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      await fetchData(apiUrl, `api/rideRequest/accept/${requestId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert('Success', 'Request accepted.');
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (err: any) {
      console.error('Error accepting request:', err);
      Alert.alert('Error', err.message || 'Failed to accept request.');
    }
  };

  const renderItem = ({ item }: { item: RideRequest }) => (
    <View style={styles.requestItem}>
      <Text style={styles.requestText}>Passenger: {item.passenger}</Text>
      <Text style={styles.requestText}>Starting Stop: {item.startingStop}</Text>
      <Text style={styles.requestText}>Destination Stop: {item.destinationStop}</Text>
      <Text style={styles.requestText}>Type: {item.requestType}</Text>
      <Text style={styles.requestText}>Status: {item.status}</Text>
      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item._id)}>
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.title}>Nearby Ride/Pickup Requests</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#003E7E" />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={<Text style={styles.emptyText}>No nearby requests found.</Text>}
            />
          )}
          <TouchableOpacity style={styles.refreshButton} onPress={fetchNearbyRequests}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#003E7E',
  },
  listContainer: {
    paddingBottom: 16,
  },
  requestItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F7F9FC',
  },
  requestText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#003E7E',
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 16,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#003E7E',
    borderRadius: 5,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ViewRequestScreen;