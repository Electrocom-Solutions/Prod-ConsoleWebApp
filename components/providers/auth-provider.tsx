"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient, LoginResponse } from "@/lib/api";
import { User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginIdentifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (loginIdentifier: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      const response: LoginResponse = await apiClient.login(loginIdentifier, password, rememberMe);
      
      if (response.success && response.user) {
        setUser(response.user);
        // Redirect to dashboard after successful login
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error("Login failed");
      }
    } catch (error: any) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  // Protect routes - redirect to login if not authenticated
  // But allow access to login page
  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
    // If user is authenticated and on login page, redirect to dashboard
    if (!isLoading && user && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

