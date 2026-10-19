"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, User, AuthStatus } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isFirstRun: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isFirstRun: false,
  isLoading: true,
  refreshAuth: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const res = await api.get<AuthStatus>("/auth/status");
      setIsFirstRun(res.data.is_first_run);
      setIsAuthenticated(res.data.is_authenticated);
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to load auth status", err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("docforge_auth_token");
      }
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isFirstRun,
        isLoading,
        refreshAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
