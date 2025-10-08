import { supabaseServer } from "./supabaseServer";

/**
 * Check if an IP hash has exceeded the rate limit
 * Allows 5 submissions per 10 minutes
 */
export async function isRateLimited(ipHash: string): Promise<boolean> {
  try {
    const supabase = await supabaseServer();
    const { count, error } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow the request if we can't check
      return false;
    }

    return (count || 0) >= 5;
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow the request if we can't check
    return false;
  }
}
