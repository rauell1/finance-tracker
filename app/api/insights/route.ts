import { withAuth } from "@/lib/api-utils";
import { generateInsights } from "@/lib/queries";
import { NextResponse } from "next/server";

export const GET = withAuth(async () => {
  const insights = await generateInsights();
  return NextResponse.json(insights);
}, "Failed to generate insights");
