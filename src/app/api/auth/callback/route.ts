import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      await supabase.auth.getUser();
      return NextResponse.redirect(new URL("/trips", request.url));
    }

    if (error) {
      console.error(error);
    }
  }

  const cfg = process.env.NEXT_PUBLIC_REDIRECT_AFTER_AUTH || "/trips";
  const isSafePath =
    typeof cfg === "string" && cfg.startsWith("/") && !cfg.startsWith("//");
  const safePath = isSafePath ? cfg : `/trips`;

  return NextResponse.redirect(new URL(safePath, request.url));
}
