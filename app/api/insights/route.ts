import { NextResponse } from "next/server";
import { generateInsights } from "@/lib/queries";

export async function GET() {
  try {
    const insights = await generateInsights();
    return NextResponse.json(insights);
  } catch {
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
