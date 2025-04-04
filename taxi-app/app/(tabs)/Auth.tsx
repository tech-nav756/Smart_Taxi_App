import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import { fetchData } from "../api/api";
import { useAuth } from "../context/authContext";

const { width } = Dimensions.get("window");

const AuthScreen = () => {
  const apiUrl = "https://fluffy-space-trout-7vgv67xv9xrhw77-3000.app.github.dev";
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const translateX = new Animated.Value(0);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "Home">>();

  const toggleAuthMode = () => {
    Animated.timing(translateX, {
      toValue: isSignUp ? 0 : -100,
      duration: 500,
      useNativeDriver: false,
    }).start();
    setIsSignUp(!isSignUp);
  };

  const handleSignUpSubmit = async () => {
    const endpoint = "auth/register";
    const body = { name, email, password };

    try {
      const response = await fetchData(apiUrl, endpoint, { method: "POST", body });

      if (response?.token) {
        await login(response.token);
      }
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  const handleLoginSubmit = async () => {
    const endpoint = "auth/login";
    const body = { email, password };

    try {
      const response = await fetchData(apiUrl, endpoint, { method: "POST", body });

      if (response?.token) {
        await login(response.token);
      }

      Alert.alert("Success", "Welcome back!");
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Error", "Invalid credentials. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: "YOUR_GOOGLE_CLIENT_ID",
    });

    if (response?.type === "success") {
      const { id_token } = response.params;

      const endpoint = isSignUp ? "auth/google/signup" : "auth/google/login";

      try {
        const response = await fetchData(apiUrl, endpoint, {
          method: "POST",
          body: { token: id_token },
        });

        if (response?.token) {
          await login(response.token);
        }

        Alert.alert("Success", `Welcome ${isSignUp ? "new user" : "back!"}`);
        navigation.navigate("Home");
      } catch (error) {
        Alert.alert("Error", "An error occurred during Google sign-in.");
        console.error(error);
      }
    } else {
      Alert.alert("Error", "Google sign-in failed. Please try again.");
    }
  };

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login"); // Explicit type annotation
  const tabTranslateX = new Animated.Value(0);

  const switchTab = (tab: "login" | "signup") => { // Explicit type annotation
    Animated.timing(tabTranslateX, {
      toValue: tab === "login" ? 0 : width / 2,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setActiveTab(tab));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.authContainer}>
          <View style={styles.tabContainer}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { transform: [{ translateX: tabTranslateX }] },
              ]}
            />
            <TouchableOpacity
              style={[styles.tab, activeTab === "login" && styles.activeTab]}
              onPress={() => switchTab("login")}
            >
              <Text style={styles.tabText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "signup" && styles.activeTab]}
              onPress={() => switchTab("signup")}
            >
              <Text style={styles.tabText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {activeTab === "login" ? (
            <View style={styles.formContent}>
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
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
              >
                <AntDesign name="google" size={20} color="#fff" />
                <Text style={styles.googleText}>Login with Google</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContent}>
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
              <TouchableOpacity
                style={styles.button}
                onPress={handleSignUpSubmit}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
              >
                <AntDesign name="google" size={20} color="#fff" />
                <Text style={styles.googleText}>Sign Up with Google</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authContainer: {
    backgroundColor: "#fff",
    width: "90%",
    maxWidth: 400,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
    padding: 20,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    width: "100%",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4a90e2",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  tabIndicator: {
    position: "absolute",
    height: 2,
    backgroundColor: "#4a90e2",
    width: width / 2,
    bottom: 0,
  },
  formContent: {
    width: "100%",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#e8f0fe",
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 15,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#db4437",
    paddingVertical: 15,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  googleText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
  },
});

export default AuthScreen;