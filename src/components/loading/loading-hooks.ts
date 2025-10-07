"use client";

/**
 * Unified loading state management hooks for React Query integration.
 * - Centralized loading state logic
 * - Smart loading timing with debouncing
 * - Integration with existing loading components
 * - Support for optimistic updates and background fetching
 */

import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

/**
 * Loading state configuration
 */
export interface LoadingConfig {
  /**
   * Minimum time to show loading state (prevents flashing)
   */
  minLoadingTime?: number;
  /**
   * Delay before showing loading state (for fast requests)
   */
  loadingDelay?: number;
  /**
   * Show loading for background fetches
   */
  showBackgroundLoading?: boolean;
  /**
   * Custom loading conditions
   */
  customLoadingCondition?: () => boolean;
}

/**
 * Enhanced loading state with timing controls
 */
export interface EnhancedLoadingState {
  /**
   * Whether to show loading UI
   */
  isLoading: boolean;
  /**
   * Whether data is being fetched in the background
   */
  isFetching: boolean;
  /**
   * Whether this is the initial load
   */
  isInitialLoading: boolean;
  /**
   * Whether a mutation is pending
   */
  isPending: boolean;
  /**
   * Whether we should show skeleton/placeholder
   */
  showSkeleton: boolean;
  /**
   * Whether we should show spinner overlay
   */
  showSpinner: boolean;
  /**
   * Loading message if applicable
   */
  loadingMessage?: string;
}

/**
 * Hook for enhanced loading state management with React Query
 */
export function useLoadingState(
  queryResult: UseQueryResult | UseMutationResult,
  config: LoadingConfig = {},
): EnhancedLoadingState {
  const {
    minLoadingTime = 300,
    loadingDelay = 100,
    showBackgroundLoading = false,
  } = config;

  const [showLoading, setShowLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  // Extract states from query result
  const isQuery = "isLoading" in queryResult;
  const isMutation = "isPending" in queryResult;

  const rawLoading = isQuery
    ? queryResult.isLoading || queryResult.isPending
    : queryResult.isPending;
  const isFetching = isQuery ? queryResult.isFetching : false;
  const isInitialLoading = isQuery ? queryResult.isLoading : false;

  // Debounced loading state management
  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    let minTimer: NodeJS.Timeout;

    if (rawLoading) {
      // Start loading with delay
      delayTimer = setTimeout(() => {
        setShowLoading(true);
        setLoadingStartTime(Date.now());
      }, loadingDelay);
    } else {
      // Stop loading with minimum time enforcement
      if (loadingStartTime) {
        const elapsed = Date.now() - loadingStartTime;
        const remaining = Math.max(0, minLoadingTime - elapsed);

        minTimer = setTimeout(() => {
          setShowLoading(false);
          setLoadingStartTime(null);
        }, remaining);
      } else {
        setShowLoading(false);
        setLoadingStartTime(null);
      }
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minTimer);
    };
  }, [rawLoading, loadingStartTime, loadingDelay, minLoadingTime]);

  // Determine loading state based on context
  const isLoading = showLoading || rawLoading;
  const showSkeleton = isInitialLoading || (!queryResult.data && isLoading);
  const showSpinner = isMutation
    ? rawLoading
    : isFetching && showBackgroundLoading;

  return {
    isLoading,
    isFetching,
    isInitialLoading,
    isPending: isMutation ? rawLoading : false,
    showSkeleton,
    showSpinner,
  };
}

/**
 * Hook for managing multiple loading states (e.g., multiple queries)
 */
export function useMultipleLoadingStates(
  queryResults: (UseQueryResult | UseMutationResult)[],
  config: LoadingConfig & {
    loadingStrategy?: "any" | "all";
  } = {},
) {
  const { loadingStrategy = "any" } = config;

  const loadingStates = queryResults.map((result) =>
    useLoadingState(result, config),
  );

  const combinedState: EnhancedLoadingState = {
    isLoading:
      loadingStrategy === "any"
        ? loadingStates.some((state) => state.isLoading)
        : loadingStates.every((state) => state.isLoading),
    isFetching: loadingStates.some((state) => state.isFetching),
    isInitialLoading: loadingStates.some((state) => state.isInitialLoading),
    isPending: loadingStates.some((state) => state.isPending),
    showSkeleton: loadingStates.some((state) => state.showSkeleton),
    showSpinner: loadingStates.some((state) => state.showSpinner),
  };

  return {
    ...combinedState,
    individualStates: loadingStates,
  };
}

/**
 * Hook for smart component loading with automatic component selection
 */
export function useSmartLoading<TData = any>(
  queryResult: UseQueryResult<TData>,
  options: {
    skeletonType?: "section" | "list" | "inline" | "custom";
    customSkeleton?: React.ComponentType;
    loadingMessage?: string;
    config?: LoadingConfig;
  } = {},
) {
  const { skeletonType = "section", loadingMessage, config = {} } = options;

  const loadingState = useLoadingState(queryResult, config);

  const getLoadingComponent = useCallback(() => {
    if (!loadingState.showSkeleton) return null;

    // Return the appropriate loading component based on type
    switch (skeletonType) {
      case "section":
        return "SectionLoader";
      case "list":
        return "ActivityListLoader";
      case "inline":
        return "InlineLoader";
      case "custom":
        return options.customSkeleton;
      default:
        return "SectionLoader";
    }
  }, [loadingState.showSkeleton, skeletonType, options.customSkeleton]);

  return {
    ...loadingState,
    LoadingComponent: getLoadingComponent(),
    loadingMessage,
  };
}

/**
 * Hook for form submission loading states
 */
export function useFormLoadingState(
  mutation: UseMutationResult,
  options: {
    successMessage?: string;
    errorMessage?: string;
    resetFormOnSuccess?: boolean;
  } = {},
) {
  const loadingState = useLoadingState(mutation);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (mutation.isSuccess && submitted) {
      // Handle success state
      setSubmitted(false);
    } else if (mutation.isError && submitted) {
      // Handle error state
      setSubmitted(false);
    }
  }, [mutation.isSuccess, mutation.isError, submitted]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
  }, []);

  return {
    ...loadingState,
    isSubmitting: loadingState.isPending && submitted,
    isSubmitted: submitted,
    handleSubmit,
  };
}

/**
 * Hook for optimistic update loading states
 */
export function useOptimisticLoadingState<TData, TVariables>(
  mutation: UseMutationResult<TData, Error, TVariables>,
  options: {
    optimisticData?: TData;
    revertOnError?: boolean;
  } = {},
) {
  const [optimisticState, setOptimisticState] = useState<TData | null>(null);
  const loadingState = useLoadingState(mutation as any);

  useEffect(() => {
    if (mutation.isPending && options.optimisticData) {
      setOptimisticState(options.optimisticData);
    } else if (
      mutation.isSuccess ||
      (mutation.isError && options.revertOnError)
    ) {
      setOptimisticState(null);
    }
  }, [
    mutation.isPending,
    mutation.isSuccess,
    mutation.isError,
    options.optimisticData,
    options.revertOnError,
  ]);

  return {
    ...loadingState,
    optimisticData: optimisticState,
    hasOptimisticData: optimisticState !== null,
  };
}
