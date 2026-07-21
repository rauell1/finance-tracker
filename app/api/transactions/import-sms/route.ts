import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processSingleSms, processSingleBankSms, containsOtp } from "@/lib/sms/parse";

interface IngestResult {
  text: string;
  status: "success" | "ignored" | "failed";
  reason?: string;
  error?: string;
  details?: {
    amount?: number;
    transactionId?: string;
    receipt?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the session user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text payload" }, { status: 400 });
    }

    // Split text into distinct SMS blocks
    const trimmed = text.trim();
    let rawBlocks: string[] = [];

    // Split by double newlines if present, otherwise split by single newlines
    if (trimmed.includes("\n\n")) {
      rawBlocks = trimmed.split(/\n\n+/);
    } else {
      rawBlocks = trimmed.split(/\n+/);
    }

    const smsBlocks = rawBlocks.map((b) => b.trim()).filter((b) => b.length > 0);

    if (smsBlocks.length === 0) {
      return NextResponse.json({ error: "No text blocks found to process" }, { status: 400 });
    }

    // Create admin supabase client to run operations bypass RLS (same as webhook)
    const adminClient = createAdminClient();
    const results: IngestResult[] = [];

    for (const sms of smsBlocks) {
      if (containsOtp(sms)) {
        results.push({
          text: sms,
          status: "ignored",
          reason: "Contains sensitive verification code or OTP",
        });
        continue;
      }

      try {
        // Try M-Pesa processing
        let parseRes = await processSingleSms(adminClient, sms, user.id);

        // If it was ignored due to not being M-Pesa, fallback to Bank processing
        if (parseRes.status === "ignored" && parseRes.reason === "not_mpesa") {
          const bankRes = await processSingleBankSms(adminClient, sms, user.id);
          if (bankRes.status !== "ignored" || bankRes.reason !== "not_bank_sms") {
            parseRes = bankRes;
          }
        }

        if (parseRes.status === "inserted") {
          results.push({
            text: sms,
            status: "success",
            details: {
              amount: parseRes.amount,
              transactionId: parseRes.transaction_id,
              receipt: parseRes.receipt,
            },
          });
        } else if (parseRes.status === "ignored") {
          results.push({
            text: sms,
            status: "ignored",
            reason: parseRes.reason || "duplicate",
          });
        } else {
          results.push({
            text: sms,
            status: "failed",
            error: parseRes.error || "Failed parsing SMS",
          });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Error processing text block";
        results.push({
          text: sms,
          status: "failed",
          error: errorMsg,
        });
      }
    }

    const importedCount = results.filter((r) => r.status === "success").length;
    const ignoredCount = results.filter((r) => r.status === "ignored").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: ignoredCount,
      failed: failedCount,
      results,
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Server error";
    console.error("import-sms route error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
