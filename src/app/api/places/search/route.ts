import { type NextRequest, NextResponse } from "next/server";
import { nominatimSearch, toPlaceSearchResults } from "@/lib/nominatim";
import { createClient } from "@/lib/supabaseServer";

/**
 * Place search backed by OpenStreetMap Nominatim (free, no API key / billing).
 * Returns the same PlaceSearchResult shape the app already consumes, so the
 * client-side places service and forms are unchanged.
 */
export async function GET(request: NextRequest) {
  try {
    // Same-origin API: require an authenticated Supabase user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const location = searchParams.get("location"); // "lat,lng"

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 },
      );
    }

    // Bias results around the trip location when provided
    let viewbox: string | undefined;
    if (location) {
      const [lat, lng] = location.split(",").map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const d = 0.15; // ~15km box
        viewbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
      }
    }

    const raw = await nominatimSearch(query, { viewbox });
    return NextResponse.json({ results: toPlaceSearchResults(raw) });
  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable" },
      { status: 502 },
    );
  }
}
