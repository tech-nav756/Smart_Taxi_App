import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { AntDesign } from "@expo/vector-icons";

const AuthScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const translateX = new Animated.Value(0);

  const toggleAuthMode = () => {
    Animated.timing(translateX, {
      toValue: isSignUp ? 0 : -100,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setIsSignUp(!isSignUp);
  };

  return (
    <View style={styles.container}>
      <View style={styles.authContainer}>
        <Animated.View
          style={[
            styles.formContainer,
            { transform: [{ translateX }] },
          ]}
        >
          {isSignUp ? (
            <View style={styles.formContent}>
              <Text style={styles.title}>Create Account</Text>
              <TextInput style={styles.input} placeholder="Name" />
              <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Password" secureTextEntry />
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.googleButton}>
                <AntDesign name="google" size={20} color="#fff" />
                <Text style={styles.googleText}>Sign Up with Google</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContent}>
              <Text style={styles.title}>Login</Text>
              <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Password" secureTextEntry />
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.googleButton}>
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
