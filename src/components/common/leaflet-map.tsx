"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { LeafletMapProps } from "./leaflet-map-impl";

export type { LeafletMapProps, MapMarker } from "./leaflet-map-impl";

// Leaflet touches `window` at import time, so load the implementation
// client-side only.
const LeafletMapImpl = dynamic(() => import("./leaflet-map-impl"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
  ),
});

/**
 * Reusable OpenStreetMap map (Leaflet). Pass `markers`, optional `center`/`zoom`,
 * and `onMapClick` for picker behavior. Wrap in a sized container; the map
 * fills its parent.
 */
export function LeafletMap({
  className,
  ...props
}: LeafletMapProps & { className?: string }) {
  return (
    <div
      className={cn("h-[300px] w-full overflow-hidden rounded-lg", className)}
    >
      <LeafletMapImpl {...props} />
    </div>
  );
}
