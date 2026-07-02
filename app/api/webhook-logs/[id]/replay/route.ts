import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Replays a logged SMS by re-posting it through the mpesa-sms webhook,
// so the full parsing/dedup/balance pipeline is reused as-is.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const admin = createAdminClient();
    const { data: log, error: fetchErr } = await admin
      .from("webhook_logs")
      .select("id, sms_text, raw_body")
      .eq("id", id)
      .single();
    if (fetchErr || !log) return NextResponse.json({ error: "Log not found" }, { status: 404 });

    const smsText = log.sms_text || log.raw_body || "";
    if (!smsText.trim()) return NextResponse.json({ error: "Log has no SMS text to replay" }, { status: 400 });

    const secret = process.env.MPESA_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "MPESA_WEBHOOK_SECRET not configured" }, { status: 500 });

    const webhookUrl = new URL("/api/webhooks/mpesa-sms", request.nextUrl.origin);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify({ message: smsText }),
    });
    const result = await res.json().catch(() => ({ error: "Non-JSON webhook response" }));

    await admin
      .from("webhook_logs")
      .update({ replayed_at: new Date().toISOString(), replay_result: result })
      .eq("id", id);

    return NextResponse.json({ status: "replayed", webhook_status: res.status, result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
