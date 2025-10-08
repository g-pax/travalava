"use client";

/**
 * Error handling hooks and utilities for consistent error management.
 * - Standardized error handling patterns
 * - Integration with React Query
 * - Toast error notifications
 * - Form error parsing and display
 */

import { useCallback, useState } from "react";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

/**
 * Standard error types for consistent handling
 */
export type ErrorType =
  | "network"
  | "validation"
  | "authorization"
  | "not_found"
  | "server"
  | "unknown";

/**
 * Standardized error interface
 */
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  field?: string;
  code?: string | number;
  retryable?: boolean;
}

/**
 * Parse various error formats into standardized AppError
 */
export function parseError(error: unknown): AppError {
  // Already an AppError
  if (error && typeof error === "object" && "type" in error) {
    return error as AppError;
  }

  // Standard Error object
  if (error instanceof Error) {
    return {
      type: categorizeError(error),
      message: error.message || "An error occurred",
      details: error.stack,
      retryable: isRetryableError(error),
    };
  }

  // String error
  if (typeof error === "string") {
    return {
      type: "unknown",
      message: error,
      retryable: true,
    };
  }

  // API error response
  if (error && typeof error === "object" && "message" in error) {
    const apiError = error as any;
    return {
      type: categorizeApiError(apiError),
      message: apiError.message || "An error occurred",
      details: apiError.details,
      code: apiError.code || apiError.status,
      retryable: isRetryableApiError(apiError),
    };
  }

  // Fallback
  return {
    type: "unknown",
    message: "An unexpected error occurred",
    retryable: true,
  };
}

/**
 * Categorize Error objects by type
 */
function categorizeError(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (message.includes("network") || message.includes("fetch")) {
    return "network";
  }

  if (message.includes("validation") || message.includes("invalid")) {
    return "validation";
  }

  if (message.includes("unauthorized") || message.includes("forbidden")) {
    return "authorization";
  }

  if (message.includes("not found")) {
    return "not_found";
  }

  return "unknown";
}

/**
 * Categorize API error responses
 */
function categorizeApiError(error: any): ErrorType {
  const status = error.status || error.code;

  if (status >= 400 && status < 500) {
    if (status === 401 || status === 403) return "authorization";
    if (status === 404) return "not_found";
    if (status === 422) return "validation";
    return "validation";
  }

  if (status >= 500) {
    return "server";
  }

  return "network";
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes("network") || message.includes("timeout");
}

/**
 * Determine if an API error is retryable
 */
function isRetryableApiError(error: any): boolean {
  const status = error.status || error.code;
  // Retry on server errors and rate limits, but not client errors
  return status >= 500 || status === 429;
}

/**
 * Generate user-friendly error messages
 */
export function getErrorMessage(error: AppError): string {
  switch (error.type) {
    case "network":
      return "Network error. Please check your connection and try again.";
    case "validation":
      return error.message || "Please check your input and try again.";
    case "authorization":
      return "You don't have permission to perform this action.";
    case "not_found":
      return "The requested resource was not found.";
    case "server":
      return "Server error. Please try again later.";
    default:
      return error.message || "An unexpected error occurred.";
  }
}

/**
 * Hook for handling errors with toast notifications
 */
export function useErrorHandler() {
  const handleError = useCallback(
    (
      error: unknown,
      options?: {
        showToast?: boolean;
        toastTitle?: string;
        logError?: boolean;
      },
    ) => {
      const { showToast = true, toastTitle, logError = true } = options || {};

      const appError = parseError(error);
      const message = getErrorMessage(appError);

      if (logError) {
        console.error("Error handled:", appError);
      }

      if (showToast) {
        toast.error(toastTitle || message);
      }

      return appError;
    },
    [],
  );

  return { handleError, parseError };
}

/**
 * Hook for handling form errors with field-specific error setting
 */
export function useFormErrorHandler<T extends Record<string, any>>() {
  const { handleError } = useErrorHandler();

  const handleFormError = useCallback(
    (
      error: unknown,
      setError: UseFormSetError<T>,
      options?: { showToast?: boolean },
    ) => {
      const appError = handleError(error, {
        showToast: options?.showToast ?? true,
      });

      // Try to map error to specific form field
      if (appError.field && setError) {
        setError(appError.field as any, {
          type: "server",
          message: appError.message,
        });
        return appError;
      }

      // Check if error message contains field hints
      const message = appError.message.toLowerCase();
      const fieldMappings: Record<string, string[]> = {
        title: ["title", "name"],
        email: ["email", "e-mail"],
        password: ["password"],
        cost_amount: ["cost", "price", "amount"],
        date: ["date"],
        time: ["time"],
        location: ["location", "address"],
        description: ["description", "details"],
      };

      for (const [field, keywords] of Object.entries(fieldMappings)) {
        if (keywords.some((keyword) => message.includes(keyword))) {
          setError(field as any, {
            type: "server",
            message: appError.message,
          });
          return appError;
        }
      }

      return appError;
    },
    [handleError],
  );

  return { handleFormError, handleError };
}

/**
 * Hook for managing retry state with exponential backoff
 */
export function useRetryHandler() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async (
      fn: () => Promise<any>,
      options?: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        onRetry?: (attempt: number) => void;
      },
    ) => {
      const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        onRetry,
      } = options || {};

      if (retryCount >= maxRetries) {
        throw new Error(`Max retries (${maxRetries}) exceeded`);
      }

      setIsRetrying(true);

      try {
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * 2 ** retryCount, maxDelay);

        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const result = await fn();

        // Reset retry count on success
        setRetryCount(0);
        setIsRetrying(false);

        return result;
      } catch (error) {
        const newCount = retryCount + 1;
        setRetryCount(newCount);
        setIsRetrying(false);

        if (onRetry) {
          onRetry(newCount);
        }

        throw error;
      }
    },
    [retryCount],
  );

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    resetRetry,
    canRetry: retryCount < 3,
  };
}

/**
 * React Query error handler hook
 */
export function useQueryErrorHandler() {
  const { handleError } = useErrorHandler();

  const createErrorHandler = useCallback(
    (options?: { showToast?: boolean; message?: string }) => {
      return (error: unknown) => {
        handleError(error, {
          showToast: options?.showToast ?? true,
          toastTitle: options?.message,
        });
      };
    },
    [handleError],
  );

  return { createErrorHandler };
}
