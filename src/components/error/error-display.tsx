"use client";

/**
 * ErrorDisplay provides standardized error UI components across the application.
 * - Consistent error styling and messaging
 * - Accessibility support with proper ARIA attributes
 * - Integration with retry mechanisms
 * - Support for different error types and contexts
 */

import { AlertCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ErrorDisplayProps {
  /**
   * Error message to display to user
   */
  message?: string;
  /**
   * Optional detailed error description
   */
  description?: string;
  /**
   * Error type for styling and behavior
   */
  type?: "inline" | "card" | "page" | "alert";
  /**
   * Show retry button
   */
  showRetry?: boolean;
  /**
   * Retry function to call
   */
  onRetry?: () => void;
  /**
   * Show navigation options
   */
  showNavigation?: boolean;
  /**
   * Custom navigation function
   */
  onNavigateHome?: () => void;
  /**
   * Custom back navigation
   */
  onNavigateBack?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Loading state for retry button
   */
  retrying?: boolean;
  /**
   * Custom icon override
   */
  icon?: React.ReactNode;
}

/**
 * Inline error display - for small errors within components
 */
export function InlineError({
  message = "Something went wrong",
  onRetry,
  showRetry = false,
  retrying = false,
  className,
  icon,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-destructive",
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      {icon || <AlertCircle className="h-4 w-4" />}
      <span>{message}</span>
      {showRetry && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          disabled={retrying}
          className="h-auto p-1 text-destructive hover:text-destructive"
        >
          <RefreshCw className={cn("h-3 w-3", retrying && "animate-spin")} />
          <span className="sr-only">Retry</span>
        </Button>
      )}
    </div>
  );
}

/**
 * Alert error display - for important errors that need attention
 */
export function AlertError({
  message = "Something went wrong",
  description,
  onRetry,
  showRetry = false,
  retrying = false,
  className,
}: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className={className} role="alert">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">{message}</p>
            {description && (
              <p className="mt-1 text-sm opacity-90">{description}</p>
            )}
          </div>
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={retrying}
              className="shrink-0"
            >
              <RefreshCw
                className={cn("h-3 w-3 mr-1", retrying && "animate-spin")}
              />
              Retry
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Card error display - for section-level errors
 */
export function CardError({
  message = "Something went wrong",
  description,
  onRetry,
  showRetry = true,
  retrying = false,
  className,
}: ErrorDisplayProps) {
  return (
    <Card className={cn("border-destructive/50", className)} role="alert">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-destructive">{message}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {showRetry && onRetry && (
        <CardContent className="text-center">
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={retrying}
            className="min-w-24"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", retrying && "animate-spin")}
            />
            {retrying ? "Retrying..." : "Try Again"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Page error display - for full-page errors
 */
export function PageError({
  message = "Something went wrong",
  description = "There was an error loading this page. Please try again.",
  onRetry,
  showRetry = true,
  showNavigation = true,
  onNavigateHome,
  onNavigateBack,
  retrying = false,
  className,
}: ErrorDisplayProps) {
  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = "/";
    }
  };

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        className,
      )}
      role="alert"
    >
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">{message}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            {showRetry && onRetry && (
              <Button onClick={onRetry} disabled={retrying} className="w-full">
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", retrying && "animate-spin")}
                />
                {retrying ? "Retrying..." : "Try Again"}
              </Button>
            )}
            {showNavigation && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleNavigateBack}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNavigateHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Smart error display - automatically chooses the right display type
 */
export function ErrorDisplay({ type = "card", ...props }: ErrorDisplayProps) {
  switch (type) {
    case "inline":
      return <InlineError {...props} />;
    case "alert":
      return <AlertError {...props} />;
    case "page":
      return <PageError {...props} />;
    case "card":
    default:
      return <CardError {...props} />;
  }
}
