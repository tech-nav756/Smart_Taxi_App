import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Save token to AsyncStorage
const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

// Get token from AsyncStorage
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

// Remove token from AsyncStorage (logout functionality)
const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Fetch data function (non-async)
const fetchData = async (apiUrl: string, endpoint: string, options: any = {}): Promise<any> => {
  const url = `${apiUrl}/${endpoint}`;
  const method = options.method || 'GET'; // Default to GET if no method is provided

  const token = await getToken(); // Retrieve the token

  try {
    const response = await axios({
      url,
      method,
      headers: {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
      data: options.body || null, // Add the body for POST or PUT requests
    });

    return response.data;
  } catch (error) {
    console.error(`API request failed: ${error}`);
    throw error; // Propagate the error to handle it in the component
  }
};

export { fetchData, saveToken, getToken, removeToken };
