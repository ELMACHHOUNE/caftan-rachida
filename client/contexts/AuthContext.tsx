"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  verifyToken,
  logout as apiLogout,
} from "@/lib/api/auth";
import type { User } from "@/lib/api/client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing token in localStorage before calling verifyToken
        // This avoids making an unauthenticated request which logs an expected server error
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          // No token present -> consider user unauthenticated
          setUser(null);
          return;
        }

        // Token exists, verify with the API
        const isTokenValid = await verifyToken();

        if (isTokenValid) {
          // Fetch user data
          const userData = await getCurrentUser();
          setUser(userData);
        } else {
          // Token is invalid, clear it
          apiLogout();
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear invalid token
        apiLogout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    // Ensure we have the latest user (e.g., role changes from DB)
    // Run in background; ignore errors to avoid disrupting UX
    refetchUser().catch((err) => {
      console.warn("Background refetch after login failed:", err);
    });
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    // Optional: redirect to home page
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refetchUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refetch user:", error);
      // If fetching user fails, user might be logged out
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
