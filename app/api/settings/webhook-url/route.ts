import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/settings/webhook-url
 * Returns the user's personal webhook URL (including secret) to authenticated users only.
 * The secret is stored server-side in MPESA_WEBHOOK_SECRET and never exposed in client bundles.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.MPESA_WEBHOOK_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://finance.rauell.systems";

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const webhookUrl = `${baseUrl}/api/webhooks/mpesa-sms?secret=${secret}`;

  return NextResponse.json({ webhookUrl });
}
