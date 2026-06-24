import { withAuth } from "@/lib/api-utils";
import { getCategories, createCategory } from "@/lib/queries";
import { NextResponse } from "next/server";

export const GET = withAuth(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "income" | "expense" | null;
  const categories = await getCategories(type ?? undefined);
  return NextResponse.json(categories);
}, "Failed to fetch categories");

export const POST = withAuth(async ({ request }) => {
  const body = await request.json();
  const category = await createCategory(body);
  return NextResponse.json(category, { status: 201 });
}, "Failed to create category");
