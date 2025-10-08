import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/ratelimit";
import { redactPII } from "@/lib/redact";
import { supabaseServer } from "@/lib/supabaseServer";

const IP_SALT = process.env.IP_SALT || "default-salt-change-in-production";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_URL_LENGTH = 1000;

function hashIP(ip: string): string {
  return createHash("sha256")
    .update(ip + IP_SALT)
    .digest("hex");
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, context, screenshotUrl } = body;

    // Validate required fields
    if (!type || !["bug", "idea", "other"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be one of: bug, idea, other" },
        { status: 400 },
      );
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    const isRateLimitedValue = await isRateLimited(ipHash);

    if (isRateLimitedValue) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    // Sanitize and trim inputs
    const sanitizedMessage = redactPII(
      message.trim().slice(0, MAX_MESSAGE_LENGTH),
    );
    const sanitizedURL = context?.url?.slice(0, MAX_URL_LENGTH) || null;

    // Validate user authentication
    if (!context?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Insert feedback record
    const feedbackData = {
      type,
      message: sanitizedMessage,
      url: sanitizedURL,
      route: context?.route || null,
      user_id: context.userId,
      user_agent: request.headers.get("user-agent") || null,
      viewport: context?.viewport || null,
      locale: context?.locale || null,
      timezone: context?.timezone || null,
      app_version: context?.appVersion || null,
      git_sha: context?.gitSha || null,
      env: context?.env || "prod",
      feature_flags: context?.featureFlags || {},
      breadcrumbs: context?.breadcrumbs || null,
      screenshot_path: screenshotUrl || null,
      ip_hash: ipHash,
    };

    const supabase = await supabaseServer();
    const { error: insertError } = await supabase
      .from("feedback")
      .insert(feedbackData);

    if (insertError) {
      console.error("Failed to insert feedback:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
