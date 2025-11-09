"use client";

import { useEffect, useState } from "react";
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
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) {
      return;
    }

    // Check if user is authenticated and authorized
    if (!user || !isAuthorized) {
      if (!hasRedirected) {
        setHasRedirected(true);
        router.push("/login");
      }
      return;
    }

    // If superuser is required, check if user is superuser
    if (requireSuperuser && !user.is_superuser) {
      if (!hasRedirected) {
        setHasRedirected(true);
        router.push("/dashboard?error=unauthorized");
      }
      return;
    }

    // Reset redirect flag if user becomes authorized
    if (user && isAuthorized && hasRedirected) {
      setHasRedirected(false);
    }
  }, [user, isAuthorized, isLoading, requireSuperuser, router, hasRedirected]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: "#007BFF" }}></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading/redirecting message if user is not authorized (while redirect happens)
  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: "#007BFF" }}></div>
          <p className="mt-4 text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading/redirecting message if superuser is required but user is not superuser
  if (requireSuperuser && !user.is_superuser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: "#007BFF" }}></div>
          <p className="mt-4 text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

