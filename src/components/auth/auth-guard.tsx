"use client";

import { usePathname, useRouter } from "next/navigation";
/**
 * Authentication guard component
 * - Redirects unauthenticated users to login
 * - Shows loading state during auth check
 * - Preserves intended destination in redirect URL
 */
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo,
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      const destination = redirectTo || pathname;
      const loginUrl = `/auth/login${destination !== "/" ? `?redirectTo=${encodeURIComponent(destination)}` : ""}`;
      router.push(loginUrl);
    }
  }, [user, loading, requireAuth, router, pathname, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If auth is not required or user is authenticated, render children
  return <>{children}</>;
}

/**
 * Component that only renders for authenticated users
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <AuthGuard requireAuth={true}>{children}</AuthGuard>;
}

/**
 * Component that only renders for unauthenticated users
 */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
