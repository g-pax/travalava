"use client";

/**
 * ErrorBoundary system provides comprehensive error boundaries for different application levels.
 * - Root level error boundary for unhandled component errors
 * - Feature level boundaries for isolated error handling
 * - Route level boundaries for page-specific error recovery
 * - Integrates with Sentry for error reporting
 */

import React from "react";
import { ErrorDisplay } from "./error-display";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Error boundary level for different UI treatments
   */
  level?: "root" | "page" | "feature" | "component";
  /**
   * Custom fallback component
   */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /**
   * Custom error handler
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /**
   * Reset the error boundary from parent
   */
  resetError?: boolean;
  /**
   * Custom reset function
   */
  onReset?: () => void;
  /**
   * Show error details in development
   */
  showErrorDetails?: boolean;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  onRetry: () => void;
  level: ErrorBoundaryProps["level"];
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (Sentry)
    if (typeof window !== "undefined") {
      // Only report in production or when explicitly enabled
      if (
        process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_REPORT_ERRORS === "true"
      ) {
        // Import Sentry dynamically to avoid SSR issues
        import("@sentry/nextjs")
          .then((Sentry) => {
            Sentry.captureException(error, {
              contexts: {
                react: {
                  componentStack: errorInfo.componentStack,
                },
              },
              level: "error",
              tags: {
                errorBoundary: this.props.level || "unknown",
              },
            });
          })
          .catch(() => {
            // Fallback error logging
            console.error("Error Boundary:", error, errorInfo);
          });
      } else {
        // Development logging
        console.error("Error Boundary:", error, errorInfo);
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetError } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetError prop changes
    if (prevProps.resetError !== resetError && resetError && hasError) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback: CustomFallback,
      level = "component",
      showErrorDetails,
    } = this.props;

    if (hasError) {
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            errorInfo={errorInfo}
            onRetry={this.resetErrorBoundary}
            level={level}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          onRetry={this.resetErrorBoundary}
          level={level}
          showErrorDetails={showErrorDetails}
        />
      );
    }

    return children;
  }
}

interface DefaultErrorFallbackProps extends ErrorFallbackProps {
  showErrorDetails?: boolean;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
  level,
  showErrorDetails = false,
}: DefaultErrorFallbackProps) {
  const getErrorMessage = () => {
    switch (level) {
      case "root":
        return "Application Error";
      case "page":
        return "Page Error";
      case "feature":
        return "Feature Error";
      default:
        return "Component Error";
    }
  };

  const getErrorDescription = () => {
    if (showErrorDetails && error) {
      return error.message;
    }

    switch (level) {
      case "root":
        return "Something went wrong with the application. Please refresh the page or try again later.";
      case "page":
        return "There was an error loading this page. Please try again.";
      case "feature":
        return "This feature is currently unavailable. Please try again.";
      default:
        return "This component encountered an error. Please try again.";
    }
  };

  const errorDisplayType =
    level === "root" || level === "page" ? "page" : "card";

  return (
    <div className="error-boundary" data-level={level}>
      <ErrorDisplay
        type={errorDisplayType}
        message={getErrorMessage()}
        description={getErrorDescription()}
        onRetry={onRetry}
        showRetry={true}
        showNavigation={level === "root" || level === "page"}
      />

      {/* Development error details */}
      {showErrorDetails && process.env.NODE_ENV === "development" && error && (
        <details className="mt-4 p-4 border rounded bg-muted text-sm">
          <summary className="font-medium cursor-pointer">
            Error Details (Development)
          </summary>
          <div className="mt-2 space-y-2">
            <div>
              <strong>Error:</strong> {error.message}
            </div>
            <div>
              <strong>Stack:</strong>
              <pre className="mt-1 text-xs overflow-auto">{error.stack}</pre>
            </div>
            {errorInfo && (
              <div>
                <strong>Component Stack:</strong>
                <pre className="mt-1 text-xs overflow-auto">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Root level error boundary - catches all unhandled errors
 */
export function RootErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryClass
      level="root"
      showErrorDetails={process.env.NODE_ENV === "development"}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * Page level error boundary - for individual pages/routes
 */
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryClass
      level="page"
      showErrorDetails={process.env.NODE_ENV === "development"}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * Feature level error boundary - for feature modules
 */
export function FeatureErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundaryClass level="feature">{children}</ErrorBoundaryClass>;
}

/**
 * Component level error boundary - for individual components
 */
export function ComponentErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundaryClass level="component">{children}</ErrorBoundaryClass>;
}

/**
 * Main ErrorBoundary export with configurable props
 */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

export default ErrorBoundary;
