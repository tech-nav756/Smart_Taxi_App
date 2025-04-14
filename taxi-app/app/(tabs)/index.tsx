import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Animated, Alert,
    Dimensions, ScrollView, Platform, SafeAreaView, ViewStyle,
    TextStyle, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, fetchData } from '../api/api'; // Adjust path as needed
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Import Manager and Socket types
import { Manager, Socket } from 'socket.io-client';

// **** Import the shared navigation types ****
import { RootStackParamList } from '../types/navigation'; // (ADJUST PATH if needed)
// **** Import the separated Sidebar component ****
import Sidebar from '../components/Sidebar'; // (ADJUST PATH if needed)


const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const apiUrl = "https://ominous-space-computing-machine-4jvr5prgx4qq3jp66-3000.app.github.dev"; // Ensure this is your backend URL

const ASYNC_STORAGE_MONITOR_KEY = 'monitoredTaxiId'; // Key for AsyncStorage

// --- Type Alias for Navigation Prop ---
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// --- Interfaces ---
interface TaxiInfo {
    _id: string; numberPlate: string; status: string; currentStop: string;
    currentLoad: number; capacity: number; routeName: string; nextStop: string;
    driverName?: string; updatedAt?: string; routeId?: string; driverId?: string;
    stops?: any[];
}
interface UserDetails {
    id: string;
    name?: string;
}
// **** FIX: Ensure QuickActionProps interface is defined correctly ****
interface QuickActionProps {
    icon: string;
    iconFamily?: 'FontAwesome' | 'MaterialIcons' | 'Ionicons';
    label: string;
    onPress: () => void;
}
// SidebarProps is now defined within Sidebar.tsx

// --- Reusable Component Definitions ---

// Sidebar is imported

// **** FIX: Ensure QuickActionButton definition matches props ****
const QuickActionButton: React.FC<QuickActionProps> = ({ icon, iconFamily = 'FontAwesome', label, onPress }) => {
    const IconComponent = iconFamily === 'MaterialIcons' ? MaterialIcons : iconFamily === 'Ionicons' ? Ionicons : FontAwesome;
    const iconName = icon as any; // Use 'as any' if icon names aren't strictly typed
    return ( // Added return
        <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
            <View style={styles.quickActionIconContainer}>
                <IconComponent name={iconName} size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    ); // Added closing parenthesis
};

const LiveStatusCard: React.FC<{ monitoredTaxi: TaxiInfo | null; onEndMonitoring: () => void }> = ({ monitoredTaxi, onEndMonitoring }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => { Animated.timing(cardAnim, { toValue: monitoredTaxi ? 1 : 0, duration: 400, useNativeDriver: false }).start(); }, [monitoredTaxi, cardAnim]);

    const animatedCardStyle = {
        height: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 210], extrapolate: 'clamp' }),
        opacity: cardAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' }),
        marginBottom: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 25], extrapolate: 'clamp' }),
    };

    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;
        if (monitoredTaxi) {
            animation = Animated.loop(Animated.sequence([ Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }) ]));
            animation.start();
        } else { pulseAnim.stopAnimation(); pulseAnim.setValue(1); }
        return () => { if (animation) { pulseAnim.stopAnimation(); pulseAnim.setValue(1); }};
    }, [monitoredTaxi, pulseAnim]);

    const getStatusStyle = (status: string): TextStyle => {
        switch (status?.toLowerCase()) {
            case 'available': return { color: '#28a745', fontWeight: 'bold' };
            case 'full': case 'not available': return { color: '#dc3545', fontWeight: 'bold' };
            case 'almost full': case 'on trip': case 'roaming': return { color: '#ffc107', fontWeight: 'bold' };
            case 'waiting': return { color: '#007bff', fontWeight: 'bold' };
            default: return { color: '#FFFFFF' };
        }
    };

    return ( // Added return
        <Animated.View style={[styles.liveStatusCardBase, animatedCardStyle]}>
            <Animated.View style={monitoredTaxi ? { transform: [{ scale: pulseAnim }] } : {}}>
                {monitoredTaxi && (
                    <LinearGradient colors={['#0052A2', '#003E7E']} style={styles.liveStatusGradient}>
                        <View style={styles.statusHeader}>
                            <View style={styles.liveIndicator}><Text style={styles.liveText}>LIVE</Text></View>
                            <Text style={styles.statusTitle} numberOfLines={1}>Tracking: {monitoredTaxi.numberPlate}</Text>
                            <TouchableOpacity onPress={onEndMonitoring} style={styles.endMonitorButton}><Ionicons name="close-circle" size={26} color="#FFFFFF" /></TouchableOpacity>
                        </View>
                        <View style={styles.taxiDetailsGrid}>
                            <View style={styles.detailItem}><MaterialIcons name="directions-bus" size={20} color="#E0EFFF" /><Text style={styles.taxiTextLabel}>Route:</Text><Text style={styles.taxiTextValue} numberOfLines={1}>{monitoredTaxi.routeName || 'N/A'}</Text></View>
                            <View style={styles.detailItem}><Ionicons name="speedometer-outline" size={20} color="#E0EFFF" /><Text style={styles.taxiTextLabel}>Status:</Text><Text style={[styles.taxiTextValue, getStatusStyle(monitoredTaxi.status)]}>{monitoredTaxi.status || 'N/A'}</Text></View>
                            <View style={styles.detailItem}><MaterialIcons name="pin-drop" size={20} color="#E0EFFF" /><Text style={styles.taxiTextLabel}>At:</Text><Text style={styles.taxiTextValue} numberOfLines={1}>{monitoredTaxi.currentStop || 'N/A'}</Text></View>
                            <View style={styles.detailItem}><MaterialIcons name="groups" size={20} color="#E0EFFF" /><Text style={styles.taxiTextLabel}>Load:</Text><Text style={styles.taxiTextValue}>{monitoredTaxi.currentLoad ?? 'N/A'} / {monitoredTaxi.capacity ?? 'N/A'}</Text></View>
                            {(monitoredTaxi.nextStop && monitoredTaxi.nextStop !== "End of the route") && <View style={styles.detailItemFull}><MaterialIcons name="skip-next" size={20} color="#E0EFFF" /><Text style={styles.taxiTextLabel}>Next:</Text><Text style={styles.taxiTextValue} numberOfLines={1}>{monitoredTaxi.nextStop}</Text></View> }
                            {monitoredTaxi.driverName && <View style={styles.detailItemFull}><Ionicons name="person-circle-outline" size={20} color="#E0EFFF" /><Text style={styles.taxiTextLabel}>Driver:</Text><Text style={styles.taxiTextValue} numberOfLines={1}>{monitoredTaxi.driverName}</Text></View> }
                        </View>
                    </LinearGradient>
                )}
            </Animated.View>
        </Animated.View>
    ); // Added closing parenthesis
};

const Loading: React.FC = () => {
    const spinAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => { Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })).start(); }, [spinAnim]);
    const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return ( // Added return
        <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.loadingGradientWrapper}>
            <View style={styles.loadingContainer}><Animated.View style={{ transform: [{ rotate: spin }] }}><Ionicons name="refresh" size={50} color="#003E7E" /></Animated.View><Text style={styles.loadingText}>Loading Dashboard...</Text></View>
        </LinearGradient>
    ); // Added closing parenthesis
};

// --- Main HomeScreen Component ---
const HomeScreen = () => {
    const [userName, setUserName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [monitoredTaxi, setMonitoredTaxi] = useState<TaxiInfo | null>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    const isMountedRef = useRef(true);
    const socketRef = useRef<Socket | null>(null);
    const currentMonitoredTaxiId = useRef<string | null>(null);

    const navigation = useNavigation<HomeScreenNavigationProp>();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // **** FIX: Added explicit return null for all paths ****
    const fetchUserDetails = useCallback(async (): Promise<UserDetails | null> => {
        const token = await getToken();
        if (!token) { console.error('HS: Auth token not found for user details.'); return null; } // Added return
        try {
            const response = await fetchData(apiUrl, 'api/users/get-user', {
                method: 'GET', headers: { Authorization: `Bearer ${token}` },
            }) as { user: UserDetails };
            if (response?.user?.id) { return response.user; } // Return user
            else { console.error('HS: User details not in response:', response); return null; } // Added return
        } catch (error) { console.error('HS: Error fetching user details:', error); return null; } // Added return
    }, []);

    // **** FIX: Added explicit return null for all paths ****
    const fetchInitialTaxiData = useCallback(async (taxiId: string): Promise<TaxiInfo | null> => {
        if (!isMountedRef.current) return null; // Added return
        console.log(`HS: Fetching initial data for taxi ${taxiId}`);
        const token = await getToken();
        if (!token) { console.log("HS: No token for initial fetch."); await handleEndMonitoring(); return null; } // Added return
        try {
            const response = await fetchData(apiUrl, `api/taxis/${taxiId}/monitor`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
            if (!isMountedRef.current) return null; // Added return
            if (response?.taxiInfo) {
                console.log(`HS: Initial fetch success for ${taxiId}`);
                const fetchedTaxiData = { ...response.taxiInfo, _id: taxiId };
                if (isMountedRef.current) setMonitoredTaxi(fetchedTaxiData);
                return fetchedTaxiData; // Return fetched data
            } else { console.warn(`HS: No taxiInfo initially for ${taxiId}.`); await handleEndMonitoring(); return null; } // Added return
        } catch (error: any) {
            console.error(`HS: Initial Fetch Error for ${taxiId}:`, error.message);
            if (error.status === 404 || error.status === 401 || error.status === 403) {
                 if (isMountedRef.current) Alert.alert('Error', `Could not fetch details for Taxi ${taxiId}. Monitoring stopped.`);
                 await handleEndMonitoring();
            } else if (isMountedRef.current) { Alert.alert('Network Error', 'Could not fetch initial taxi details.'); }
            return null; // Added return
        }
        // No finally needed as all paths return
    }, []); // handleEndMonitoring removed dep

    // **** FIX: Async function implicitly returns Promise<void> ****
    // No explicit return needed for Promise<void> if all paths complete normally
    const handleEndMonitoring = useCallback(async () => {
        console.log('HS: Ending monitoring...');
        const taxiIdToUnsubscribe = currentMonitoredTaxiId.current;
        if (socketRef.current?.connected && taxiIdToUnsubscribe) {
            console.log(`HS: Emitting passenger:unsubscribeFromTaxiUpdates for ${taxiIdToUnsubscribe}`);
            socketRef.current.emit('passenger:unsubscribeFromTaxiUpdates', { taxiId: taxiIdToUnsubscribe });
        }
        if (isMountedRef.current) setMonitoredTaxi(null);
        currentMonitoredTaxiId.current = null;
        try { await AsyncStorage.removeItem(ASYNC_STORAGE_MONITOR_KEY); console.log('HS: Cleared AsyncStorage.'); }
        catch (e) { console.error("HS: Failed clear AsyncStorage", e); }
        // Implicit return;
    }, []);

    // --- Setup Socket Connection ---
    const setupSocket = useCallback(async (fetchedUserId: string) => {
        const token = await getToken();
        if (!token) { Alert.alert('Connection Error', 'Auth required.'); return; } // Added return
        if (socketRef.current) { socketRef.current.disconnect(); }
        console.log('HS: Setting up socket using Manager...');
        try {
            const manager = new Manager(apiUrl, { reconnectionAttempts: 5, reconnectionDelay: 2000, transports: ['websocket'], extraHeaders: { Authorization: `Bearer ${token}` }});
            const newSocket = manager.socket('/');
            socketRef.current = newSocket;
            newSocket.on('connect', () => { console.log('HS: Socket connected:', newSocket.id); setIsSocketConnected(true); if (fetchedUserId) { console.log(`HS: Authenticating ${fetchedUserId}`); newSocket.emit('authenticate', fetchedUserId); } if (currentMonitoredTaxiId.current) { console.log(`HS: Subscribing to ${currentMonitoredTaxiId.current}.`); newSocket.emit('passenger:subscribeToTaxiUpdates', { taxiId: currentMonitoredTaxiId.current }); } });
            newSocket.on('disconnect', (reason) => { console.log('HS: Socket disconnected:', reason); setIsSocketConnected(false); });
            newSocket.on('connect_error', (error) => { console.error('HS: Socket connect error:', error.message); setIsSocketConnected(false); });
            newSocket.on('taxiUpdate', (taxiData: TaxiInfo) => { if (taxiData && taxiData._id === currentMonitoredTaxiId.current && isMountedRef.current) { console.log(`HS: Processing update for ${taxiData._id}`); setMonitoredTaxi(taxiData); } });
            newSocket.on('taxiError', (error) => { console.error('HS: Received taxiError:', error.message); if (isMountedRef.current) Alert.alert('Monitor Error', error.message); });
        } catch (error) { console.error("HS: Socket manager setup failed:", error); if (isMountedRef.current) Alert.alert('Error', 'Connection failed.'); }
        // Implicit return Promise<void>
    }, []);

    // --- Effect for Initial Load ---
    useEffect(() => {
        isMountedRef.current = true; setIsLoading(true); console.log("HS: Initial mount...");
        let isCancelled = false;
        const initialize = async () => {
            const user = await fetchUserDetails();
            if (isCancelled || !isMountedRef.current) return;
            if (user?.id) {
                setUserName(user.name || null); setUserId(user.id);
                console.log("HS: Checking AsyncStorage..."); let storedTaxiId: string | null = null;
                try { storedTaxiId = await AsyncStorage.getItem(ASYNC_STORAGE_MONITOR_KEY); console.log("HS: Stored ID:", storedTaxiId); if (storedTaxiId && isMountedRef.current) { currentMonitoredTaxiId.current = storedTaxiId; await fetchInitialTaxiData(storedTaxiId); } else { if (isMountedRef.current) setMonitoredTaxi(null); currentMonitoredTaxiId.current = null; }
                } catch (e) { if (isMountedRef.current) setMonitoredTaxi(null); currentMonitoredTaxiId.current = null; console.error("HS: Failed read AsyncStorage", e); }
            } else { if(isMountedRef.current) Alert.alert("Auth Error", "Could not verify user."); }
            if (isMountedRef.current && !isCancelled) { setIsLoading(false); console.log("HS: Load checks complete."); Animated.parallel([ Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }), Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }), ]).start(); }
        };
        initialize();
        return () => { isMountedRef.current = false; isCancelled = true; console.log("HS: Initial effect cleanup."); };
    }, [fetchUserDetails, fetchInitialTaxiData]); // Removed handleEndMonitoring dep

    // --- Effect to Setup Socket ---
     useEffect(() => { if (userId) { setupSocket(userId); } return () => { if (socketRef.current) { console.log("HS: Cleaning up socket from userId effect"); socketRef.current.removeAllListeners(); socketRef.current.disconnect(); socketRef.current = null; }}; }, [userId, setupSocket]); // Include setupSocket


    // --- Navigation Handler ---
    const handleNavigate = (screen: keyof RootStackParamList) => {
        setSidebarVisible(false);
        switch (screen) {
            case 'Home': break;
            case 'requestRide': navigation.navigate({ name: 'requestRide', params: undefined }); break;
            case 'ViewTaxi': navigation.navigate({ name: 'ViewTaxi', params: undefined }); break;
            case 'ViewRoute': navigation.navigate({ name: 'ViewRoute', params: undefined }); break;
            case 'ViewRequests': navigation.navigate({ name: 'ViewRequests', params: undefined }); break;
            case 'LiveChat': navigation.navigate({ name: 'LiveChat', params: { chatSessionId: 'NEEDS_REAL_ID' } }); break;
            case 'TaxiManagement': navigation.navigate({ name: 'TaxiManagement', params: undefined }); break;
            case 'Profile': navigation.navigate({ name: 'Profile', params: undefined }); break;
            case 'AcceptedRequest': navigation.navigate({ name: 'AcceptedRequest', params: undefined }); break;
            case 'AcceptedPassenger': navigation.navigate({ name: 'AcceptedPassenger', params: undefined }); break;
            case 'Auth': navigation.navigate({ name: 'Auth', params: undefined }); break;
            default: console.warn(`HS: Navigating to unhandled: ${screen}`); break;
        }
    };
    const toggleSidebar = () => { setSidebarVisible(!sidebarVisible); };

    // --- Render Logic ---
    if (isLoading) { return <Loading />; }

    return (
        <LinearGradient colors={['#FFFFFF', '#E8F0FE']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <Sidebar isVisible={sidebarVisible} onClose={toggleSidebar} onNavigate={handleNavigate} activeScreen="Home" />
                <Animated.View style={[styles.mainContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.headerButton} onPress={toggleSidebar}><Ionicons name="menu" size={32} color="#003E7E" /></TouchableOpacity>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <TouchableOpacity style={styles.headerButton} onPress={() => handleNavigate('Profile')}><FontAwesome name="user-circle-o" size={28} color="#003E7E" /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" >
                        <Text style={styles.greetingText}>{userName ? `Welcome back, ${userName}!` : 'Welcome to Shesha!'}</Text>
                        <Text style={styles.subtitleText}>Ready for your next ride?</Text>
                        <LiveStatusCard monitoredTaxi={monitoredTaxi} onEndMonitoring={handleEndMonitoring} />
                        {!monitoredTaxi && (
                            <View style={styles.quickActionsContainer}>
                                <Text style={styles.sectionTitle}>Quick Actions</Text>
                                <View style={styles.quickActionsGrid}>
                                     {/* **** FIX: Correct usage based on restored component definition **** */}
                                    <QuickActionButton icon="car" label="Request Ride" onPress={() => handleNavigate('requestRide')} iconFamily='FontAwesome'/>
                                    <QuickActionButton icon="taxi" label="View Taxis" onPress={() => handleNavigate('ViewTaxi')} iconFamily='FontAwesome'/>
                                    <QuickActionButton icon="search" label="Find Ride" onPress={() => handleNavigate('ViewRequests')} iconFamily='FontAwesome'/>
                                    <QuickActionButton icon="road" label="Check Routes" onPress={() => handleNavigate('ViewRoute')} iconFamily='FontAwesome'/>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </SafeAreaView>
        </LinearGradient>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    gradient: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    loadingGradientWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#003E7E', fontWeight: '500' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 15 : 10, paddingBottom: 10, width: '100%', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#DDD' },
    headerButton: { padding: 8, minWidth: 40, alignItems: 'center'},
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#003E7E' },
    sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 300, backgroundColor: '#003E7E', zIndex: 1000, elevation: 10, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.3, shadowRadius: 5, paddingTop: Platform.OS === 'ios' ? 20 : 0 },
    sidebarCloseButton: { position: 'absolute', top: Platform.OS === 'android' ? 45 : 55, right: 15, zIndex: 1010, padding: 5 },
    sidebarHeader: { alignItems: 'center', marginBottom: 30, paddingTop: 60 },
    sidebarLogoIcon: { marginBottom: 10 },
    sidebarTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
    sidebarButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, marginBottom: 8, marginHorizontal: 10 },
    sidebarButtonActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    sidebarButtonText: { fontSize: 16, marginLeft: 15, color: '#E0EFFF', fontWeight: '600' },
    sidebarButtonTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
    mainContainer: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
    greetingText: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 5 },
    subtitleText: { fontSize: 16, color: '#555555', marginBottom: 25 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: '#000000', marginBottom: 15, marginTop: 10 },
    liveStatusCardBase: { borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0, 62, 126, 0.2)', elevation: 4, shadowColor: '#003E7E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, overflow: 'hidden' },
    liveStatusGradient: { padding: 18 },
    statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    liveIndicator: { backgroundColor: '#FFFFFF', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
    liveText: { color: '#003E7E', fontWeight: 'bold', fontSize: 12 },
    statusTitle: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', flex: 1, marginRight: 10 },
    endMonitorButton: { padding: 5 },
    taxiDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    detailItem: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 12 },
    detailItemFull: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 12 },
    taxiTextLabel: { fontSize: 14, color: '#E0EFFF', marginLeft: 6, marginRight: 4 },
    taxiTextValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '600', flexShrink: 1 },
    quickActionsContainer: { marginTop: 5, marginBottom: 20 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    quickActionButton: { alignItems: 'center', width: (windowWidth - 70) / 2, marginBottom: 20, paddingVertical: 15, paddingHorizontal: 10, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', elevation: 3, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    quickActionIconContainer: { backgroundColor: '#003E7E', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    quickActionLabel: { fontSize: 14, color: '#000000', fontWeight: '500', textAlign: 'center' },
    actionButtonBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
    actionButtonIcon: { marginRight: 8 },
    actionButtonText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    actionButtonDisabled: { backgroundColor: '#B0B0B0', elevation: 0, shadowOpacity: 0 },
});

export default HomeScreen;