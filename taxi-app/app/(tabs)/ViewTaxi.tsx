import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getToken, fetchData } from "../api/api";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get("window");
const apiUrl = "https://fluffy-space-trout-7vgv67xv9xrhw77-3000.app.github.dev";

interface Taxi {
  _id: string;
  numberPlate: string;
  currentStop: string;
  status: string;
}

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
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate("ViewTaxi"); onClose(); }}>
        <MaterialIcons name="directions-car" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>View Taxis</Text>
      </TouchableOpacity>
      <View style={styles.sidebarDivider} />
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate("ViewRequests"); onClose(); }}>
        <FontAwesome name="search" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Search Rides</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate("LiveChat"); onClose(); }}>
        <FontAwesome name="comment" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Live Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate("TaxiManagement"); onClose(); }}>
        <FontAwesome name="map" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Manage Taxi</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton} onPress={() => { onNavigate("Profile"); onClose(); }}>
        <FontAwesome name="user" size={22} color="#003E7E" />
        <Text style={styles.sidebarButtonText}>Profile</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ViewTaxi: React.FC = () => {
  const [startLocation, setStartLocation] = useState<string>("");
  const [endLocation, setEndLocation] = useState<string>("");
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const navigation = useNavigation<StackNavigationProp<any, "ViewTaxi">>();

  const searchTaxis = async () => {
    if (!startLocation || !endLocation) {
      alert("Please enter both start and end locations.");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please log in.");
        setLoading(false);
        return;
      }
      const endpoint = `api/taxis/search?startLocation=${startLocation}&endLocation=${endLocation}`;
      const response = await fetchData(apiUrl, endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response && response.taxis) {
        setTaxis(response.taxis);
      } else {
        setTaxis([]);
      }
    } catch (error) {
      console.error("Error fetching taxis:", error);
      alert("Failed to fetch taxis. Please try again.");
    }
    setLoading(false);
  };

  const renderTaxi = ({ item }: { item: Taxi }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.numberPlate}</Text>
      <Text style={styles.tableCell}>{item.currentStop}</Text>
      <Text style={styles.tableCell}>{item.status}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.monitorButton}
          onPress={() => navigation.navigate("Home", { acceptedTaxiId: item._id })}
        >
          <Text style={styles.actionButtonText}>Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestButton}>
          <Text style={styles.actionButtonText}>Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen);
  };
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <LinearGradient colors={["#FFFFFF", "#E8F0FE"]} style={styles.gradient}>
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
        <View style={styles.mainContent}>
          <Text style={styles.title}>Search Available Taxis</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Start Location"
            placeholderTextColor="#aaa"
            value={startLocation}
            onChangeText={setStartLocation}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter End Location"
            placeholderTextColor="#aaa"
            value={endLocation}
            onChangeText={setEndLocation}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={searchTaxis}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : "Find Taxis"}
            </Text>
          </TouchableOpacity>
          <FlatList
            data={taxis}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={() =>
              taxis.length > 0 && (
                <View style={styles.tableHeader}>
                  <Text style={styles.tableCellHeader}>Plate</Text>
                  <Text style={styles.tableCellHeader}>Current Stop</Text>
                  <Text style={styles.tableCellHeader}>Status</Text>
                  <Text style={styles.tableCellHeader}>Actions</Text>
                </View>
              )
            }
            renderItem={renderTaxi}
            ListEmptyComponent={() =>
              !loading ? <Text style={styles.noResults}>No taxis found.</Text> : null
            }
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 20,
    backgroundColor: "#F7F9FC",
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    zIndex: 10,
  },
  navLogo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003E7E",
  },
  toggleButton: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 30,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: "#F7F9FC",
    paddingTop: 60,
    paddingHorizontal: 15,
    zIndex: 9,
    borderRightWidth: 1,
    borderRightColor: "#DDD",
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#003E7E",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003E7E",
  },
  sidebarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  sidebarButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#003E7E",
    fontWeight: "600",
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: "#DDD",
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
    fontWeight: "700",
    color: "#003E7E",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#F7F9FC",
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#003E7E",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F7F9FC",
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#F7F9FC",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  tableCell: {
    flex: 1,
    color: "#333",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  monitorButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  requestButton: {
    backgroundColor: "#28a745",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noResults: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 18,
    color: "#aaa",
  },
});

export default ViewTaxi;