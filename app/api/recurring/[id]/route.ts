import { withAuth } from "@/lib/api-utils";
import { updateObligation, deleteObligation } from "@/lib/queries";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async ({ request, params }) => {
  const body = await request.json();
  await updateObligation(params.id, body);
  return NextResponse.json({ success: true });
}, "Failed to update obligation");

export const DELETE = withAuth(async ({ params }) => {
  await deleteObligation(params.id);
  return new NextResponse(null, { status: 204 });
}, "Failed to delete obligation");
