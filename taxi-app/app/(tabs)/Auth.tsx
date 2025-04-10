import React, { useState, useEffect, useRef } from "react";
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
    ActivityIndicator, // Import ActivityIndicator
    Easing,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons"; // Added Feather for input icons
import * as Google from "expo-auth-session/providers/google";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation"; // Adjust path if needed
import { fetchData } from "../api/api"; // Adjust path if needed
import { useAuth } from "../context/authContext"; // Adjust path if needed
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

const { width } = Dimensions.get("window");

// --- Configuration ---
const apiUrl = "https://ominous-space-computing-machine-4jvr5prgx4qq3jp66-3000.app.github.dev"
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // ** IMPORTANT: Replace with your actual Google Client ID **

// --- Updated Color Palette ---
const colors = {
    primary: '#007AFF', // A classic blue for primary actions
    primaryLight: '#ADD8E6', // Light blue for softer accents
    primaryDark: '#0056b3', // Darker shade for emphasis
    secondary: '#F8F8F8', // Very light grey for backgrounds or input fields
    backgroundGradientStart: '#E0F7FA', // Light cyan
    backgroundGradientEnd: '#B2EBF2',   // Slightly darker cyan
    text: '#212121',      // Dark grey for readability
    textLight: '#FFFFFF',   // White for text on primary buttons
    placeholder: '#757575', // Medium grey for placeholders
    white: '#FFFFFF',
    black: '#000000',
    error: '#D32F2F',      // Material red for errors
    googleRed: '#DB4437',
    shadow: '#000000',
    tabInactive: '#616161', // Darker grey for inactive tabs
    tabActive: '#007AFF',    // Primary blue for active tab text
};

// --- AuthScreen Component ---
const AuthScreen = () => {
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, "Home">>(); // Adjust "Home" if needed

    // Google Auth Hook (must be called at the top level)
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
    });

    // Animation for tab indicator
    const tabTranslateX = useRef(new Animated.Value(0)).current;
    const formOpacity = useRef(new Animated.Value(1)).current; // Opacity animation for form switch

    // Effect to handle Google Sign-In response
    useEffect(() => {
        const handleGoogleResponse = async () => {
            if (response?.type === "success") {
                setIsLoading(true);
                const { id_token } = response.params;
                const endpoint = activeTab === 'signup' ? "auth/google/signup" : "auth/google/login";

                try {
                    const apiResponse = await fetchData(apiUrl, endpoint, {
                        method: "POST",
                        body: { token: id_token },
                    });

                    if (apiResponse?.token) {
                        await login(apiResponse.token);
                        // Show success slightly later to allow screen transition
                        setTimeout(() => Alert.alert("Success", `Welcome ${activeTab === 'signup' ? "!" : "back!"}`), 500);
                        navigation.navigate("Home"); // Adjust "Home" if needed
                    } else {
                        throw new Error(apiResponse?.message || "Google authentication failed.");
                    }
                } catch (error: any) {
                    console.error("Google Sign-In Error:", error);
                    Alert.alert("Error", error?.message || "An error occurred during Google sign-in.");
                } finally {
                    setIsLoading(false);
                }
            } else if (response?.type === "error") {
                console.error("Google Auth Error Response:", response.error);
                Alert.alert("Error", "Google sign-in was cancelled or failed. Please try again.");
            } else if (response?.type === 'cancel'){
                console.log("Google sign-in cancelled by user.");
                // Optionally show a subtle feedback or just do nothing
            }
        };

        handleGoogleResponse();
    }, [response, activeTab, login, navigation]); // Add dependencies


    // Function to switch tabs
    const switchTab = (tab: 'login' | 'signup') => {
        if (tab === activeTab) return; // Don't animate if already active

        const targetValue = tab === 'login' ? 0 : (width * 0.8 - 40) / 2; // Adjust width for better fit

        Animated.parallel([
            Animated.timing(formOpacity, { // Fade out current form
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
                easing: Easing.ease,
            }),
            Animated.spring(tabTranslateX, { // Move indicator
                toValue: targetValue,
                friction: 7, // Adjust for desired springiness
                tension: 50,
                useNativeDriver: true,
            })
        ]).start(() => {
            setActiveTab(tab);
            // Clear fields when switching tabs for better UX
            setEmail('');
            setPassword('');
            setName('');
            Animated.timing(formOpacity, { // Fade in new form
                toValue: 1,
                duration: 150,
                delay: 50, // Slight delay for smoother transition
                useNativeDriver: true,
                easing: Easing.ease,
            }).start();
        });
    };

    // --- Handlers ---
    const handleSignUpSubmit = async () => {
        if (!name || !email || !password) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }
        setIsLoading(true);
        const endpoint = "auth/register";
        const body = { name, email, password };

        try {
            const response = await fetchData(apiUrl, endpoint, { method: "POST", body });
            if (response?.token) {
                await login(response.token);
                setTimeout(() => Alert.alert("Success", "Account created successfully!"), 500);
                navigation.navigate("Home"); // Adjust "Home" if needed
            } else {
                throw new Error(response?.message || "Registration failed.");
            }
        } catch (error: any) {
            console.error("Sign Up Error:", error);
            Alert.alert("Error", error?.message || "An error occurred during sign up.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async () => {
        if (!email || !password) {
            Alert.alert("Missing Information", "Please enter email and password.");
            return;
        }
        setIsLoading(true);
        const endpoint = "auth/login";
        const body = { email, password };

        try {
            const response = await fetchData(apiUrl, endpoint, { method: "POST", body });
            if (response?.token) {
                await login(response.token);
                setTimeout(() => Alert.alert("Success", "Welcome back!"), 500);
                navigation.navigate("Home"); // Adjust "Home" if needed
            } else {
                throw new Error(response?.message || "Invalid credentials.");
            }
        } catch (error: any) {
            console.error("Login Error:", error);
            Alert.alert("Error", error?.message || "Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        promptAsync(); // Initiate Google Sign-In flow
    };

    // --- Render Helper for Forms ---
    const renderForm = () => {
        const commonInputs = (
            <>
                <View style={styles.inputContainer}>
                    <Feather name="mail" size={20} color={colors.placeholder} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor={colors.placeholder}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Feather name="lock" size={20} color={colors.placeholder} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.placeholder}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
            </>
        );

        if (activeTab === "login") {
            return (
                <>
                    {commonInputs}
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={handleLoginSubmit}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                    <Text style={styles.orText}>or</Text>
                    <TouchableOpacity
                        style={[styles.button, styles.googleButton]}
                        onPress={handleGoogleLogin}
                        disabled={isLoading || !request} // Disable if google auth isn't ready
                    >
                        <AntDesign name="google" size={20} color={colors.white} />
                        <Text style={styles.googleText}>Login with Google</Text>
                    </TouchableOpacity>
                </>
            );
        } else { // Sign Up
            return (
                <>
                    <View style={styles.inputContainer}>
                        <Feather name="user" size={20} color={colors.placeholder} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor={colors.placeholder}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>
                    {commonInputs}
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={handleSignUpSubmit}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </TouchableOpacity>
                    <Text style={styles.orText}>or</Text>
                    <TouchableOpacity
                        style={[styles.button, styles.googleButton]}
                        onPress={handleGoogleLogin}
                        disabled={isLoading || !request}
                    >
                        <AntDesign name="google" size={20} color={colors.white} />
                        <Text style={styles.googleText}>Sign Up with Google</Text>
                    </TouchableOpacity>
                </>
            );
        }
    };

    // --- Main Render ---
    return (
        <LinearGradient
            colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
            style={styles.gradientContainer}
        >
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Adjust offset if needed
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside inputs
                >
                    <View style={styles.authContainer}>
                        {/* Tab Switcher */}
                        <View style={styles.tabOuterContainer}>
                            <View style={styles.tabInnerContainer}>
                                <Animated.View
                                    style={[
                                        styles.tabIndicator,
                                        { transform: [{ translateX: tabTranslateX }] },
                                    ]}
                                />
                                <TouchableOpacity
                                    style={styles.tab}
                                    onPress={() => switchTab("login")}
                                >
                                    <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Login</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.tab}
                                    onPress={() => switchTab("signup")}
                                >
                                    <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form Content */}
                        <Animated.View style={[styles.formContent, { opacity: formOpacity }]}>
                            {renderForm()}
                        </Animated.View>

                        {/* Loading Overlay */}
                        {isLoading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

// --- Updated Styles ---
const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 30,
    },
    authContainer: {
        backgroundColor: colors.white,
        width: "80%", // Slightly reduced width for a more contained look
        maxWidth: 350,
        borderRadius: 16, // Slightly less rounded
        padding: 25,
        paddingTop: 0,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
        position: 'relative',
    },
    tabOuterContainer: {
        marginBottom: 20,
        marginTop: 15,
        paddingHorizontal: 0,
    },
    tabInnerContainer: {
        flexDirection: "row",
        backgroundColor: colors.secondary,
        borderRadius: 25,
        height: 45,
        position: 'relative',
        overflow: 'hidden',
        padding: 2, // Add some padding around the tabs
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    tabText: {
        fontSize: 15,
        fontWeight: "500",
        color: colors.tabInactive,
    },
    activeTabText: {
        color: colors.tabActive,
        fontWeight: "600",
    },
    tabIndicator: {
        position: "absolute",
        height: '100%',
        width: '50%',
        backgroundColor: colors.white,
        borderRadius: 25,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        zIndex: -1,
    },
    formContent: {
        width: "100%",
        alignItems: "center",
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        borderRadius: 8,
        marginBottom: 12,
        width: "100%",
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
        color: colors.placeholder,
    },
    input: {
        flex: 1,
        height: 45,
        fontSize: 15,
        color: colors.text,
    },
    button: {
        paddingVertical: 14,
        width: "100%",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: 'center',
        marginTop: 8,
        flexDirection: 'row',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    primaryButton: {
        backgroundColor: colors.primary,
    },
    buttonText: {
        color: colors.textLight,
        fontWeight: "bold",
        fontSize: 16,
    },
    orText: {
        color: colors.placeholder,
        marginVertical: 12,
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
    },
    googleButton: {
        backgroundColor: colors.googleRed,
        marginTop: 0,
    },
    googleText: {
        color: colors.white,
        fontWeight: "bold",
        marginLeft: 10,
        fontSize: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        zIndex: 10,
    },
});

export default AuthScreen;