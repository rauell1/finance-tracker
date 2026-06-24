import { withAuth } from "@/lib/api-utils";
import { markAsPaid } from "@/lib/queries";
import { NextResponse } from "next/server";

export const POST = withAuth(async ({ request, params }) => {
  const body = await request.json().catch(() => ({}));
  const result = await markAsPaid(params.id, {
    account_id: body.account_id ?? null,
    occurred_on: body.occurred_on,
  });
  return NextResponse.json(result);
}, "Failed to mark as paid");
