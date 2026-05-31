import { NextRequest, NextResponse } from "next/server";

/**
 * Echo endpoint — dumps every detail of the incoming request.
 * Used to diagnose exactly what the SMS Forwarder app sends.
 * No auth required intentionally.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "none";
  const allHeaders: Record<string, string> = {};
  request.headers.forEach((val, key) => { allHeaders[key] = val; });

  let rawBody = "";
  let jsonParsed: unknown = null;
  let formFields: Record<string, string> = {};

  try {
    rawBody = await request.text();
  } catch { rawBody = "(could not read body)"; }

  // Try JSON
  try { jsonParsed = JSON.parse(rawBody); } catch { /* not JSON */ }

  // Try form-urlencoded
  if (contentType.includes("urlencoded")) {
    try {
      const params = new URLSearchParams(rawBody);
      params.forEach((v, k) => { formFields[k] = v; });
    } catch { /* not form */ }
  }

  return NextResponse.json({
    content_type: contentType,
    raw_body: rawBody,
    raw_body_length: rawBody.length,
    json_parsed: jsonParsed,
    form_fields: formFields,
    headers: allHeaders,
    url: request.url,
    method: request.method,
  });
}

export async function GET() {
  return NextResponse.json({ status: "echo endpoint ready — send POST to see request details" });
}
