// Error display components

// Error boundary components
export {
  ComponentErrorBoundary,
  ErrorBoundary,
  type ErrorFallbackProps,
  FeatureErrorBoundary,
  PageErrorBoundary,
  RootErrorBoundary,
} from "./error-boundary";
export {
  AlertError,
  CardError,
  ErrorDisplay,
  type ErrorDisplayProps,
  InlineError,
  PageError,
} from "./error-display";

// Error handling hooks and utilities
export {
  type AppError,
  type ErrorType,
  getErrorMessage,
  parseError,
  useErrorHandler,
  useFormErrorHandler,
  useQueryErrorHandler,
  useRetryHandler,
} from "./error-hooks";
