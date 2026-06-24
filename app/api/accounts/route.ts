import { withAuth } from "@/lib/api-utils";
import { getAccounts } from "@/lib/queries";
import { NextResponse } from "next/server";

export const GET = withAuth(async () => {
  const accounts = await getAccounts();
  return NextResponse.json(accounts);
}, "Failed to fetch accounts");
