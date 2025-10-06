import { Spinner } from "./spinner";

interface PageLoaderProps {
  message?: string;
  showLogo?: boolean;
}

export function PageLoader({
  message = "Loading...",
  showLogo = true,
}: PageLoaderProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: we need this for the status
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center space-y-4">
        {showLogo && (
          <div className="text-2xl font-bold text-primary">Travalava</div>
        )}
        <Spinner size="lg" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

export function AuthLoader() {
  return <PageLoader message="Checking authentication..." />;
}

export function RouteLoader() {
  return <PageLoader message="Loading page..." />;
}
