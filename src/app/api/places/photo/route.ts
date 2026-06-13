import { NextResponse } from "next/server";

/**
 * Photo proxy retired with the move to OpenStreetMap — Nominatim/OSM provide no
 * place photos. Kept as a graceful 404 so any stale client reference fails
 * cleanly instead of erroring. Place imagery can be added later (e.g. Wikimedia
 * Commons via the place's wikidata tag).
 */
export function GET() {
  return NextResponse.json(
    { error: "Place photos are not available" },
    { status: 404 },
  );
}
