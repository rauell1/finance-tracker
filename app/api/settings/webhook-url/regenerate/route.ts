import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/settings/webhook-url/regenerate
 * Generates a new unique webhook token for the authenticated user,
 * invalidating their old webhook URL.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate a new UUID token using the database's random generator
  const { data: profile, error: updateErr } = await supabase
    .from("profiles")
    .update({ webhook_token: crypto.randomUUID() })
    .eq("id", user.id)
    .select("webhook_token")
    .single();

  if (updateErr || !profile?.webhook_token) {
    return NextResponse.json({ error: "Failed to regenerate token" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://finance.rauell.systems";
  const webhookUrl = `${baseUrl}/api/webhooks/mpesa-sms?token=${profile.webhook_token}`;

  return NextResponse.json({ webhookUrl });
}
