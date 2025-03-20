// /components/ApiService.ts
import axios from 'axios';

// Function to make the API call
export const fetchData = async (apiUrl: string, endpoint: string) => {
  try {
    // Constructing the full URL for the request
    const url = `${apiUrl}/${endpoint}`;
    const response = await axios.get(url);
    return response.data; // Returning the data from the response
  } catch (error) {
    console.error(`API request failed: ${error}`);
    throw error; // Propagate the error to handle in the component
  }
};
