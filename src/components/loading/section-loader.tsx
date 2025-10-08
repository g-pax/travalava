import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "./spinner";

interface SectionLoaderProps {
  title?: string;
  lines?: number;
  className?: string;
}

export function SectionLoader({
  title,
  lines = 3,
  className,
}: SectionLoaderProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: we need this for the status
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      {title && (
        <div className="mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ItineraryLoader() {
  return (
    // biome-ignore lint/a11y/useSemanticElements: we need this for the status
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading itinerary"
    >
      {Array.from({ length: 3 }).map((_, dayIndex) => (
        <div key={dayIndex} className="border rounded-lg p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, blockIndex) => (
              <div key={blockIndex} className="border rounded-md p-3">
                <Skeleton className="h-5 w-20 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityListLoader() {
  return (
    // biome-ignore lint/a11y/useSemanticElements: we need this for the status
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Loading activities"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="border rounded-lg p-4 flex items-center space-x-4"
        >
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function InlineLoader({ message }: { message?: string }) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: we need this for the status
    <div
      className="flex items-center justify-center py-8"
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
    >
      <div className="flex items-center space-x-2">
        <Spinner size="sm" />
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    </div>
  );
}
