import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { fetchData } from "../api/api"; // Importing fetch function
import { useAuth } from '../context/authContext'; // Importing auth context

const AuthScreen = () => {
  const { login } = useAuth(); // Using auth context
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const translateX = new Animated.Value(0);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();

  const toggleAuthMode = () => {
    Animated.timing(translateX, {
      toValue: isSignUp ? 0 : -100,
      duration: 500,
      useNativeDriver: false,
    }).start();
    setIsSignUp(!isSignUp);
  };

  const handleSignUpSubmit = async () => {
    const apiUrl = "https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev";
    const endpoint = "auth/register";
    const body = { name, email, password };

    try {
      const response = await fetchData(apiUrl, endpoint, { method: "POST", body });

      if (response?.token) {
        await login(response.token); // Use context to handle login
      }
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  const handleLoginSubmit = async () => {
    const apiUrl = "https://special-space-bassoon-r46xq5xpg7gvh5p44-3000.app.github.dev";
    const endpoint = "auth/login";
    const body = { email, password };

    try {
      const response = await fetchData(apiUrl, endpoint, { method: "POST", body });

      if (response?.token) {
        await login(response.token); // Use context to handle login
      }

      Alert.alert("Success", "Welcome back!");
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert("Error", "Invalid credentials. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
    });

    if (response?.type === 'success') {
      const { id_token } = response.params;

      const apiUrl = "http://your-backend-url";
      const endpoint = isSignUp ? "auth/google/signup" : "auth/google/login";

      try {
        const response = await fetchData(apiUrl, endpoint, {
          method: "POST",
          body: { token: id_token },
        });

        if (response?.token) {
          await login(response.token); // Use context to handle login
        }

        Alert.alert("Success", `Welcome ${isSignUp ? "new user" : "back!"}`);
        navigation.navigate('Home');
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
              <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
              <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
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
              <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
              <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
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
          <Text style={styles.overlayTitle}>{isSignUp ? "Welcome Back!" : "Hello, Friend!"}</Text>
          <Text style={styles.overlayText}>
            {isSignUp ? "To keep connected, please login with your personal info" : "Enter your personal details and start your journey with us"}
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
  container: { flex: 1, backgroundColor: "#f6f5f7", justifyContent: "center", alignItems: "center" },
  authContainer: { flexDirection: "row", backgroundColor: "#fff", width: "90%", height: 500, borderRadius: 10, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
  formContainer: { width: "50%", padding: 20, justifyContent: "center", alignItems: "center" },
  formContent: { width: "100%", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "100%", padding: 12, borderRadius: 5, backgroundColor: "#eee", marginBottom: 10 },
  button: { backgroundColor: "#ff4b2b", paddingVertical: 12, width: "100%", borderRadius: 5, alignItems: "center", marginBottom: 10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  googleButton: { flexDirection: "row", backgroundColor: "#db4437", paddingVertical: 12, width: "100%", borderRadius: 5, alignItems: "center", justifyContent: "center" },
  googleText: { color: "#fff", fontWeight: "bold", marginLeft: 10 },
  overlayContainer: { width: "50%", backgroundColor: "#ff4b2b", justifyContent: "center", alignItems: "center", padding: 20 },
  overlayTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  overlayText: { fontSize: 14, color: "#fff", textAlign: "center", marginBottom: 20 },
  ghostButton: { borderWidth: 1, borderColor: "#fff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  ghostButtonText: { color: "#fff", fontWeight: "bold" },
});

export default AuthScreen;
