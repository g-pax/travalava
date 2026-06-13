import { type NextRequest, NextResponse } from "next/server";
import { nominatimLookup } from "@/lib/nominatim";
import { createClient } from "@/lib/supabaseServer";

/**
 * Place details backed by OpenStreetMap Nominatim lookup. Returns the same
 * { result } shape the client expects. OSM has no phone/website for many
 * places, so those come back undefined rather than erroring.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("place_id");

    if (!placeId) {
      return NextResponse.json(
        { error: "place_id parameter is required" },
        { status: 400 },
      );
    }

    const result = await nominatimLookup(placeId);
    if (!result) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json(
      { error: "Details lookup is temporarily unavailable" },
      { status: 502 },
    );
  }
}
