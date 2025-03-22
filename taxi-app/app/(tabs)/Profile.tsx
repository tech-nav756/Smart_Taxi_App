import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, FlatList } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { fetchData } from '../api/api'; // Your custom fetchData function
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // React Navigation
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/authContext'; // Importing auth context

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any, 'Home'>>();
  const { logout } = useAuth(); // Using auth context
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state for data fetching
  const [isTaxiFormVisible, setIsTaxiFormVisible] = useState(false); // State to toggle taxi form visibility
  const [numberPlate, setNumberPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [routeName, setRouteName] = useState('');


  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await AsyncStorage.getItem('authToken');
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
            setUser(response.user); // Set the user data
            setName(response.user.name);
            setPhone(response.user.phone);
            setRoles(response.user.role); // Set roles from response
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          Alert.alert('Error', 'Failed to fetch user data.');
        }
      }
      setIsLoading(false); // Set loading to false once the data is fetched
    };

    fetchUserProfile();
  }, []); // Empty dependency array to fetch data only once when the component mounts

  const handleSave = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetchData('https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev', 'api/users/update-details', {
          method: 'PUT',
          body: { name, phone },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response?.user) {
          setUser(response.user);
          setIsEditing(false);
        }
        navigation.navigate('Profile');
      } catch (error) {
        Alert.alert("Error", "Failed to update profile");
      }
    }
  };

  const handleUpgradeRole = async () => {
    if (roles.includes('driver')) {
      Alert.alert("You are already a driver.");
      return;
    }

    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetchData('https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev', 'api/users/upgrade-role', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response?.user) {
          setRoles(response.user.roles); // Update roles
          Alert.alert("Success", "You are now a driver.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to upgrade role");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Auth');
  };

  const handleAddTaxi = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetchData('https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev', 'api/taxis/addTaxi', {
          method: 'POST',
          body: {
            numberPlate,
            routeName, // Send routeName here
            capacity: parseInt(capacity, 10),
            location,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response?.taxi) {
          Alert.alert('Success', 'Taxi added successfully!');
            navigation.goBack(); 
          setIsTaxiFormVisible(false);
        } else {
          Alert.alert('Error', 'Failed to add taxi.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to add taxi.');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4b2b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: user?.profilePic }} style={styles.profilePic} />
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
          <AntDesign name="edit" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>Profile Details</Text>

        {isEditing ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Name: {user?.name}</Text>
            <Text style={styles.infoText}>Email: {user?.email}</Text>
            <Text style={styles.infoText}>Phone: {user?.phone}</Text>
            <Text style={styles.infoText}>Roles: {roles.join(', ')}</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeRole}>
          <Text style={styles.upgradeText}>Upgrade to Driver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {roles.includes('driver') && (
        <View style={styles.taxiSection}>
          <TouchableOpacity style={styles.addTaxiButton} onPress={() => setIsTaxiFormVisible(!isTaxiFormVisible)}>
            <Text style={styles.addTaxiText}>{isTaxiFormVisible ? 'Cancel' : 'Add Taxi'}</Text>
          </TouchableOpacity>

          {isTaxiFormVisible && (
            <View style={styles.taxiForm}>

       <TextInput
        style={styles.input}
        placeholder="Number Plate"
        value={numberPlate}
        onChangeText={setNumberPlate}
      />
      <TextInput
        style={styles.input}
        placeholder="Capacity"
        value={capacity}
        keyboardType="numeric"
        onChangeText={setCapacity}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Route Name"
        value={routeName}
        onChangeText={setRouteName}
      />

              <TouchableOpacity style={styles.saveButton} onPress={handleAddTaxi}>
                <Text style={styles.saveText}>Save Taxi</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },  
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    marginBottom: 10,
  },
  editButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#ff4b2b',
    borderRadius: 20,
    padding: 5,
  },
  detailsContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#ff4b2b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 30,
  },
  upgradeButton: {
    backgroundColor: '#34c759',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  taxiSection: {
    marginTop: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  addTaxiButton: {
    backgroundColor: '#34c759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTaxiText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  taxiForm: {
    marginTop: 20,
  },
});

export default ProfileScreen;
