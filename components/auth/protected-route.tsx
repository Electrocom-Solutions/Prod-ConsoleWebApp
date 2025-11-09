"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperuser?: boolean;
}

/**
 * ProtectedRoute component that ensures user is authenticated and authorized
 * If requireSuperuser is true, only superusers can access
 */
export function ProtectedRoute({ children, requireSuperuser = false }: ProtectedRouteProps) {
  const { user, isAuthorized, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Check if user is authenticated and authorized
      if (!user || !isAuthorized) {
        router.push("/login");
        return;
      }

      // If superuser is required, check if user is superuser
      if (requireSuperuser && !user.is_superuser) {
        router.push("/dashboard");
        return;
      }
    }
  }, [user, isAuthorized, isLoading, requireSuperuser, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0F1117" }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: "#007BFF" }}></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is not authorized
  if (!user || !isAuthorized) {
    return null;
  }

  // Don't render children if superuser is required but user is not superuser
  if (requireSuperuser && !user.is_superuser) {
    return null;
  }

  return <>{children}</>;
}

