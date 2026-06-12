import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

/**
 * Auth callback for Supabase email links (confirmation, magic link, recovery).
 * Must use the server client: the PKCE code verifier lives in request cookies
 * and the session must be written onto the response cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const fallback = process.env.NEXT_PUBLIC_REDIRECT_AFTER_AUTH || "/trips";
  const requested =
    next || (type === "recovery" ? "/auth/reset-password" : fallback);
  const safePath =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/trips";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safePath, request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(safePath, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=auth_callback_failed", request.url),
  );
}
