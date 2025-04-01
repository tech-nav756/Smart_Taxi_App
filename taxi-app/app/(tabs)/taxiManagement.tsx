import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Button,
  StyleSheet,
  TextInput,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchData, getToken } from '../api/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import io from 'socket.io-client';

const apiUrl = 'https://shesha.onrender.com';

type Taxi = {
  _id: string;
  numberPlate: string;
  status: string;
  currentStop: string;
  currentLoad: number;
};

type Stop = {
  name: string;
  order: number;
};

type UpdateType = 'status' | 'stop' | 'load' | null;

const statusOptions = [
  'waiting',
  'available',
  'roaming',
  'almost full',
  'full',
  'on trip',
  'not available',
];

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

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

const TaxiManagement: React.FC = () => {
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedTaxi, setSelectedTaxi] = useState<Taxi | null>(null);
  const [updateType, setUpdateType] = useState<UpdateType>(null);
  const [newStatus, setNewStatus] = useState<string>(statusOptions[0]);
  const [newStop, setNewStop] = useState<string>('');
  const [newLoad, setNewLoad] = useState<string>('0');
  const [stopOptions, setStopOptions] = useState<string[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  const navigation = useNavigation<StackNavigationProp<any, 'TaxiManagement'>>();

  useEffect(() => {
    const newSocket = io(apiUrl);
    setSocket(newSocket);
    newSocket.on('taxiUpdate', (updatedTaxi: Taxi) => {
      setTaxis((currentTaxis) =>
        currentTaxis.map((taxi) =>
          taxi._id === updatedTaxi._id ? updatedTaxi : taxi
        )
      );
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const loadTaxis = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'No authentication token found. Please login.');
        setLoading(false);
        return;
      }
      const data = await fetchData(apiUrl, 'api/taxis/driver-taxi');
      if (data && data.taxis) {
        setTaxis(data.taxis);
      } else {
        Alert.alert('Error', 'No taxi data available.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load taxis.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxis();
  }, []);

  const fetchStopsForTaxi = async (taxiId: string) => {
    try {
      const data = await fetchData(apiUrl, `api/taxis/${taxiId}/stops`);
      if (data && data.stops) {
        const names = data.stops.map((stop: Stop) => stop.name);
        setStopOptions(names);
        setNewStop(names[0] || '');
      } else {
        setStopOptions([]);
        setNewStop('');
      }
    } catch (error) {
      console.error('Error fetching stops:', error);
      setStopOptions([]);
      setNewStop('');
    }
  };

  const handleActionPress = (taxi: Taxi) => {
    setSelectedTaxi(taxi);
    setUpdateType(null);
    setNewStatus(statusOptions[0]);
    setNewLoad(taxi.currentLoad.toString());
    setStopOptions([]);
    setNewStop('');
    setModalVisible(true);
  };

  useEffect(() => {
    if (updateType === 'stop' && selectedTaxi) {
      fetchStopsForTaxi(selectedTaxi._id);
    }
  }, [updateType, selectedTaxi]);

  const handleUpdate = async () => {
    if (!selectedTaxi || !updateType) {
      Alert.alert('Error', 'Please select an update option.');
      return;
    }

    let endpoint = '';
    let body = {};

    if (updateType === 'status') {
      endpoint = `api/taxis/${selectedTaxi._id}/status`;
      body = { status: newStatus };
    } else if (updateType === 'stop') {
      endpoint = `api/taxis/${selectedTaxi._id}/currentStopManual`;
      body = { currentStop: newStop };
    } else if (updateType === 'load') {
      endpoint = `api/taxis/${selectedTaxi._id}/load`;
      const parsedLoad = parseInt(newLoad, 10);
      if (isNaN(parsedLoad)) {
        Alert.alert('Error', 'Please enter a valid number for load.');
        return;
      }
      body = { newLoad: parsedLoad };
    }

    try {
      const response = await fetchData(apiUrl, endpoint, {
        method: 'PUT',
        body,
      });
      Alert.alert('Success', response.message || 'Update successful.');
      loadTaxis();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Update failed.');
      console.error(error);
    }
  };

  const renderTaxi = ({ item }: { item: Taxi }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.numberPlate}</Text>
      <Text style={styles.cell}>{item.status}</Text>
      <Text style={styles.cell}>{item.currentStop}</Text>
      <Text style={styles.cell}>{item.currentLoad}</Text>
      <TouchableOpacity style={styles.actionButton} onPress={() => handleActionPress(item)}>
        <Text style={styles.actionButtonText}>Action</Text>
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
          <Text style={styles.title}>Taxi Management</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading taxis...</Text>
          ) : (
            <FlatList
              data={taxis}
              keyExtractor={(item) => item._id}
              renderItem={renderTaxi}
              ListHeaderComponent={
                <View style={styles.headerRow}>
                  <Text style={styles.headerCell}>Number Plate</Text>
                  <Text style={styles.headerCell}>Status</Text>
                  <Text style={styles.headerCell}>Current Stop</Text>
                  <Text style={styles.headerCell}>Load</Text>
                  <Text style={styles.headerCell}>Action</Text>
                </View>
              }
            />
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {selectedTaxi && (
                  <>
                    <Text style={styles.modalTitle}>Update Taxi: {selectedTaxi.numberPlate}</Text>
                    {!updateType && (
                      <View style={styles.optionContainer}>
                        <Text style={styles.optionTitle}>Select update type:</Text>
                        <View style={styles.optionButtons}>
                          <Button title="Status" onPress={() => setUpdateType('status')} />
                          <Button title="Stop" onPress={() => setUpdateType('stop')} />
                          <Button title="Load" onPress={() => setUpdateType('load')} />
                        </View>
                      </View>
                    )}
                    {updateType === 'status' && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Select new status:</Text>
                        <Picker selectedValue={newStatus} onValueChange={(itemValue) => setNewStatus(itemValue)}>
                          {statusOptions.map((status) => (
                            <Picker.Item key={status} label={status} value={status} />
                          ))}
                        </Picker>
                      </View>
                    )}
                    {updateType === 'stop' && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Select new stop:</Text>
                        {stopOptions.length ? (
                          <Picker selectedValue={newStop} onValueChange={(itemValue) => setNewStop(itemValue)}>
                            {stopOptions.map((stop) => (
                              <Picker.Item key={stop} label={stop} value={stop} />
                            ))}
                          </Picker>
                        ) : (
                          <Text style={styles.loadingText}>Loading stops...</Text>
                        )}
                      </View>
                    )}
                    {updateType === 'load' && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Enter new load:</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={newLoad}
                          onChangeText={setNewLoad}
                        />
                      </View>
                    )}
                    <View style={styles.modalButtons}>
                      <Button title="Cancel" onPress={() => setModalVisible(false)} />
                      {updateType && <Button title="Submit" onPress={handleUpdate} />}
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>
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
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#003E7E',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#003E7E',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 18,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#F7F9FC',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#F7F9FC',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#003E7E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#F7F9FC',
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  optionContainer: {
    marginVertical: 12,
  },
  optionTitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  optionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  formGroup: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});

export default TaxiManagement;