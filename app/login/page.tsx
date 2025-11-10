"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isAuthorized, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated (additional check in component)
  useEffect(() => {
    if (!authLoading && isAuthorized && user) {
      console.log('[LoginPage] User already authenticated, redirecting to dashboard');
      router.replace("/dashboard");
    }
  }, [user, isAuthorized, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginId || !password) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter both login ID and password",
        background: "#1E2028",
        color: "#FFFFFF",
        confirmButtonColor: "#007BFF",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login(loginId, password, rememberMe);
      
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        background: "#1E2028",
        color: "#FFFFFF",
        confirmButtonColor: "#007BFF",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle different types of errors
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (error?.message) {
        if (error.message.includes("Network Error") || error.message.includes("Failed to fetch")) {
          errorMessage = `Cannot connect to the API server. Please check:
1. Is the Django server running?
2. Is the API URL correct? (Check .env.local file)
3. Are CORS settings configured correctly?

Error: ${error.message}`;
        } else if (error.message.includes("Network Error")) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: errorMessage,
        background: "#1E2028",
        color: "#FFFFFF",
        confirmButtonColor: "#007BFF",
        width: "600px",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" 
        style={{ backgroundColor: "#0F1117" }}
      >
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: "#007BFF" }}></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is already authenticated (will redirect)
  if (isAuthorized && user) {
    return null;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" 
      style={{ backgroundColor: "#0F1117" }}
    >
      <Card 
        className="w-full max-w-md shadow-2xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        style={{ 
          backgroundColor: "#1E2028",
          borderColor: "#2A2D35",
        }}
      >
        <CardHeader className="text-center space-y-2 pb-8 pt-8 px-6">
          <h1 
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#FFFFFF" }}
          >
            Electrocom
          </h1>
          <p 
            className="text-sm sm:text-base mt-2"
            style={{ color: "#A0A0A0" }}
          >
            Sign in to your account
          </p>
        </CardHeader>
        
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label 
                htmlFor="loginId"
                className="text-sm font-medium"
                style={{ color: "#FFFFFF" }}
              >
                Email / Username / Mobile Number
              </Label>
              <Input
                id="loginId"
                type="text"
                placeholder="Enter your email, username, or mobile number"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-opacity-50"
                style={{
                  backgroundColor: "#1A1C23",
                  borderColor: "#2A2D35",
                  color: "#FFFFFF",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#007BFF";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#2A2D35";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: "#FFFFFF" }}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-opacity-50"
                style={{
                  backgroundColor: "#1A1C23",
                  borderColor: "#2A2D35",
                  color: "#FFFFFF",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#007BFF";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#2A2D35";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-opacity-50"
                  style={{
                    backgroundColor: rememberMe ? "#007BFF" : "#1A1C23",
                    borderColor: rememberMe ? "#007BFF" : "#2A2D35",
                    accentColor: "#007BFF",
                  }}
                />
                <Label 
                  htmlFor="remember"
                  className="cursor-pointer text-sm"
                  style={{ color: "#A0A0A0" }}
                >
                  Remember Me
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isLoading ? "#4A5568" : "#007BFF",
                color: "#FFFFFF",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                e.currentTarget.style.backgroundColor = "#0056CC";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                e.currentTarget.style.backgroundColor = "#007BFF";
                }
              }}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

