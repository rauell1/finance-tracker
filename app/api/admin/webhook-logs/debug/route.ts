import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Query params
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const reason = searchParams.get("reason") || undefined;
  const userId = searchParams.get("user_id") || undefined;
  const receipt = searchParams.get("receipt") || undefined;
  const smsSnippet = searchParams.get("sms") || undefined;
  const since = searchParams.get("since") || undefined;
  const until = searchParams.get("until") || undefined;

  let query = supabase
    .from("webhook_logs")
    .select("id, created_at, reason, content_type, sms_text, raw_body, user_id")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (reason) query = query.eq("reason", reason);
  if (userId) query = query.eq("user_id", userId);
  if (smsSnippet) query = query.ilike("sms_text", `%${smsSnippet}%`);
  if (since) query = query.gte("created_at", since);
  if (until) query = query.lte("created_at", until);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If receipt provided, also check transactions table
  let txn = null;
  if (receipt) {
    const { data: t } = await supabase
      .from("transactions")
      .select("id, mpesa_receipt, user_id, account_id, amount, txn_type, description, created_at")
      .eq("mpesa_receipt", receipt)
      .maybeSingle();
    txn = t;
  }

  return NextResponse.json({
    logs: data || [],
    count: data?.length || 0,
    transaction: txn,
    params: { limit, offset, reason, userId, receipt, since, until },
  });
}