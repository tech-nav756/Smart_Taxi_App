import React, { useEffect, useState, useRef } from 'react';
 import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Animated,
 } from 'react-native';
 import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
 import { fetchData } from '../api/api';
 import AsyncStorage from '@react-native-async-storage/async-storage';
 import { useNavigation } from '@react-navigation/native';
 import { StackNavigationProp } from '@react-navigation/stack';
 import { LinearGradient } from 'expo-linear-gradient';
 import { useAuth } from '../context/authContext';

 const apiUrl = 'https://fluffy-space-trout-7vgv67xv9xrhw77-3000.app.github.dev';

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

 const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any, 'Home'>>();
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaxiFormVisible, setIsTaxiFormVisible] = useState(false);
  const [numberPlate, setNumberPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [currentStop, setCurrentStop] = useState('');
  const [routeName, setRouteName] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);

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
     Alert.alert('Error', 'Failed to update profile');
    }
   }
  };

  const handleUpgradeRole = async () => {
   if (roles.includes('driver')) {
    Alert.alert('You are already a driver.');
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
      Alert.alert('Success', 'You are now a driver.');
     }
    } catch (error) {
     Alert.alert('Error', 'Failed to upgrade role');
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

  const handleNavigate = (screen: string) => {
   navigation.navigate(screen);
  };

  const toggleSidebar = () => {
   setSidebarVisible(!sidebarVisible);
  };

  if (isLoading) {
   return (
    <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
     <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#003E7E" />
     </View>
    </LinearGradient>
   );
  }

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
      <View style={styles.header}>
       <Image
        source={{ uri: user?.profilePic }}
        style={[styles.profilePic, { borderColor: '#003E7E' }]} // Blue border
       />
       <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
        <AntDesign name="edit" size={20} color="#003E7E" /> {/* Ensure edit button is visible */}
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
   paddingHorizontal: 20,
   paddingTop: 40,
  },
  loadingContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
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
   backgroundColor: '#003E7E', // Blue edit button
   borderRadius: 20,
   padding: 5,
  },
  detailsContainer: {
   marginTop: 20,
   backgroundColor: '#F7F9FC', // White background
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
   color: '#000', // Black text
  },
  infoContainer: {
   marginBottom: 20,
  },
  infoText: {
   fontSize: 16,
   marginBottom: 10,
   color: '#000', // Black text
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
   color: '#000', // Black text
  },
  saveButton: {
   backgroundColor: '#003E7E', // Blue save button
   padding: 12,
   borderRadius: 8,
   alignItems: 'center',
  },
  saveButtonText: {
   color: '#fff', // White text
   fontWeight: 'bold',
  },
  buttonContainer: {
   marginTop: 30,
  },
  upgradeButton: {
   backgroundColor: '#003E7E',
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
   backgroundColor: '#000',
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
   backgroundColor: '#F7F9FC', // White background
   padding: 20,
   borderRadius: 10,
   shadowColor: '#000',
   shadowOpacity: 0.1,
   shadowRadius: 10,
   shadowOffset: { width: 0, height: 5 },
  },
  addTaxiButton: {
   backgroundColor: '#003E7E',
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
 });

 export default ProfileScreen;