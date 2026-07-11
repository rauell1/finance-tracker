import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminClient } from "@/lib/sms/parse";
import {
  processSingleSms, processSingleBankSms,
  logWebhook, containsOtp, isPlaceholder, captureDebug,
} from "@/lib/sms/parse";

interface GatewayPayload {
  event: string;
  deviceId?: string;
  payload: {
    message: string;
    receivedAt: string;
    sender: string;
  };
}

function resolveUserId(supabase: AdminClient, token: string): Promise<string> {
  return resolveUserIdImpl(supabase, token);
}

async function resolveUserIdImpl(supabase: AdminClient, token: string): Promise<string> {
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (expectedSecret && token === expectedSecret) {
    const { data: mpesa } = await supabase.from("accounts").select("user_id").eq("account_code", "main").limit(1);
    if (mpesa && mpesa.length > 0) return mpesa[0].user_id;
    const { data: anyAcc } = await supabase.from("accounts").select("user_id").limit(1);
    if (anyAcc && anyAcc.length > 0) return anyAcc[0].user_id;
    return "";
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("webhook_token", token)
    .maybeSingle();
  return profile?.id ?? "";
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-webhook-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");

  const supabase = createAdminClient();
  const targetUserId = token ? await resolveUserId(supabase, token) : "";

  if (!token || !targetUserId) {
    try {
      const rawBody = await request.text();
      const contentType = request.headers.get("content-type") ?? "none";
      const smsText = rawBody;
      await logWebhook(
        supabase, rawBody, contentType, smsText,
        `unauthorized: invalid or missing token (${token ? token.slice(0, 8) + "..." : "none"})`,
        undefined
      );
    } catch { /* */ }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSync = request.nextUrl.searchParams.get("sync") === "1";
  const contentType = request.headers.get("content-type") ?? "none";
  let rawBody = "";
  try { rawBody = await request.text(); } catch { /* */ }

  console.log("[sms-gateway webhook] Received POST request:", {
    contentType,
    rawBody: rawBody.slice(0, 500),
  });

  let gatewayPayload: GatewayPayload | null = null;
  try {
    gatewayPayload = JSON.parse(rawBody) as GatewayPayload;
  } catch { /* */ }

  if (!gatewayPayload || gatewayPayload.event !== "sms:received" || !gatewayPayload.payload?.message) {
    await logWebhook(supabase, rawBody, contentType, rawBody, "invalid_gateway_payload", targetUserId);
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const smsText = gatewayPayload.payload.message;
  const timestamp = gatewayPayload.payload.receivedAt || "";

  if (containsOtp(smsText)) {
    await logWebhook(supabase, "[REDACTED OTP BODY]", contentType, "[REDACTED OTP SMS]", "otp_blocked", targetUserId);
    return NextResponse.json({ status: "ignored", reason: "security_sensitive_otp_message" });
  }

  const doProcessing = async () => {
    if (!smsText || isPlaceholder(smsText)) {
      await captureDebug(rawBody, contentType, smsText || "", "empty_or_placeholder_body");
      await logWebhook(supabase, rawBody, contentType, smsText || "", "empty_or_placeholder_body", targetUserId);
      return { status: "ignored", reason: "empty_or_placeholder_body", received_payload: gatewayPayload };
    }

    let res = await processSingleSms(supabase, smsText, targetUserId, timestamp);
    if (res.status === "ignored" && res.reason === "not_mpesa") {
      const bankRes = await processSingleBankSms(supabase, smsText, targetUserId, timestamp);
      if (bankRes.status !== "ignored" || bankRes.reason !== "not_bank_sms") {
        res = bankRes;
      }
    }
    if (res.status === "failed") {
      await logWebhook(supabase, rawBody, contentType, smsText, `failed: ${res.error ?? "unknown"}`, targetUserId);
    } else if (res.status === "ignored" && res.reason === "not_mpesa") {
      await logWebhook(supabase, rawBody, contentType, smsText, "not_mpesa", targetUserId);
    }
    return { ...res, received_payload: gatewayPayload };
  };

  if (isSync) {
    try {
      const res = await doProcessing();
      if (res.status === "failed") return NextResponse.json(res, { status: 500 });
      return NextResponse.json(res);
    } catch (err: any) {
      await logWebhook(supabase, rawBody, contentType, smsText, `exception: ${err.message}`, targetUserId);
      return NextResponse.json({ status: "failed", error: err.message, received_payload: gatewayPayload }, { status: 500 });
    }
  }

  after(async () => {
    try { await doProcessing(); } catch (err: any) {
      await logWebhook(supabase, rawBody, contentType, smsText, `exception: ${err.message}`, targetUserId);
    }
  });

  return NextResponse.json({ status: "queued", message: "Webhook payload received and queued for processing" });
}
