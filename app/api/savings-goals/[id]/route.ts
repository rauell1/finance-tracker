import { withAuth } from "@/lib/api-utils";
import { updateSavingsGoal, deleteSavingsGoal } from "@/lib/queries";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async ({ request, params }) => {
  const body = await request.json();
  await updateSavingsGoal(params.id, body);
  return NextResponse.json({ success: true });
}, "Failed to update goal");

export const DELETE = withAuth(async ({ params }) => {
  await deleteSavingsGoal(params.id);
  return new NextResponse(null, { status: 204 });
}, "Failed to delete goal");
