import { Button } from "../ui/button";
import { Spinner } from "./spinner";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  onCancel?: () => void;
}

export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  onCancel,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={message}
    >
      <div className="bg-background rounded-lg p-6 shadow-lg border min-w-[240px] max-w-sm">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-center">{message}</p>
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FormLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function FormLoadingOverlay({
  isVisible,
  message = "Saving...",
}: FormLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    // biome-ignore lint/a11y/useSemanticElements: we need this for the status
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
      role="status"
      aria-live="assertive"
      aria-label={message}
    >
      <div className="flex flex-col items-center space-y-2">
        <Spinner size="md" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
