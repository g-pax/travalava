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
    const photoReference = searchParams.get("photo_reference");
    const maxWidth = searchParams.get("maxwidth") || "400";

    if (!photoReference) {
      return NextResponse.json(
        { error: "photo_reference parameter is required" },
        { status: 400 },
      );
    }

    // Build Google Places Photo API URL
    const photoUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/photo",
    );
    photoUrl.searchParams.set("photo_reference", photoReference);
    photoUrl.searchParams.set("maxwidth", maxWidth);
    photoUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    // Call Google Places API and get the image
    const response = await fetch(photoUrl.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch photo" },
        { status: 500 },
      );
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Photo fetch error:", error);
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
