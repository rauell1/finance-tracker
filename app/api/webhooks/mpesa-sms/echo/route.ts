import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ct = request.headers.get("content-type") ?? "none";
  const raw = await request.text().catch(() => "");
  return NextResponse.json({
    content_type: ct,
    raw_body: raw,
    length: raw.length,
    headers: Object.fromEntries(request.headers.entries()),
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Echo endpoint is live. POST payloads here to inspect headers and body structures.",
  });
}
