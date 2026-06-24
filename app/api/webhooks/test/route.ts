import { NextRequest, NextResponse } from "next/server";

const NOT_FOUND = NextResponse.json({ error: "Not Found" }, { status: 404 });

/**
 * Diagnostic echo endpoint — mirrors back exactly what MacroDroid sent.
 * Use this to verify your macro payload before pointing it at the real webhook.
 *
 * Protected by the same MPESA_WEBHOOK_SECRET query param.
 * Disabled in production to avoid leaking request data.
 *
 * GET  /api/webhooks/test?secret=XXX  → health check
 * POST /api/webhooks/test?secret=XXX  → echoes body, headers, parsed JSON
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NOT_FOUND;
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    status: "ok",
    message: "Test webhook is alive. POST to this URL with your MacroDroid payload to inspect it.",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NOT_FOUND;
  const secret = request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "none";
  let rawBody = "";
  try { rawBody = await request.clone().text(); } catch { /* */ }

  let parsed: Record<string, unknown> | null = null;
  let parseError: string | null = null;
  try {
    if (rawBody.trim()) parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (e: unknown) {
    parseError = e instanceof Error ? e.message : String(e);
  }

  // Detect unresolved MacroDroid placeholders
  const placeholders: string[] = [];
  const PLACEHOLDER_PATTERNS = [
    "[notification_text]", "{notification_text}",
    "[date_time]", "{date_time}",
    "[sms_body]",   // only a problem if it appears LITERALLY in the value
    "[queue_contents]", "{queue_contents}",
    "[lv=queue_contents]",
  ];
  if (parsed) {
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === "string") {
        for (const ph of PLACEHOLDER_PATTERNS) {
          if (val.includes(ph)) {
            placeholders.push(`Field "${key}" contains unresolved placeholder: ${ph}`);
          }
        }
      }
    }
  }

  const diagnosis: string[] = [];

  if (!parsed) {
    diagnosis.push("❌ Body is not valid JSON — check Content-Type: application/json in MacroDroid");
  } else {
    if (!parsed.source) diagnosis.push("❌ Missing 'source' field — must be 'bank_sms' for bank macros or 'mpesa_sms' for MPESA");
    if (!parsed.message && !parsed.body && !parsed.sms) diagnosis.push("❌ Missing message field — use 'message' key with [sms_body] variable");
    if (!parsed.sender) diagnosis.push("⚠️  Missing 'sender' field — add sender: 'DTB' / 'SBMBANK' / 'IANDMBANK'");
    if (placeholders.length > 0) diagnosis.push(...placeholders.map(p => `❌ ${p}`));
    if (diagnosis.length === 0) diagnosis.push("✅ Payload looks valid — ready to send to /api/webhooks/mpesa-sms");
  }

  console.log("[test-webhook] Received:", { contentType, rawBody, parsed, placeholders, diagnosis });

  return NextResponse.json({
    status: "echo",
    content_type: contentType,
    raw_body: rawBody,
    parsed_json: parsed,
    parse_error: parseError,
    unresolved_placeholders: placeholders,
    diagnosis,
    timestamp: new Date().toISOString(),
  });
}
