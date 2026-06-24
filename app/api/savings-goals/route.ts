import { withAuth } from "@/lib/api-utils";
import { getSavingsGoals, createSavingsGoal } from "@/lib/queries";
import { NextResponse } from "next/server";

export const GET = withAuth(async () => {
  const goals = await getSavingsGoals();
  return NextResponse.json(goals);
}, "Failed to fetch goals");

export const POST = withAuth(async ({ user, request }) => {
  const body = await request.json();
  const goal = await createSavingsGoal({ user_id: user.id, ...body });
  return NextResponse.json(goal, { status: 201 });
}, "Failed to create goal");
