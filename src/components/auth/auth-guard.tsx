"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
/**
 * Authentication guard component
 * - Redirects unauthenticated users to login
 * - Shows loading state during auth check
 * - Preserves intended destination in redirect URL
 */
import { useEffect } from "react";
import { AuthLoader } from "@/components/loading";
import { useAuth } from "@/lib/auth-context";

/** Only allow same-origin paths to prevent open redirects. */
export function safeRedirectPath(path: string | null, fallback = "/"): string {
  if (path?.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return fallback;
}

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
      router.replace(loginUrl);
    }
  }, [user, loading, requireAuth, router, pathname, redirectTo]);

  // Show loading state
  if (loading) {
    return <AuthLoader />;
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
 * Component that only renders for unauthenticated users.
 * Honors ?redirectTo= so it doesn't fight the login form's own navigation
 * (both resolve to the same destination).
 */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && user) {
      router.replace(safeRedirectPath(searchParams.get("redirectTo")));
    }
  }, [user, loading, router, searchParams]);

  if (loading) {
    return <AuthLoader />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
