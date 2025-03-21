// /components/ApiService.ts
import axios from 'axios';

export const fetchData = async (apiUrl: string, endpoint: string, options: any = {}) => {
  try {
    const url = `${apiUrl}/${endpoint}`;
    const method = options.method || 'GET'; // Default to GET if no method is provided

    const response = await axios({
      url,
      method,
      headers: options.headers || { 'Content-Type': 'application/json' },
      data: options.body || null, // Add the body for POST or PUT requests
    });

    return response.data;
  } catch (error) {
    console.error(`API request failed: ${error}`);
    throw error; // Propagate the error to handle it in the component
  }
};
