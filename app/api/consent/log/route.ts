import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function maskIp(ip: string | null): string {
  if (!ip) return "unknown";
  // Remove port if present
  const cleanIp = ip.split(",")[0].trim().split(":")[0];
  if (cleanIp.includes(".")) {
    // IPv4
    const parts = cleanIp.split(".");
    if (parts.length > 1) {
      parts[parts.length - 1] = "xxx";
      return parts.join(".");
    }
  } else if (cleanIp.includes(":")) {
    // IPv6
    const parts = cleanIp.split(":");
    if (parts.length > 1) {
      parts[parts.length - 1] = "xxxx";
      return parts.join(":");
    }
  }
  return cleanIp;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consentId, region, consentType, categoriesGranted } = body;

    if (!consentType || !categoriesGranted) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Get visitor metadata from headers
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const maskedIp = maskIp(ip);
    
    // Get country from Vercel header if not provided by client
    const geoCountry = region || request.headers.get("x-vercel-ip-country") || "unknown";

    // Insert log entry
    const { data, error } = await supabase
      .from("cookie_consent_logs")
      .insert({
        user_id: user?.id || null,
        consent_id: consentId || null,
        region: geoCountry,
        consent_type: consentType,
        categories_granted: categoriesGranted,
        user_agent: userAgent,
        ip_address_masked: maskedIp,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting consent log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Server error";
    console.error("Consent log API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
