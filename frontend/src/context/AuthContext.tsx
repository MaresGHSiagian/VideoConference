"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/types";
import {
  apiService,
  LoginCredentials,
  RegisterData,
} from "@/services/apiService";
import { showToast } from "@/services/toastService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on mount
    console.log("AuthProvider: Starting auth check");
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log("AuthProvider: Checking auth status");
    try {
      const token = apiService.getAuthToken();
      const storedUser = apiService.getStoredUser();

      console.log("AuthProvider: Token exists:", !!token);
      console.log("AuthProvider: Stored user exists:", !!storedUser);

      if (token && storedUser) {
        // Set user immediately from localStorage to prevent redirect
        console.log("AuthProvider: Setting user from localStorage");
        setUser(storedUser);

        // Then verify token is still valid by fetching user data
        try {
          console.log("AuthProvider: Verifying token with API");
          const currentUser = await apiService.getUser();
          console.log("AuthProvider: Token verified, updating user");
          setUser(currentUser);
          apiService.setUser(currentUser);
        } catch (error: any) {
          // Token is invalid, clear storage and set user to null
          console.warn(
            "AuthProvider: Token verification failed:",
            error.response?.data || error.message
          );

          // If it's a network error, don't clear auth data - user might still be logged in
          if (error.message === "Network Error") {
            console.warn(
              "AuthProvider: Network error, keeping stored user data"
            );
            // Keep the stored user but mark as offline mode
          } else {
            // Clear auth data for other errors (401, etc.)
            apiService.setAuthToken("");
            apiService.setUser({} as User);
            setUser(null);
          }
        }
      } else {
        console.log("AuthProvider: No valid auth data found");
        setUser(null);
      }
    } catch (error) {
      console.error("AuthProvider: Auth check failed:", error);
      setUser(null);
    } finally {
      console.log("AuthProvider: Auth check completed");
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const loadingToast = showToast.loading("Signing in...");

    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);

      // Store authentication data
      apiService.setAuthToken(response.access_token);
      apiService.setUser(response.user);
      setUser(response.user);

      // Update loading toast to success
      showToast.update(loadingToast, {
        render: `Welcome back, ${response.user.name}! 👋`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Login failed:", error);

      // Dismiss loading toast and show error
      showToast.dismiss(loadingToast);

      if (error instanceof Error) {
        showToast.loginError(error.message);
      } else {
        showToast.loginError();
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    const loadingToast = showToast.loading("Creating your account...");

    try {
      setIsLoading(true);
      console.log("Attempting registration with:", {
        ...userData,
        password: "***",
      });
      const response = await apiService.register(userData);

      // Store authentication data
      apiService.setAuthToken(response.access_token);
      apiService.setUser(response.user);
      setUser(response.user);
      console.log("Registration successful");

      // Update loading toast to success
      showToast.update(loadingToast, {
        render: `Account created successfully! Welcome ${response.user.name}! 🎉`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
    } catch (error) {
      console.error("Registration failed:", error);

      // Dismiss loading toast and show error
      showToast.dismiss(loadingToast);

      if (error instanceof Error) {
        showToast.registerError(error.message);
      } else {
        showToast.registerError();
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      showToast.info("Successfully logged out. See you again! 👋", {
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
      showToast.warning("Logged out locally (server connection failed)", {
        autoClose: 4000,
      });
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const currentUser = await apiService.getUser();
        setUser(currentUser);
        apiService.setUser(currentUser);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails, user might need to re-authenticate
      setUser(null);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
