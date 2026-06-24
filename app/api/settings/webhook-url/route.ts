import { withAuth } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export const GET = withAuth(async () => {
  const secret = process.env.MPESA_WEBHOOK_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://finance.rauell.systems";

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const webhookUrl = `${baseUrl}/api/webhooks/mpesa-sms?secret=${secret}`;
  return NextResponse.json({ webhookUrl });
}, "Failed to get webhook URL");
