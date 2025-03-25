import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { getToken, fetchData } from "../api/api"; // Import the custom functions

// Define Taxi type
interface Taxi {
  _id: string;
  numberPlate: string;
  currentStop: string;
  status: string;
}

// Main Component
const ViewTaxi: React.FC = () => {
  const apiUrl = "https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev"
  const [startLocation, setStartLocation] = useState<string>("");
  const [endLocation, setEndLocation] = useState<string>("");
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response && response.taxis) {
        setTaxis(response.taxis);
      } else {
        setTaxis([]); // No taxis found
      }
    } catch (error) {
      console.error("Error fetching taxis:", error);
      alert("Failed to fetch taxis. Please try again.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Available Taxis</Text>

      {/* Search Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Enter Start Location"
        value={startLocation}
        onChangeText={setStartLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter End Location"
        value={endLocation}
        onChangeText={setEndLocation}
      />

      {/* Search Button */}
      <TouchableOpacity style={styles.button} onPress={searchTaxis} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Searching..." : "Find Taxis"}</Text>
      </TouchableOpacity>

      {/* Taxi Results Table */}
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
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.numberPlate}</Text>
            <Text style={styles.tableCell}>{item.currentStop}</Text>
            <Text style={styles.tableCell}>{item.status}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.monitorButton}>
                <Text style={styles.buttonText}>Monitor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.requestButton}>
                <Text style={styles.buttonText}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.noResults}>No taxis found.</Text> : null}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableCell: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
  },
  monitorButton: {
    backgroundColor: "#17a2b8",
    padding: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  requestButton: {
    backgroundColor: "#28a745",
    padding: 6,
    borderRadius: 3,
  },
  noResults: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    color: "#888",
  },
});

export default ViewTaxi;
