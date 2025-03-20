// /screens/Home.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { fetchData } from '../api/api'; // Importing the API service

const Home = () => {
  const [data, setData] = useState<any>(null); // State to store the fetched data
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

     const API_URL = 'https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev'; // e.g., https://xyz-5000.githubpreview.dev


  // Fetch data from the /test endpoint when the component mounts
  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const apiData = await fetchData(API_URL, 'test'); // Call the /test endpoint
        setData(apiData); // Set data on successful API response
      } catch (err: any) {
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  const handleRetry = () => {
    setError(null); // Clear any previous error
    setLoading(true); // Set loading to true for retry
    setData(null); // Reset the data
    fetchData(API_URL, 'test') // Retry fetching the data
      .then(apiData => {
        setData(apiData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch data again.');
        setLoading(false);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" /> // Loading indicator
      ) : error ? (
        <>
          <Text style={{ color: 'red' }}>{error}</Text>
          <Button title="Retry" onPress={handleRetry} /> // Retry button if error occurs
        </>
      ) : data ? (
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>API Data:</Text>
          <Text>{JSON.stringify(data, null, 2)}</Text> // Display the data in JSON format
        </View>
      ) : (
        <Text>No data fetched yet.</Text>
      )}
    </View>
  );
};

export default Home;
