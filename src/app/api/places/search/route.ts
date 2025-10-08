import { type NextRequest, NextResponse } from "next/server";

// Server-side API key - not exposed to browser
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  try {
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

    // Build Google Places API URL
    const placesUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
    );
    placesUrl.searchParams.set("query", query);
    placesUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    // Only request essential fields to minimize cost
    placesUrl.searchParams.set(
      "fields",
      "place_id,name,formatted_address,geometry,photos,rating,user_ratings_total,price_level,types,business_status,editorial_summary",
    );

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

    // Return results with CORS headers
    return NextResponse.json(
      { results: data.results || [] },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
