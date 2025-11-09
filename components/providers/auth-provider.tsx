"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient, LoginResponse } from "@/lib/api";
import { User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthorized: boolean; // Staff or superuser
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
      if (currentUser && (currentUser.is_staff || currentUser.is_superuser)) {
        setUser(currentUser);
        console.log('[Auth] User authenticated:', currentUser);
      } else {
        // User is not staff or superuser, clear user state
        console.log('[Auth] User not authorized or not found');
        setUser(null);
      }
    } catch (error) {
      // Authentication failed or user is not authorized
      console.error('[Auth] Authentication check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (loginIdentifier: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      const response: LoginResponse = await apiClient.login(loginIdentifier, password, rememberMe);
      
      if (response.success && response.user) {
        // Verify user is staff or superuser
        if (!(response.user.is_staff || response.user.is_superuser)) {
          setUser(null);
          throw new Error("Access denied. Only staff members and superusers can access the web application.");
        }
        
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

  // Only redirect from login page to dashboard if user is already logged in
  // Route protection is handled by ProtectedRoute component
  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) {
      return;
    }

    // Check if user is authenticated and authorized (staff or superuser)
    const isAuthorized = user && (user.is_staff || user.is_superuser);

    // If user is authorized and on login page, redirect to dashboard
    if (isAuthorized && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const isAuthorized = user && (user.is_staff || user.is_superuser);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAuthorized: !!isAuthorized,
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

