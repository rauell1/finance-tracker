import { withAuth } from "@/lib/api-utils";
import { updateBudget, deleteBudget } from "@/lib/queries";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async ({ request, params }) => {
  const body = await request.json();
  await updateBudget(params.id, body);
  return NextResponse.json({ success: true });
}, "Failed to update budget");

export const DELETE = withAuth(async ({ params }) => {
  await deleteBudget(params.id);
  return new NextResponse(null, { status: 204 });
}, "Failed to delete budget");
