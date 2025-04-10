// src/context/authContext.tsx (or similar path)
import React, { createContext, useState, useEffect, useContext } from 'react';
// Make sure removeToken is imported alongside getToken and saveToken
import { getToken, saveToken, removeToken } from '../api/api'; // Adjust path if needed

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  const login = async (token: string) => {
    await saveToken(token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    // *** CHANGE HERE: Use the removeToken function from api.ts ***
    await removeToken();
    setIsAuthenticated(false);
    // Optional: Add any other global cleanup needed on logout here
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};