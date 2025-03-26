import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, FlatList } from 'react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { fetchData } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/authContext';

const apiUrl = 'https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any, 'Home'>>();
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaxiFormVisible, setIsTaxiFormVisible] = useState(false);
  const [numberPlate, setNumberPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [currentStop, setCurrentStop] = useState('');
  const [routeName, setRouteName] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const endpoint = 'api/users/get-user';
          const response = await fetchData(apiUrl, endpoint, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response?.user) {
            setUser(response.user);
            setName(response.user.name);
            setPhone(response.user.phone);
            setRoles(response.user.role);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          Alert.alert('Error', 'Failed to fetch user data.');
        }
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetchData(apiUrl, 'api/users/update-details', {
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
        const response = await fetchData(apiUrl, 'api/users/upgrade-role', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response?.user) {
          setRoles(response.user.roles);
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
        const response = await fetchData(apiUrl, 'api/taxis/addTaxi', {
          method: 'POST',
          body: {
            numberPlate,
            routeName,
            capacity: parseInt(capacity, 10),
            currentStop,
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
      <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4b2b" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image source={{ uri: user?.profilePic }} style={styles.profilePic} />
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
            <AntDesign name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          {isEditing ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor="#aaa"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
          {/* Only show Upgrade button if the user is not already a driver */}
          {!roles.includes('driver') && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeRole}>
              <Text style={styles.upgradeButtonText}>Upgrade to Driver</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {roles.includes('driver') && (
          <View style={styles.taxiSection}>
            <TouchableOpacity style={styles.addTaxiButton} onPress={() => setIsTaxiFormVisible(!isTaxiFormVisible)}>
              <Text style={styles.addTaxiButtonText}>{isTaxiFormVisible ? 'Cancel' : 'Add Taxi'}</Text>
            </TouchableOpacity>
            {isTaxiFormVisible && (
              <View style={styles.taxiForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Number Plate"
                  placeholderTextColor="#aaa"
                  value={numberPlate}
                  onChangeText={setNumberPlate}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Capacity"
                  placeholderTextColor="#aaa"
                  value={capacity}
                  keyboardType="numeric"
                  onChangeText={setCapacity}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Current Stop"
                  placeholderTextColor="#aaa"
                  value={currentStop}
                  onChangeText={setCurrentStop}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Route Name"
                  placeholderTextColor="#aaa"
                  value={routeName}
                  onChangeText={setRouteName}
                />
                <TouchableOpacity style={styles.saveButton} onPress={handleAddTaxi}>
                  <Text style={styles.saveButtonText}>Save Taxi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    marginBottom: 100, // space for nav bar
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
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
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#ff4b2b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
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
  upgradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  taxiSection: {
    marginTop: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
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
  addTaxiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  taxiForm: {
    marginTop: 20,
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

export default ProfileScreen;
