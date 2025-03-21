import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router'; // For navigation
import AuthScreen from './Auth'; // Import AuthScreen

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AuthScreen /> {/* Include AuthScreen as part of your layout */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
});
