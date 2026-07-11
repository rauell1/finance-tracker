import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/**
 * GET /api/settings/webhook-url
 * Returns the user's personal webhook URL (including secret) to authenticated users only.
 * If the user doesn't have a webhook_token yet, one is auto-generated and persisted.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", detail: authError?.message ?? "No user session" },
        { status: 401 }
      );
    }

    let { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("webhook_token")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      return NextResponse.json(
        { error: "Could not load profile", detail: profileErr.message, code: profileErr.code },
        { status: 500 }
      );
    }

    // Auto-generate a token if none exists yet
    if (!profile?.webhook_token) {
      const newToken = randomUUID();
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ webhook_token: newToken })
        .eq("id", user.id);

      if (updateErr) {
        return NextResponse.json(
          { error: "Could not generate webhook token", detail: updateErr.message },
          { status: 500 }
        );
      }

      profile = { webhook_token: newToken };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://finance.rauell.systems";
    const token = profile.webhook_token;
    const webhookUrl = `${baseUrl}/api/webhooks/mpesa-sms?token=${token}`;
    const smsGatewayUrl = `${baseUrl}/api/webhooks/sms-gateway?token=${token}`;

    return NextResponse.json({ webhookUrl, smsGatewayUrl });
  } catch (e) {
    return NextResponse.json(
      { error: "Unexpected error", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
