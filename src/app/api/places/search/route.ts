import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// Server-side API key - not exposed to browser
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

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

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const location = searchParams.get("location");
    const radius = searchParams.get("radius");
    const type = searchParams.get("type");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 },
      );
    }

    // Build Google Places API URL (legacy Text Search; no `fields` support)
    const placesUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
    );
    placesUrl.searchParams.set("query", query);
    placesUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    if (location) {
      placesUrl.searchParams.set("location", location);
      placesUrl.searchParams.set("radius", radius || "5000");
    }

    if (type) {
      placesUrl.searchParams.set("type", type);
    }

    // Call Google Places API
    const response = await fetch(placesUrl.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error:", data);
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ results: data.results || [] });
  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
