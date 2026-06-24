import { withAuth } from "@/lib/api-utils";
import { recordPayment } from "@/lib/queries";
import { NextResponse } from "next/server";

export const POST = withAuth(async ({ request, params }) => {
  const body = await request.json();
  if (!body.amount || !body.account_id) {
    return NextResponse.json({ error: "Missing amount or account_id" }, { status: 400 });
  }
  const result = await recordPayment(params.id, Number(body.amount), String(body.account_id), body.occurred_on);
  return NextResponse.json(result);
}, "Failed to record payment");
