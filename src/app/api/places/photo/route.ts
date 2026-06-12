import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// Server-side API key - not exposed to browser
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Photo references are opaque base64url-like tokens; constrain charset/length.
const PHOTO_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,1000}$/;

const DEFAULT_MAX_WIDTH = 400;

/** Only follow Google photo redirects to known Google image hosts. */
function isAllowedPhotoHost(hostname: string): boolean {
  return (
    hostname === "maps.googleapis.com" ||
    hostname === "googleusercontent.com" ||
    hostname.endsWith(".googleusercontent.com")
  );
}

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
    const photoReference = searchParams.get("photo_reference");

    if (!photoReference) {
      return NextResponse.json(
        { error: "photo_reference parameter is required" },
        { status: 400 },
      );
    }

    if (!PHOTO_REFERENCE_PATTERN.test(photoReference)) {
      return NextResponse.json(
        { error: "Invalid photo_reference" },
        { status: 400 },
      );
    }

    // Clamp maxwidth to a sane integer range accepted by the Photo API
    const parsedMaxWidth = Number.parseInt(
      searchParams.get("maxwidth") ?? `${DEFAULT_MAX_WIDTH}`,
      10,
    );
    const maxWidth = Number.isNaN(parsedMaxWidth)
      ? DEFAULT_MAX_WIDTH
      : Math.min(Math.max(parsedMaxWidth, 1), 1600);

    // Build Google Places Photo API URL
    const photoUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/photo",
    );
    photoUrl.searchParams.set("photo_reference", photoReference);
    photoUrl.searchParams.set("maxwidth", String(maxWidth));
    photoUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);

    // The Photo API responds with a redirect to the actual image. Follow it
    // manually and only if it points at a Google host, so this route can't be
    // abused as an open proxy.
    const upstream = await fetch(photoUrl.toString(), { redirect: "manual" });

    let imageResponse: Response;

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      let target: URL | null = null;
      try {
        target = location ? new URL(location) : null;
      } catch {
        target = null;
      }

      if (
        !target ||
        target.protocol !== "https:" ||
        !isAllowedPhotoHost(target.hostname)
      ) {
        return NextResponse.json(
          { error: "Unexpected photo redirect" },
          { status: 502 },
        );
      }

      imageResponse = await fetch(target.toString());
    } else if (upstream.ok) {
      imageResponse = upstream;
    } else {
      // Google rejects bad references with a 4xx; don't mask it as a 500
      return NextResponse.json(
        { error: "Failed to fetch photo" },
        { status: upstream.status >= 400 && upstream.status < 500 ? 400 : 502 },
      );
    }

    if (!imageResponse.ok || !imageResponse.body) {
      return NextResponse.json(
        { error: "Failed to fetch photo" },
        { status: 502 },
      );
    }

    // Stream the image through without buffering
    return new NextResponse(imageResponse.body, {
      headers: {
        "Content-Type":
          imageResponse.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
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
