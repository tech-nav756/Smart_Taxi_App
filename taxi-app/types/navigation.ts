// types/navigation.ts
export type RootStackParamList = {
    Home: { acceptedTaxiId?: string };
    Auth: undefined; // Other screens in your stack can be added here
    RideRequest: undefined; // No params for RideRequest screen
    DriverDashboard: undefined;
    Profile: undefined;
    Help: undefined;
    Settings: undefined;
  };
  