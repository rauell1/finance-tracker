import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME: delete test transactions (receipts starting TGH4K2L9, UEVLA5ZFU3)
// DELETE THIS FILE after running.
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const testReceipts = ["TGH4K2L9P1", "TGH4K2L9P2", "TGH4K2L9P3", "TGH4K2L9P4", "UEVLA5ZFU3"];
  let deleted = 0;
  for (const r of testReceipts) {
    const { count } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .contains("metadata", { mpesa_receipt: r });
    deleted += count ?? 0;
  }
  const { count: remaining } = await supabase
    .from("transactions").select("id", { count: "exact", head: true });
  return NextResponse.json({ status: "done", deleted, remaining });
}
