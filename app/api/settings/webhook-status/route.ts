import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("webhook_token")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 500 });
    }

    const admin = createAdminClient();
    const { data: logs, error: logsErr } = await admin
      .from("webhook_logs")
      .select("id, content_type, sms_text, raw_body, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsErr) {
      return NextResponse.json({ error: logsErr.message }, { status: 500 });
    }

    // Classify logs as gateway or macrodroid
    const classifiedLogs = (logs ?? []).map((log: any) => {
      const bodyStr = log.raw_body || "";
      const isGateway = bodyStr.includes("event") || bodyStr.includes("receivedAt") || bodyStr.includes("sms:received");
      return {
        id: log.id,
        content_type: log.content_type,
        sms_text: log.sms_text,
        raw_body: log.raw_body,
        reason: log.reason,
        created_at: log.created_at,
        type: isGateway ? "gateway" : "macrodroid"
      };
    });

    const macrodroidLogs = classifiedLogs.filter((l: any) => l.type === "macrodroid");
    const gatewayLogs = classifiedLogs.filter((l: any) => l.type === "gateway");

    const getStatus = (logsList: any[]) => {
      if (logsList.length === 0) return "not_configured";
      const last = logsList[0];
      const hoursSinceLast = (Date.now() - new Date(last.created_at).getTime()) / (1000 * 60 * 60);

      if (last.reason.startsWith("failed") || last.reason.startsWith("unauthorized")) {
        return "error";
      }
      if (hoursSinceLast <= 24) {
        return "active";
      }
      return "idle";
    };

    return NextResponse.json({
      webhook_token: profile.webhook_token,
      macrodroid: {
        status: getStatus(macrodroidLogs),
        last_log: macrodroidLogs[0] || null,
        history: macrodroidLogs.slice(0, 3)
      },
      gateway: {
        status: getStatus(gatewayLogs),
        last_log: gatewayLogs[0] || null,
        history: gatewayLogs.slice(0, 3)
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();
    if (type !== "macrodroid" && type !== "gateway") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("webhook_token")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const token = profile.webhook_token;
    const testId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const testMessage = `FinTrack Webhook Connection Test SMS (Type: ${type.toUpperCase()}, ID: ${testId})`;

    let testUrl = "";
    let testBody = {};

    if (type === "macrodroid") {
      testUrl = `${baseUrl}/api/webhooks/mpesa-sms?token=${token}`;
      testBody = {
        message: testMessage,
        timestamp: Date.now().toString()
      };
    } else {
      testUrl = `${baseUrl}/api/webhooks/sms-gateway?token=${token}`;
      testBody = {
        event: "sms:received",
        payload: {
          message: testMessage,
          receivedAt: new Date().toISOString()
        }
      };
    }

    console.log(`[webhook-test-trigger] Sending POST request to: ${testUrl}`);
    const res = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testBody)
    });

    const responseText = await res.text();
    console.log(`[webhook-test-trigger] Response status: ${res.status}, body: ${responseText}`);

    return NextResponse.json({
      status: "sent",
      test_message: testMessage,
      webhook_status: res.status,
      webhook_response: responseText
    });

  } catch (err: any) {
    console.error("[webhook-test-trigger] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
