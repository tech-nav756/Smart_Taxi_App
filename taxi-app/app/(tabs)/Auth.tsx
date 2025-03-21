import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useNavigation } from '@react-navigation/native'; // React Navigation
import { StackNavigationProp } from '@react-navigation/stack';

import { fetchData, saveToken } from "../api/api"; // Importing functions for fetching and saving token

const AuthScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");  // Only needed for signup
  const translateX = new Animated.Value(0);
  const navigation = useNavigation<StackNavigationProp<any, 'Auth'>>();

  const toggleAuthMode = () => {
    Animated.timing(translateX, {
      toValue: isSignUp ? 0 : -100,
      duration: 500,
      useNativeDriver: false,
    }).start();
    setIsSignUp(!isSignUp);
  };

  // Handle user sign up
  const handleSignUpSubmit = async () => {
    const apiUrl = "https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev"; // Backend URL
    const endpoint = "auth/register";
    const body = { name, email, password };

    try {
      const response = await fetchData(apiUrl, endpoint, { method: "POST", body });

      if (response?.token) {
        await saveToken(response.token); // Save token on successful sign up
      }

      Alert.alert("Success", `Welcome ${name}!`);
      navigation.navigate('Home');  // Redirect to Home screen after sign up
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  // Handle user login
  const handleLoginSubmit = async () => {
    const apiUrl = "https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev"; // Backend URL
    const endpoint = "auth/login";
    const body = { email, password };

    try {
      const response = await fetchData(apiUrl, endpoint, { method: "POST", body });

      if (response?.token) {
        await saveToken(response.token); // Save token on successful login
      }

      Alert.alert("Success", "Welcome back!");
      navigation.navigate('Home');  // Redirect to Home screen after login
    } catch (error) {
      Alert.alert("Error", "Invalid credentials. Please try again.");
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual client ID
    });

    if (response?.type === 'success') {
      const { id_token } = response.params;

      const apiUrl = "http://your-backend-url"; // Replace with your backend URL
      const endpoint = isSignUp ? "auth/google/signup" : "auth/google/login"; 

      try {
        const response = await fetchData(apiUrl, endpoint, {
          method: "POST",
          body: { token: id_token },
        });

        if (response?.token) {
          await saveToken(response.token);  // Save token from Google login
        }

        Alert.alert("Success", `Welcome ${isSignUp ? "new user" : "back!"}`);
        navigation.navigate('Home');  // Navigate to home after Google login
      } catch (error) {
        Alert.alert("Error", "An error occurred during Google sign-in.");
        console.error(error);
      }
    } else {
      Alert.alert("Error", "Google sign-in failed. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.authContainer}>
        <Animated.View style={[styles.formContainer, { transform: [{ translateX }] }]}>

          {isSignUp ? (
            <View style={styles.formContent}>
              <Text style={styles.title}>Create Account</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.button} onPress={handleSignUpSubmit}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <AntDesign name="google" size={20} color="#fff" />
                <Text style={styles.googleText}>Sign Up with Google</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContent}>
              <Text style={styles.title}>Login</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.button} onPress={handleLoginSubmit}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <AntDesign name="google" size={20} color="#fff" />
                <Text style={styles.googleText}>Login with Google</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
        <View style={styles.overlayContainer}>
          <Text style={styles.overlayTitle}>
            {isSignUp ? "Welcome Back!" : "Hello, Friend!"}
          </Text>
          <Text style={styles.overlayText}>
            {isSignUp
              ? "To keep connected, please login with your personal info"
              : "Enter your personal details and start your journey with us"}
          </Text>
          <TouchableOpacity style={styles.ghostButton} onPress={toggleAuthMode}>
            <Text style={styles.ghostButtonText}>{isSignUp ? "Login" : "Sign Up"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f5f7",
    justifyContent: "center",
    alignItems: "center",
  },
  authContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    width: "90%",
    height: 500,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  formContainer: {
    width: "50%",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  formContent: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 5,
    backgroundColor: "#eee",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#ff4b2b",
    paddingVertical: 12,
    width: "100%",
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    width: "100%",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  googleText: {
    color: "#fff",
    marginLeft: 10,
    fontWeight: "bold",
  },
  overlayContainer: {
    width: "50%",
    backgroundColor: "#ff416c",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  overlayText: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  ghostButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default AuthScreen;
