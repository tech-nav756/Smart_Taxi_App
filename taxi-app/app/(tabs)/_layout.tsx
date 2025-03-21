import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './Auth';
import Home from './index';
import { getToken } from '../api/api'; // Assuming getToken checks for an auth token
import { View, Text } from 'react-native';

const Stack = createStackNavigator();

export default function TabLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the user is authenticated (by checking a stored token)
    const checkAuthStatus = async () => {
      const token = await getToken(); // Assuming getToken fetches the token
      setIsAuthenticated(!!token); // Set authentication status based on the presence of a token
    };

    checkAuthStatus();
  }, []); // Empty dependency array ensures it runs once on mount

  if (isAuthenticated === null) {
    // If still checking authentication, show a loading screen or nothing
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        // Show Home screen if user is authenticated
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      ) : (
        // Show Auth screen if user is not authenticated
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
