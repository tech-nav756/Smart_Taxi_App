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
import { fetchData, getToken } from '../api/api'; // Import your API helpers

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

  // Fetch taxi data from the API
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

  // Function to fetch stops for a taxi using the new backend endpoint
  const fetchStopsForTaxi = async (taxiId: string) => {
    try {
      const data = await fetchData(apiUrl, `taxis/${taxiId}/stops`);
      if (data && data.stops) {
        // Map stops to their names
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

  // Open modal for a selected taxi
  const handleActionPress = (taxi: Taxi) => {
    setSelectedTaxi(taxi);
    setUpdateType(null);
    setNewStatus(statusOptions[0]);
    setNewLoad(taxi.currentLoad.toString());
    // Reset stops until fetched
    setStopOptions([]);
    setNewStop('');
    setModalVisible(true);
  };

  // When user selects "stop" update, fetch the stops list for the taxi.
  useEffect(() => {
    if (updateType === 'stop' && selectedTaxi) {
      fetchStopsForTaxi(selectedTaxi._id);
    }
  }, [updateType, selectedTaxi]);

  // Handle update submission based on the selected update type
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
      // Call the new endpoint to update current stop manually
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
      // Use PUT method for updates
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

  // Render each taxi row
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
    <View style={styles.container}>
      <Text style={styles.title}>Taxi Management</Text>
      {loading ? (
        <Text>Loading taxis...</Text>
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
                    <Picker
                      selectedValue={newStatus}
                      onValueChange={(itemValue) => setNewStatus(itemValue)}>
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
                      <Text>Loading stops...</Text>
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
  );
};

export default TaxiManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    backgroundColor: '#eee',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionContainer: {
    marginVertical: 12,
  },
  optionTitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
