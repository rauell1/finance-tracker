import { withAuth } from "@/lib/api-utils";
import { updateDebt, deleteDebt } from "@/lib/queries";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async ({ request, params }) => {
  const body = await request.json();
  await updateDebt(params.id, body);
  return NextResponse.json({ success: true });
}, "Failed to update debt");

export const DELETE = withAuth(async ({ params }) => {
  await deleteDebt(params.id);
  return new NextResponse(null, { status: 204 });
}, "Failed to delete debt");
