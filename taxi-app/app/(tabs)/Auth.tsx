import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import * as Google from "expo-google-auth-session"; // Import Google authentication

const AuthScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Replace with your Google client ID
  });

  const translateX = new Animated.Value(0);

  const toggleAuthMode = () => {
    Animated.timing(translateX, {
      toValue: isSignUp ? 0 : -100,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setIsSignUp(!isSignUp);
  };

  const handleSignUp = async () => {
    try {
      const response = await axios.post("https://your-backend-api.com/signup", {
        name,
        email,
        password,
      });
      console.log("Sign up success:", response.data);
    } catch (error) {
      console.error("Sign up error:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("https://your-backend-api.com/login", {
        email,
        password,
      });
      console.log("Login success:", response.data);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { id_token } = await promptAsync();
      if (id_token) {
        // Check if the user is signing up or logging in
        const apiRoute = isSignUp ? "/google-signup" : "/google-login"; // Change to appropriate API routes
        const response = await axios.post(`https://your-backend-api.com${apiRoute}`, {
          id_token,
        });
        console.log("Google authentication success:", response.data);
      }
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.authContainer}>
        <Animated.View
          style={[styles.formContainer, { transform: [{ translateX }] }]}
        >
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
              <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign Up</Text>
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
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
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
            <Text style={styles.ghostButtonText}>
              {isSignUp ? "Login" : "Sign Up"}
            </Text>
          </TouchableOpacity>
          {/* Google Sign-in Button */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <AntDesign name="google" size={20} color="#fff" />
            <Text style={styles.googleText}>
              {isSignUp ? "Sign Up with Google" : "Login with Google"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 0,
    padding: 0,
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    width: "100%",
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
