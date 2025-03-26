import React, { useEffect, useState } from 'react';
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
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchData, getToken } from '../api/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const apiUrl = 'https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev/api';

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

  const navigation = useNavigation<StackNavigationProp<any, 'TaxiManagement'>>();

  // Fetch taxi data
  const loadTaxis = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'No authentication token found. Please login.');
        setLoading(false);
        return;
      }
      const data = await fetchData(apiUrl, 'taxis/driver-taxi');
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

  // Fetch stops for a taxi
  const fetchStopsForTaxi = async (taxiId: string) => {
    try {
      const data = await fetchData(apiUrl, `taxis/${taxiId}/stops`);
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

  // Open modal for selected taxi
  const handleActionPress = (taxi: Taxi) => {
    setSelectedTaxi(taxi);
    setUpdateType(null);
    setNewStatus(statusOptions[0]);
    setNewLoad(taxi.currentLoad.toString());
    setStopOptions([]);
    setNewStop('');
    setModalVisible(true);
  };

  // Fetch stops when updating stop
  useEffect(() => {
    if (updateType === 'stop' && selectedTaxi) {
      fetchStopsForTaxi(selectedTaxi._id);
    }
  }, [updateType, selectedTaxi]);

  // Handle update submission
  const handleUpdate = async () => {
    if (!selectedTaxi || !updateType) {
      Alert.alert('Error', 'Please select an update option.');
      return;
    }

    let endpoint = '';
    let body = {};

    if (updateType === 'status') {
      endpoint = `taxis/${selectedTaxi._id}/status`;
      body = { status: newStatus };
    } else if (updateType === 'stop') {
      endpoint = `taxis/${selectedTaxi._id}/currentStopManual`;
      body = { currentStop: newStop };
    } else if (updateType === 'load') {
      endpoint = `taxis/${selectedTaxi._id}/load`;
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

  return (
    <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.gradient}>
      <View style={styles.container}>
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

        {/* Modal for updating taxi details */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedTaxi && (
                <>
                  <Text style={styles.modalTitle}>Update Taxi: {selectedTaxi.numberPlate}</Text>
                  {/* Option selection */}
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
                  {/* Update form based on selected option */}
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
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Home")}>
          <FontAwesome name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("LiveChat")}>
          <FontAwesome name="comment" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("TaxiManagement")}>
          <FontAwesome name="map" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Profile")}>
          <FontAwesome name="user" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default TaxiManagement;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    marginBottom: 100, // space for nav bar
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 18,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    backgroundColor: '#007BFF',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
