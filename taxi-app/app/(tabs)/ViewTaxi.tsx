import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getToken, fetchData } from "../api/api";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

const { width } = Dimensions.get("window");
const apiUrl = "https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev";

// Define Taxi type
interface Taxi {
  _id: string;
  numberPlate: string;
  currentStop: string;
  status: string;
}

const ViewTaxi: React.FC = () => {
  const [startLocation, setStartLocation] = useState<string>("");
  const [endLocation, setEndLocation] = useState<string>("");
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const navigation = useNavigation<StackNavigationProp<any, "ViewTaxi">>();

  // Fetch taxis based on search criteria
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

  // Render each taxi row
  const renderTaxi = ({ item }: { item: Taxi }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.numberPlate}</Text>
      <Text style={styles.tableCell}>{item.currentStop}</Text>
      <Text style={styles.tableCell}>{item.status}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.monitorButton}
          onPress={() =>
            navigation.navigate("Home", { acceptedTaxiId: item._id })
          }
        >
          <Text style={styles.actionButtonText}>Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestButton}>
          <Text style={styles.actionButtonText}>Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#0F2027", "#203A43", "#2C5364"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
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
            {loading ? "Searching..." : "Find Taxis"}
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
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <FontAwesome name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("LiveChat")}
        >
          <FontAwesome name="comment" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("TaxiManagement")}
        >
          <FontAwesome name="map" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <FontAwesome name="user" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 100, // To avoid overlapping the bottom nav
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#E94560",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.9)",
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
    backgroundColor: "rgba(255,255,255,0.9)",
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
  navBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(233, 69, 96, 0.9)",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 10,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ViewTaxi;
