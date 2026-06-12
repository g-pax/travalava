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
    const placeId = searchParams.get("place_id");

    if (!placeId) {
      return NextResponse.json(
        { error: "place_id parameter is required" },
        { status: 400 },
      );
    }

    // Build Google Places Details API URL
    const detailsUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json",
    );
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    // Request specific fields to control costs
    detailsUrl.searchParams.set(
      "fields",
      "place_id,name,formatted_address,geometry,photos,rating,user_ratings_total,price_level,types,business_status,formatted_phone_number,website,url,reviews,editorial_summary,opening_hours",
    );

    // Call Google Places API
    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status === "NOT_FOUND") {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    if (data.status !== "OK") {
      console.error("Place Details API error:", data);
      return NextResponse.json(
        { error: `Place Details API error: ${data.status}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ result: data.result });
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
