import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { fetchData, getToken } from '../api/api';

const apiUrl = "https://miniature-space-disco-g479vv79659pfw5jq-3000.app.github.dev";

const RideRequestScreen: React.FC = () => {
  const [requestType, setRequestType] = useState<'ride' | 'pickup'>('ride');
  const [startingStop, setStartingStop] = useState<string>('');
  const [destinationStop, setDestinationStop] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Retrieve token explicitly.
      const token = await getToken();
      if (!token) {
        setError('Not authorized. Please log in.');
        setLoading(false);
        return;
      }

      let endpoint = '';
      let body: any = {};

      if (requestType === 'ride') {
        if (!startingStop || !destinationStop) {
          setError('Both starting and destination stops are required for a ride request.');
          setLoading(false);
          return;
        }
        endpoint = 'api/rideRequest/ride';
        body = { startingStop, destinationStop };
      } else {
        // For pickup, only the starting stop is needed.
        if (!startingStop) {
          setError('Starting stop is required for a pickup request.');
          setLoading(false);
          return;
        }
        endpoint = 'api/rideRequest/pickup';
        body = { startingStop };
      }

      // Call the appropriate endpoint.
      const data = await fetchData(apiUrl, endpoint, {
        method: 'POST',
        body,
      });

      // The backend returns the created request along with route and eligible taxis.
      setSuccessMessage('Request submitted successfully!');
      // Reset the form fields.
      setStartingStop('');
      setDestinationStop('');
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Request</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, requestType === 'ride' && styles.activeToggle]}
          onPress={() => setRequestType('ride')}
        >
          <Text style={[styles.toggleText, requestType === 'ride' && styles.activeToggleText]}>
            Ride
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, requestType === 'pickup' && styles.activeToggle]}
          onPress={() => setRequestType('pickup')}
        >
          <Text style={[styles.toggleText, requestType === 'pickup' && styles.activeToggleText]}>
            Pickup
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Starting Stop:</Text>
        <TextInput
          style={styles.input}
          value={startingStop}
          onChangeText={setStartingStop}
          placeholder="Enter starting stop"
        />

        {requestType === 'ride' && (
          <>
            <Text style={styles.label}>Destination Stop:</Text>
            <TextInput
              style={styles.input}
              value={destinationStop}
              onChangeText={setDestinationStop}
              placeholder="Enter destination stop"
            />
          </>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  activeToggle: {
    backgroundColor: '#007bff',
  },
  toggleText: {
    color: '#007bff',
    fontSize: 16,
  },
  activeToggleText: {
    color: '#fff',
  },
  form: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RideRequestScreen;
