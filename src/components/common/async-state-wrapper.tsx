"use client";

/**
 * AsyncStateWrapper provides a unified component for handling async state (loading, error, success)
 * - Integrates loading and error components
 * - Smart state detection from React Query
 * - Configurable loading and error UI
 * - Support for retry mechanisms
 * - Accessibility and performance optimizations
 */

import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type React from "react";
import {
  ErrorDisplay,
  type ErrorDisplayProps,
  useErrorHandler,
} from "@/components/error";
import { type LoadingConfig, useLoadingState } from "@/components/loading";

interface AsyncStateWrapperProps {
  /**
   * Query or mutation result from React Query
   */
  queryResult: UseQueryResult | UseMutationResult;

  /**
   * Children to render when data is loaded successfully
   */
  children: React.ReactNode;

  /**
   * Loading configuration
   */
  loadingConfig?: LoadingConfig;

  /**
   * Error display configuration
   */
  errorConfig?: Partial<ErrorDisplayProps>;

  /**
   * Custom loading component
   */
  loadingComponent?: React.ComponentType<{ isLoading: boolean }>;

  /**
   * Custom error component
   */
  errorComponent?: React.ComponentType<{
    error: unknown;
    onRetry?: () => void;
  }>;

  /**
   * Loading skeleton type
   */
  skeletonType?: "section" | "list" | "inline" | "page";

  /**
   * Error display type
   */
  errorType?: ErrorDisplayProps["type"];

  /**
   * Whether to show retry button
   */
  showRetry?: boolean;

  /**
   * Custom retry handler
   */
  onRetry?: () => void;

  /**
   * Empty state component when data exists but is empty
   */
  emptyComponent?: React.ComponentType;

  /**
   * Function to determine if data is empty
   */
  isEmpty?: (data: any) => boolean;

  /**
   * Wrapper class name
   */
  className?: string;
}

/**
 * Main AsyncStateWrapper component
 */
export function AsyncStateWrapper({
  queryResult,
  children,
  loadingConfig = {},
  errorConfig = {},
  loadingComponent: CustomLoading,
  errorComponent: CustomError,
  skeletonType = "section",
  errorType = "card",
  showRetry = true,
  onRetry,
  emptyComponent: EmptyComponent,
  isEmpty,
  className,
}: AsyncStateWrapperProps) {
  const loadingState = useLoadingState(queryResult, loadingConfig);
  const { handleError } = useErrorHandler();

  // Handle retry logic
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if ("refetch" in queryResult) {
      queryResult.refetch();
    } else if ("reset" in queryResult) {
      queryResult.reset();
    }
  };

  // Render loading state
  if (loadingState.showSkeleton) {
    if (CustomLoading) {
      return <CustomLoading isLoading={loadingState.isLoading} />;
    }

    return (
      <div className={className}>
        {getDefaultLoadingComponent(skeletonType)}
      </div>
    );
  }

  // Render error state
  if (queryResult.isError || queryResult.error) {
    const error = queryResult.error;

    if (CustomError) {
      return (
        <div className={className}>
          <CustomError error={error} onRetry={handleRetry} />
        </div>
      );
    }

    const appError = handleError(error, { showToast: false, logError: true });

    return (
      <div className={className}>
        <ErrorDisplay
          type={errorType}
          message={appError.message}
          description={errorConfig.description}
          showRetry={showRetry && appError.retryable}
          onRetry={handleRetry}
          retrying={loadingState.isLoading}
          {...errorConfig}
        />
      </div>
    );
  }

  // Check for empty state
  const data = "data" in queryResult ? queryResult.data : null;
  if (data !== null && data !== undefined && isEmpty && isEmpty(data)) {
    if (EmptyComponent) {
      return (
        <div className={className}>
          <EmptyComponent />
        </div>
      );
    }
  }

  // Render success state
  return <div className={className}>{children}</div>;
}

/**
 * Get default loading component based on skeleton type
 */
function getDefaultLoadingComponent(skeletonType: string) {
  // Dynamic imports to avoid circular dependencies
  // These would normally be imported from the loading components
  switch (skeletonType) {
    case "section":
      return (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      );

    case "list":
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );

    case "inline":
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      );

    case "page":
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );

    default:
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      );
  }
}

/**
 * Specialized wrapper for query results
 */
export function QueryWrapper<TData = any>({
  query,
  children,
  ...props
}: Omit<AsyncStateWrapperProps, "queryResult"> & {
  query: UseQueryResult<TData>;
  children: (data: TData) => React.ReactNode;
}) {
  return (
    <AsyncStateWrapper queryResult={query} {...props}>
      {query.data && children(query.data)}
    </AsyncStateWrapper>
  );
}

/**
 * Specialized wrapper for mutation results
 */
export function MutationWrapper({
  mutation,
  children,
  ...props
}: Omit<AsyncStateWrapperProps, "queryResult"> & {
  mutation: UseMutationResult;
}) {
  return (
    <AsyncStateWrapper queryResult={mutation} errorType="alert" {...props}>
      {children}
    </AsyncStateWrapper>
  );
}

/**
 * Hook for creating consistent async state handling
 */
export function useAsyncStateProps(
  queryResult: UseQueryResult | UseMutationResult,
  config?: {
    loadingConfig?: LoadingConfig;
    errorConfig?: Partial<ErrorDisplayProps>;
    skeletonType?: AsyncStateWrapperProps["skeletonType"];
    errorType?: AsyncStateWrapperProps["errorType"];
  },
) {
  const loadingState = useLoadingState(queryResult, config?.loadingConfig);

  return {
    isLoading: loadingState.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    showSkeleton: loadingState.showSkeleton,
    showSpinner: loadingState.showSpinner,
    retrying:
      loadingState.isLoading &&
      ("isFetching" in queryResult ? queryResult.isFetching : false),
  };
}
