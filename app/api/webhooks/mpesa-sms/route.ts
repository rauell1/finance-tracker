import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminClient } from "@/lib/sms/parse";
import {
  P, guessCategory, guessMpesaCategory, getOrCreateCategory,
  num, parseDate, cleanName, containsOtp, scrubSensitiveData, cleanSms, looksLikeMpesa, hashString,
  parseSbmSMS, parseDtbSMS, parseImSMS, parseBankSms, parse,
  parseBankSmsWithNvidia,
  reconcileLinkedTransaction,
  processSingleSms, processSingleBankSms,
  setBalance, getLastMpesaBalance, inferFulizaRepayment, upsertAutoDebt,
  extractSmsText, logWebhook, isPlaceholder, parseMacroDroidTimestamp, captureDebug,
  DTB_HISTORICAL_DATES, IM_HISTORICAL_DATES,
  Parsed, ParsedSbm, ParsedBankResult, NvidiaParsedResult,
} from "@/lib/sms/parse";



export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-webhook-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  
  const supabase = createAdminClient();
  let targetUserId = "";

  if (token) {
    // Check if token matches the legacy global secret
    const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
    if (expectedSecret && token === expectedSecret) {
      const { data: mpesa } = await supabase.from("accounts").select("user_id").eq("account_code", "main").limit(1);
      if (mpesa && mpesa.length > 0) {
        targetUserId = mpesa[0].user_id;
      } else {
        const { data: anyAcc } = await supabase.from("accounts").select("user_id").limit(1);
        if (anyAcc && anyAcc.length > 0) {
          targetUserId = anyAcc[0].user_id;
        }
      }
    } else {
      // Multi-tenant check: match webhook_token in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("webhook_token", token)
        .maybeSingle();

      if (profile) {
        targetUserId = profile.id;
      }
    }
  }

  if (!token || !targetUserId) {
    try {
      const contentType = request.headers.get("content-type") ?? "none";
      const rawBody = await request.text();
      const smsText = extractSmsText(rawBody, contentType);
      const tokenSnippet = token ? `${token.slice(0, 8)}...` : "none";
      await logWebhook(
        supabase,
        rawBody,
        contentType,
        smsText,
        `unauthorized: invalid or missing token (${tokenSnippet})`,
        undefined
      );
    } catch (e) {
      console.warn("[mpesa-sms webhook] Failed to log unauthorized webhook request:", e);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSync = request.nextUrl.searchParams.get("sync") === "1";

  // Capture raw body up-front
  const contentType = request.headers.get("content-type") ?? "none";
  let rawBody = "";
  try { rawBody = await request.text(); } catch { /* */ }

  // Detailed raw console logging as requested
  console.log("[mpesa-sms webhook] Received POST request:", {
    contentType,
    rawBody: rawBody
  });

  // Try parsing rawBody as JSON - sanitise literal newlines inside string values first,
  // since MacroDroid forwards Fuliza SMS with a real \n between receipt and body.
  function sanitizeJsonNewlines(raw: string): string {
    let inStr = false, esc = false, out = "";
    for (const ch of raw) {
      if (esc) { esc = false; out += ch; continue; }
      if (ch === "\\" && inStr) { esc = true; out += ch; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr && ch === "\n") { out += "\\n"; continue; }
      if (inStr && ch === "\r") { out += "\\r"; continue; }
      out += ch;
    }
    return out;
  }

  let payload: any = null;
  try {
    if (rawBody.trim()) {
      payload = JSON.parse(sanitizeJsonNewlines(rawBody));
    }
  } catch (err) {
    // Not JSON
  }

  // Check for placeholder strings in parsed payload
  if (payload) {
    const msg = payload.message || payload.body || payload.sms || payload.text || payload.msg || payload.content || payload.sms_body;
    const ts = payload.timestamp;
    const batch = payload.batch;

    if (
      (msg && isPlaceholder(msg)) ||
      (ts && isPlaceholder(ts)) ||
      (batch && (batch.trim() === "[lv=queue_contents]" || batch.trim() === "{queue_contents}" || batch.trim() === "[queue_contents]"))
    ) {
      console.warn("[mpesa-sms webhook] Rejected due to unresolved placeholders in JSON payload:", payload);
      // 200 so MacroDroid doesn't treat this as a delivery failure and retry
      return NextResponse.json({
        status: "ignored",
        reason: "unresolved_macrodroid_placeholder",
        received_payload: payload
      });
    }
  }

  // Extract text and timestamp synchronously before spawning async processing
  const smsText = extractSmsText(rawBody, contentType);

  if (containsOtp(smsText)) {
    console.warn("[mpesa-sms webhook] Blocked OTP/verification code message");
    await logWebhook(supabase, "[REDACTED OTP BODY]", contentType, "[REDACTED OTP SMS]", "otp_blocked", targetUserId);
    return NextResponse.json({
      status: "ignored",
      reason: "security_sensitive_otp_message"
    });
  }

  let timestamp = "";
  if (payload) {
    timestamp = payload.timestamp || "";
  }

  const doProcessing = async () => {
    // Handle Bank Sync batch payload
    if (payload && payload.source === "bank_sync") {
      const batchContent = payload.batch || "";
      const lines = batchContent.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
      const results = [];

      console.log(`[bank-sms webhook] Processing bank_sync batch of ${lines.length} lines`);

      for (const line of lines) {
        const parts = line.split("|||");
        const lineSmsText = parts[0]?.trim();
        const lineTimestamp = parts[1]?.trim();

        if (!lineSmsText || isPlaceholder(lineSmsText)) {
          results.push({ status: "ignored", reason: "empty_or_placeholder_line", line });
          continue;
        }

        if (containsOtp(lineSmsText)) {
          results.push({ status: "ignored", reason: "security_sensitive_otp_message", line });
          continue;
        }

        try {
          const res = await processSingleBankSms(supabase, lineSmsText, targetUserId, lineTimestamp);
          results.push({ line, ...res });
          if (res.status === "failed") {
            await logWebhook(supabase, line, contentType, lineSmsText, `failed (batch): ${res.error ?? "unknown"}`, targetUserId);
          }
        } catch (err: any) {
          console.error(`[bank-sms webhook] Error processing batch line: ${line}`, err);
          results.push({ line, status: "failed", error: err.message });
          await logWebhook(supabase, line, contentType, lineSmsText, `exception (batch): ${err.message}`, targetUserId);
        }
      }

      return {
        status: "processed",
        batch_size: lines.length,
        results,
        received_payload: payload
      };
    }

    // Handle Bank SMS single payload
    if (payload && payload.source === "bank_sms") {
      const lineSmsText = payload.message || payload.body || payload.sms || payload.text || payload.msg || payload.content || payload.sms_body || "";
      const lineTimestamp = payload.timestamp || "";
      const sender = payload.sender || "";

      if (!lineSmsText || isPlaceholder(lineSmsText)) {
        await logWebhook(supabase, rawBody, contentType, lineSmsText || "", "empty_or_placeholder_body", targetUserId);
        return {
          status: "ignored",
          reason: "empty_or_placeholder_body",
          received_payload: payload
        };
      }

      if (containsOtp(lineSmsText)) {
        await logWebhook(supabase, "[REDACTED OTP BODY]", contentType, "[REDACTED OTP SMS]", "otp_blocked", targetUserId);
        return {
          status: "ignored",
          reason: "security_sensitive_otp_message",
          received_payload: payload
        };
      }

      const res = await processSingleBankSms(supabase, lineSmsText, targetUserId, lineTimestamp, sender);
      if (res.status === "failed") {
        await logWebhook(supabase, rawBody, contentType, lineSmsText, `failed: ${res.error ?? "unknown"}`, targetUserId);
      } else if (res.status === "ignored" && res.reason === "not_bank_sms") {
        await logWebhook(supabase, rawBody, contentType, lineSmsText, "not_bank_sms", targetUserId);
      }
      return {
        ...res,
        received_payload: payload
      };
    }

    // Handle batch payload
    if (payload && payload.batch) {
      const batchContent = payload.batch;
      const lines = batchContent.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
      const results = [];

      console.log(`[mpesa-sms webhook] Processing batch of ${lines.length} lines`);

      for (const line of lines) {
        const parts = line.split("|||");
        const lineSmsText = parts[0]?.trim();
        const lineTimestamp = parts[1]?.trim();

        if (!lineSmsText || isPlaceholder(lineSmsText)) {
          results.push({ status: "ignored", reason: "empty_or_placeholder_line", line });
          continue;
        }

        if (containsOtp(lineSmsText)) {
          results.push({ status: "ignored", reason: "security_sensitive_otp_message", line });
          continue;
        }

        try {
          let res = await processSingleSms(supabase, lineSmsText, targetUserId, lineTimestamp);
          if (res.status === "ignored" && res.reason === "not_mpesa") {
            const bankRes = await processSingleBankSms(supabase, lineSmsText, targetUserId, lineTimestamp);
            if (bankRes.status !== "ignored" || bankRes.reason !== "not_bank_sms") {
              res = bankRes;
            }
          }
          results.push({ line, ...res });
          if (res.status === "failed") {
            await logWebhook(supabase, line, contentType, lineSmsText, `failed (batch): ${res.error ?? "unknown"}`, targetUserId);
          }
        } catch (err: any) {
          console.error(`[mpesa-sms webhook] Error processing batch line: ${line}`, err);
          results.push({ line, status: "failed", error: err.message });
          await logWebhook(supabase, line, contentType, lineSmsText, `exception (batch): ${err.message}`, targetUserId);
        }
      }

      return {
        status: "processed",
        batch_size: lines.length,
        results,
        received_payload: payload
      };
    }

    if (!smsText || isPlaceholder(smsText)) {
      await captureDebug(rawBody, contentType, smsText || "", "empty_or_placeholder_body");
      await logWebhook(supabase, rawBody, contentType, smsText || "", "empty_or_placeholder_body", targetUserId);
      return {
        status: "ignored",
        reason: "empty_or_placeholder_body",
        content_type: contentType,
        received_payload: payload || rawBody
      };
    }

    let res = await processSingleSms(supabase, smsText, targetUserId, timestamp);
    if (res.status === "ignored" && res.reason === "not_mpesa") {
      const bankRes = await processSingleBankSms(supabase, smsText, targetUserId, timestamp);
      if (bankRes.status !== "ignored" || bankRes.reason !== "not_bank_sms") {
        res = bankRes;
      }
    }
    if (res.status === "failed") {
      await logWebhook(supabase, rawBody, contentType, smsText, `failed: ${res.error ?? "unknown"}`, targetUserId);
    } else if (res.status === "ignored" && res.reason === "not_mpesa") {
      await logWebhook(supabase, rawBody, contentType, smsText, "not_mpesa", targetUserId);
    }
    return {
      ...res,
      received_payload: payload || rawBody
    };
  };

  if (isSync) {
    try {
      const res = await doProcessing();
      if (res.status === "failed") {
        return NextResponse.json(res, { status: 500 });
      }
      return NextResponse.json(res);
    } catch (err: any) {
      console.error("[mpesa-sms webhook sync] Unexpected processing error:", err);
      await logWebhook(supabase, rawBody, contentType, smsText, `exception: ${err.message}`, targetUserId);
      return NextResponse.json(
        {
          status: "failed",
          error: err.message,
          received_payload: payload || rawBody
        },
        { status: 500 }
      );
    }
  } else {
    // Process asynchronously using Next.js 15 after()
    after(async () => {
      try {
        await doProcessing();
      } catch (err: any) {
        console.error("[mpesa-sms webhook async] Unexpected processing error inside after():", err);
        await logWebhook(supabase, rawBody, contentType, smsText, `exception: ${err.message}`, targetUserId);
      }
    });

    return NextResponse.json({
      status: "queued",
      message: "Webhook payload received and queued for processing"
    });
  }
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data: accounts } = await supabase.from("accounts").select("account_code, name, opening_balance, currency_code").order("account_code");
  const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true });
  // ?diagnose=1 -> calculate exact balances using frontend query logic to check math
  if (request.nextUrl.searchParams.get("diagnose") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, name, account_code, opening_balance, user_id");
    if (!accts) return NextResponse.json({ error: "No accounts" });
    const { data: profiles } = await supabase.from("profiles").select("id, full_name");
    const { data: txns } = await supabase.from("transactions").select("user_id, description, amount");
    const { data: debts } = await supabase.from("debts").select("*");
    
    const ids = accts.map((a: any) => a.id);
    const balances: Record<string, number> = {};
    for (const id of ids) balances[id] = 0;
    
    let totalBalance = accts.reduce((s: number, a: any) => s + Number(a.opening_balance), 0);
    let outflowsList = [];
    let inflowsList = [];

    if (ids.length > 0) {
      const [{ data: outflows }, { data: inflows }] = await Promise.all([
        supabase.from("transactions").select("account_id, amount, txn_type"),
        supabase.from("transactions").select("transfer_account_id, amount").not("transfer_account_id", "is", null),
      ]);
      outflowsList = outflows || [];
      inflowsList = inflows || [];

      for (const r of outflows || []) {
        if (r.txn_type === "income") {
          balances[r.account_id] += Number(r.amount);
          totalBalance += Number(r.amount);
        } else {
          balances[r.account_id] -= Number(r.amount);
          totalBalance -= Number(r.amount);
        }
      }
      for (const r of inflows || []) {
        if (r.transfer_account_id) {
          balances[r.transfer_account_id] += Number(r.amount);
          totalBalance += Number(r.amount);
        }
      }
    }

    const calculatedAccounts = accts.map((a: any) => ({
      name: a.name,
      account_code: a.account_code,
      opening_balance: Number(a.opening_balance),
      net_change: balances[a.id] || 0,
      calculated_balance: Number(a.opening_balance) + (balances[a.id] || 0),
      user_id: a.user_id,
    }));

    return NextResponse.json({
      status: "diagnose",
      total_balance: totalBalance,
      accounts: calculatedAccounts,
      transaction_count: outflowsList.length,
      profiles: profiles,
      debts: debts,
      fuliza_transactions: (txns || []).filter((t: any) => t.description?.toLowerCase().includes("fuliza")),
      transactions_summary: (txns || []).slice(0, 10).map((t: any) => ({ user_id: t.user_id, desc: t.description, amt: t.amount })),
    });
  }

  // ?reprocess=<receipt> -> delete and reprocess a transaction with new regexes
  const repReceipt = request.nextUrl.searchParams.get("reprocess");
  if (repReceipt) {
    const { data: txn } = await supabase.from("transactions").select("id, metadata").contains("metadata", { mpesa_receipt: repReceipt }).limit(1).maybeSingle();
    if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    const rawSms = (txn.metadata as Record<string, any>)?.raw_sms;
    if (!rawSms) return NextResponse.json({ error: "No raw SMS text in metadata" }, { status: 400 });

    await supabase.from("transactions").delete().eq("id", txn.id);

    const p = parse(rawSms);
    if (!p) return NextResponse.json({ error: "Failed to parse SMS with new regexes" }, { status: 400 });

    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    const mpesa = (accts ?? []).find((a: any) => a.account_code === "main");
    if (!mpesa) return NextResponse.json({ error: "M-Pesa account not found" }, { status: 404 });
    const userId = mpesa.user_id;

    let result = null;

    if (p.txnType === "transfer" && p.savingsCode) {
      const savings = (accts ?? []).find((a: any) => a.account_code === p.savingsCode);
      if (!savings) return NextResponse.json({ error: `${p.savingsCode} account not found` }, { status: 404 });

      const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
      const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;

      const { data: newTxn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
        txn_type: "transfer", amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
        description: p.description,
        metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, savings_balance: p.savingsBal, raw_sms: p.raw },
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      if (p.mpesaBal !== null)   { await setBalance(supabase, mpesa.id, p.mpesaBal); }
      if (p.savingsBal !== null && p.savingsBal !== undefined) { await setBalance(supabase, savings.id, p.savingsBal); }
      result = { status: "reprocessed", id: newTxn.id, mpesa_balance: p.mpesaBal, savings_balance: p.savingsBal };
    } else {
      const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
      const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");

      const { data: newTxn, error } = await supabase.from("transactions").insert({
        user_id: userId, account_id: mpesa.id, category_id: category.id,
        txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
        description: p.description,
        metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, txn_cost: p.txnCost, needs_review: p.needsReview, raw_sms: p.raw },
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      if (p.mpesaBal !== null) { await setBalance(supabase, mpesa.id, p.mpesaBal); }
      result = { status: "reprocessed", id: newTxn.id, balance_after: p.mpesaBal };
    }

    return NextResponse.json(result);
  }

  if (request.nextUrl.searchParams.get("backfill") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });
    
    const mpesa = accts.find((a: any) => a.account_code === "main");
    const kcb = accts.find((a: any) => a.account_code === "kcb_mpesa");
    if (!mpesa || !kcb) return NextResponse.json({ error: "Main or KCB account missing" }, { status: 500 });
    const userId = mpesa.user_id;

    // 1. Delete all transactions created by the webhook or debug capturing
    await supabase.from("transactions").delete().eq("user_id", userId).or("metadata->>source.eq.sms_webhook,metadata->>source.eq.webhook_debug");
    
    // 2. Delete any manual upkeep double entry
    await supabase.from("transactions").delete().eq("user_id", userId).eq("description", "Monthly Upkeep sent by Okwembas");

    const smsList = [
      "UEULA5XIBK confirmed. You have received Ksh12,852.00 from Jenifer Akoth OkwembaGilles in US via Sendwave on 30/5/26 at 8:06 PM. New M-PESA balance is Ksh12,852.00.",
      "UEULA5XIBO Confirmed. Ksh 1142.46 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA. Available Fuliza M-PESA limit is Ksh 1500.00. Your M-PESA balance is 11709.54.",
      "UEULA5XMT4 Confirmed. Ksh500.00 sent to Gathogo  Kigotho 0708767392 on 30/5/26 at 8:10 PM. New M-PESA balance is Ksh11,202.54. Transaction cost, Ksh7.00.  Amount you can transact within the day is 498,340.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XT58 Confirmed. Ksh40.00 sent to JOSPHAT  MUTINDA on 30/5/26 at 9:12 PM. New M-PESA balance is Ksh11,162.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,300.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEULA5XW6C Confirmed. Ksh75.00 paid to Polymatt Supermarket. on 30/5/26 at 9:17 PM.New M-PESA balance is Ksh11,087.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,225.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XWBQ Confirmed. Ksh70.00 paid to ATOMIC INC 3. on 30/5/26 at 9:25 PM.New M-PESA balance is Ksh11,017.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,155.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEULA5XWCI Confirmed. Ksh350.00 paid to SIP AND SAVOR WINERIES. on 30/5/26 at 9:26 PM.New M-PESA balance is Ksh10,667.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 497,805.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5Z1RU Confirmed. Ksh200.00 sent to MUSA  YAVATSA 0768360370 on 31/5/26 at 10:27 AM. New M-PESA balance is Ksh10,460.54. Transaction cost, Ksh7.00.  Amount you can transact within the day is 499,800.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5Z4SY Confirmed. Ksh100.00 sent to IAN  HOKA 0705241027 on 31/5/26 at 10:28 AM. New M-PESA balance is Ksh10,360.54. Transaction cost, Ksh0.00.  Amount you can transact within the day is 499,700.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA5Z7JP Confirmed. Ksh500.00 sent to DTB 247 for account 5804605001 on 31/5/26 at 10:41 AM New M-PESA balance is Ksh9,855.54. Transaction cost, Ksh5.00.Amount you can transact within the day is 499,200.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA5ZFU3 Confirmed. Ksh400.00 paid to SIP AND SAVOR WINERIES. on 31/5/26 at 12:15 PM.New M-PESA balance is Ksh9,455.54. Transaction cost, Ksh0.00. Amount you can transact within the day is 498,800.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA5ZL0C Confirmed. Ksh9,000.00 transfered to KCB M-PESA account on 31/5/26 at 12:33 PM. New M-PESA balance is Ksh455.54, new KCB M-PESA Saving account balance is Ksh9,000.00.",
      "UEVLA5ZMZV Confirmed. Ksh450.00 sent to KPLC PREPAID for account 14244145760 on 31/5/26 at 1:08 PM New M-PESA balance is Ksh0.54. Transaction cost, Ksh5.00.Amount you can transact within the day is 489,350.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA606GQ Confirmed. Ksh140.00 paid to IMPALA STREET EATERIES. on 31/5/26 at 3:03 PM.New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 489,210.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA606GQ Confirmed. Fuliza M-PESA amount is Ksh 139.46. Access Fee charged Ksh 1.40. Total Fuliza M-PESA outstanding amount is Ksh140.86 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA601MI Confirmed. Ksh50.00 sent to DAVID  KINUTHIA on 31/5/26 at 3:09 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 489,160.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA601MI Confirmed. Fuliza M-PESA amount is Ksh 50.00. Access Fee charged Ksh 0.50. Total Fuliza M-PESA outstanding amount is Ksh191.36 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA604TD Confirmed. Fuliza M-PESA amount is Ksh 30.00. Access Fee charged Ksh 0.30. Total Fuliza M-PESA outstanding amount is Ksh221.66 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA60MGN Confirmed. Ksh40.00 sent to PETER  NJOROGE KAHORO on 31/5/26 at 5:01 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 489,090.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA60MGN Confirmed. Fuliza M-PESA amount is Ksh 40.00. Access Fee charged Ksh 0.40. Total Fuliza M-PESA outstanding amount is Ksh262.06 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA60H7J Confirmed. Ksh50.00 sent to SONIA  OTIENO 0746511297 on 31/5/26 at 5:02 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00.  Amount you can transact within the day is 489,040.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA60H7J Confirmed. Fuliza M-PESA amount is Ksh 50.00. Access Fee charged Ksh 0.50. Total Fuliza M-PESA outstanding amount is Ksh312.56 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA60NS4 Confirmed. Ksh300.00 sent to BRIAN  BURUDI 0720214254 on 31/5/26 at 5:03 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh7.00.  Amount you can transact within the day is 488,740.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA60NS4 Confirmed. Fuliza M-PESA amount is Ksh 307.00. Access Fee charged Ksh 3.07. Total Fuliza M-PESA outstanding amount is Ksh622.63 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA61G8X Confirmed. Ksh400.00 sent to Equity Paybill Account for account 0790962744 on 31/5/26 at 8:02 PM New M-PESA balance is Ksh0.00. Transaction cost, Ksh5.00.Amount you can transact within the day is 488,340.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA61G8X Confirmed. Fuliza M-PESA amount is Ksh 405.00. Access Fee charged Ksh 4.05. Total Fuliza M-PESA outstanding amount is Ksh1031.68 due on 30/06/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UEVLA61NCL Confirmed. Ksh 1031.68 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA. Available Fuliza M-PESA limit is Ksh 1500.00. Your M-PESA balance is 968.32.",
      "UEVLA61NCK Confirmed. You have transfered Ksh2,000.00 from your KCB M-PESA account on 31/5/26 at 8:06 PM. KCB M-PESA Account balance is Ksh7,000.00. New M-PESA balance is Ksh2,000.00.",
      "UEVLA61GK8 Confirmed. Ksh150.00 paid to DANIEL WANYOIKE NGUGI. on 31/5/26 at 8:15 PM.New M-PESA balance is Ksh818.32. Transaction cost, Ksh0.00. Amount you can transact within the day is 488,190.00. Download My OneApp on https://saf.cx/lPKcC",
      "UEVLA61Q0J Confirmed. Ksh280.00 sent to Equity Paybill Account for account 250019 on 31/5/26 at 8:20 PM New M-PESA balance is Ksh533.32. Transaction cost, Ksh5.00.Amount you can transact within the day is 487,910.00. Download My OneApp on https://saf.cx/kWQpy",
      "UEVLA61VAC Confirmed. Ksh200.00 transfered to KCB M-PESA account on 31/5/26 at 9:10 PM. New M-PESA balance is Ksh333.32, new KCB M-PESA Saving account balance is Ksh7,200.00.",
      "UEVLA61PXE Confirmed. Ksh100.00 transfered to KCB M-PESA account on 31/5/26 at 9:16 PM. New M-PESA balance is Ksh233.32, new KCB M-PESA Saving account balance is Ksh7,300.00.",
      "UEVLA620VX confirmed.You bought Ksh5.00 of airtime for 254704612435 on 31/5/26 at 9:36 PM.New  balance is Ksh228.32. Transaction cost, Ksh0.00. Amount you can transact within the day is 487,605.00.You can now access M-PESA via *334#",
      "UF1LA62OX6 Confirmed. Ksh100.00 transfered to KCB M-PESA account on 1/6/26 at 9:15 AM. New M-PESA balance is Ksh28.32, new KCB M-PESA Saving account balance is Ksh7,500.00.",
      "UF1LA62OVV Confirmed. Ksh100.00 transfered to KCB M-PESA account on 1/6/26 at 9:13 AM. New M-PESA balance is Ksh128.32, new KCB M-PESA Saving account balance is Ksh7,400.00.",
      "UF1LA62TF0 Confirmed. You have transfered Ksh100.00 from your KCB M-PESA account on 1/6/26 at 9:42 AM. KCB M-PESA Account balance is Ksh7,400.00. New M-PESA balance is Ksh128.32.",
      "UF1LA62YXP Confirmed. You have transfered Ksh100.00 from your KCB M-PESA account on 1/6/26 at 10:04 AM. KCB M-PESA Account balance is Ksh7,300.00. New M-PESA balance is Ksh228.32.",
      "UF1LA630GR Confirmed. You have transfered Ksh100.00 from your KCB M-PESA account on 1/6/26 at 10:08 AM. KCB M-PESA Account balance is Ksh7,200.00. New M-PESA balance is Ksh328.32.",
      "UF1LA633NI Confirmed. Ksh400.00 paid to SIP AND SAVOR WINERIES. on 1/6/26 at 10:41 AM.New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00. Amount you can transact within the day is 499,400.00. Download My OneApp on https://saf.cx/lPKcC",
      "UF1LA633NI Confirmed. Fuliza M-PESA amount is Ksh 71.68. Access Fee charged Ksh 0.72. Total Fuliza M-PESA outstanding amount is Ksh72.40 due on 01/07/26. To check daily charges, Dial *334#OK Select Query Charges",
      "UF1LA633QX Confirmed. On 1/6/26 at 10:45 AM Give Ksh300.00 cash to SWISSCOM VENTURES  LTD Joska hse Gusii rd Nakuru New M-PESA balance is Ksh300.00. You can now access M-PESA via *334#",
      "UF1LA632C9 Confirmed. Ksh 72.40 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA. Available Fuliza M-PESA limit is Ksh 1500.00. Your M-PESA balance is 227.60.",
      "UF1LA63SEV Confirmed. You have transfered Ksh200.00 from your KCB M-PESA account on 1/6/26 at 2:11 PM. KCB M-PESA Account balance is Ksh7,000.00. New M-PESA balance is Ksh427.60."
    ];

    const ingested = [];
    for (const sms of smsList) {
      const p = parse(sms);
      if (!p) continue;

      if (p.kind === "fuliza") {
        const outstanding = p.fulizaOutstanding ?? 0;
        const fee = p.fulizaFee ?? 0;
        const amount = p.fulizaAmount ?? 0;

        await upsertAutoDebt(supabase, userId, "fuliza", "Safaricom Fuliza", outstanding);

        if (fee > 0 && p.receipt !== "UNKNOWN") {
          const feeReceipt = p.receipt + "-fee";
          const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true })
            .eq("user_id", userId).contains("metadata", { mpesa_receipt: feeReceipt });
          if (!count || count === 0) {
            const category = await getOrCreateCategory(supabase, userId, "Other Expense", "expense");
            if (category) {
              await supabase.from("transactions").insert({
                user_id: userId, account_id: mpesa.id, category_id: category.id, txn_type: "expense",
                amount: fee, currency_code: "KES", occurred_on: p.occurredOn,
                description: "Fuliza Access Fee",
                metadata: { source: "sms_webhook", mpesa_receipt: feeReceipt, parent_receipt: p.receipt, raw_sms: p.raw }
              });
              ingested.push({ receipt: feeReceipt, kind: "expense", amount: fee, desc: "Fuliza Access Fee" });
            }
          }
        }

        if (amount > 0 && p.receipt !== "UNKNOWN") {
          const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true })
            .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt });
          if (!count || count === 0) {
            const category = await getOrCreateCategory(supabase, userId, "Other Expense", "expense");
            if (category) {
              await supabase.from("transactions").insert({
                user_id: userId, account_id: mpesa.id, category_id: category.id, txn_type: "expense",
                amount: amount, currency_code: "KES", occurred_on: p.occurredOn,
                description: "Fuliza transaction (auto-generated)",
                metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, is_auto_generated: true, raw_sms: p.raw }
              });
              ingested.push({ receipt: p.receipt, kind: "expense", amount: amount, desc: "Fuliza Overdraft" });
            }
          }
        }
        continue;
      }

      if (p.amount <= 0) continue;

      // Dedup / Update auto-generated
      if (p.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, metadata")
          .eq("user_id", userId).contains("metadata", { mpesa_receipt: p.receipt }).maybeSingle();

        if (existing) {
          const isAuto = (existing.metadata as Record<string, any>)?.is_auto_generated === true;
          if (isAuto) {
            const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
            const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");
            await supabase.from("transactions").update({
              category_id: category?.id ?? null,
              txn_type: p.txnType,
              amount: p.amount,
              description: p.description,
              metadata: {
                ...((existing.metadata as Record<string, any>) ?? {}),
                source: "sms_webhook",
                counterparty: p.counterparty,
                balance_after: p.mpesaBal,
                txn_cost: p.txnCost,
                needs_review: p.needsReview,
                raw_sms: p.raw,
                is_auto_generated: false
              }
            }).eq("id", existing.id);
            ingested.push({ receipt: p.receipt, kind: p.txnType, amount: p.amount, desc: "Updated auto-generated" });
          }
          continue;
        }
      }

      // Handle transfers
      if (p.txnType === "transfer" && p.savingsCode) {
        const savings = accts.find((a: any) => a.account_code === p.savingsCode);
        if (!savings) continue;
        const fromId = p.kind === "transfer_out" ? mpesa.id : savings.id;
        const toId   = p.kind === "transfer_out" ? savings.id : mpesa.id;
        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
          txn_type: "transfer", amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
          description: p.description,
          metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, savings_balance: p.savingsBal, raw_sms: p.raw },
        }).select("id").single();
        if (txn) {
          ingested.push({ receipt: p.receipt, kind: "transfer", amount: p.amount });
          try {
            const name = p.savingsCode === "kcb_mpesa" ? "KCB M-PESA" : "M-Shwari";
            const code = p.savingsCode;
            const mshwariM = p.raw.match(P.mshwariLoanOutstanding);
            if (mshwariM) {
              await upsertAutoDebt(supabase, userId, "mshwari_loan", "M-Shwari Loan", num(mshwariM[1]));
            }
            const kcbM = p.raw.match(P.kcbOverdraftOutstanding);
            if (kcbM) {
              await upsertAutoDebt(supabase, userId, "kcb_overdraft", "KCB M-PESA Overdraft", num(kcbM[1]));
            }
          } catch {}
        }
      } else {
        // Income / Expense
        const categoryName = guessMpesaCategory(p.raw, p.txnType as "income" | "expense");
        const category = await getOrCreateCategory(supabase, userId, categoryName, p.txnType as "income" | "expense");
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: mpesa.id, category_id: category.id,
            txn_type: p.txnType, amount: p.amount, currency_code: "KES", occurred_on: p.occurredOn,
            description: p.description,
            metadata: { source: "sms_webhook", mpesa_receipt: p.receipt, counterparty: p.counterparty, balance_after: p.mpesaBal, txn_cost: p.txnCost, needs_review: p.needsReview, raw_sms: p.raw },
          }).select("id").single();
          if (txn) {
            ingested.push({ receipt: p.receipt, kind: p.txnType, amount: p.amount });
            try {
              if (p.description === "Fuliza repayment") {
                const remaining = p.fulizaOutstanding ?? 0;
                await upsertAutoDebt(supabase, userId, "fuliza", "Safaricom Fuliza", remaining);
              }
              const mshwariM = p.raw.match(P.mshwariLoanOutstanding);
              if (mshwariM) {
                await upsertAutoDebt(supabase, userId, "mshwari_loan", "M-Shwari Loan", num(mshwariM[1]));
              }
              const kcbM = p.raw.match(P.kcbOverdraftOutstanding);
              if (kcbM) {
                await upsertAutoDebt(supabase, userId, "kcb_overdraft", "KCB M-PESA Overdraft", num(kcbM[1]));
              }
            } catch {}
          }
        }
      }
    }

    return NextResponse.json({ status: "backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?backfillsbm=1 → delete duplicates and re-ingest all pasted SBM SMS notifications!
  if (request.nextUrl.searchParams.get("backfillsbm") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });
    
    const sbmAccount = accts.find((a: any) => a.account_code === "bank_c");
    const mpesa = accts.find((a: any) => a.account_code === "main");
    if (!sbmAccount || !mpesa) return NextResponse.json({ error: "SBM Bank or M-Pesa account missing" }, { status: 500 });
    const userId = sbmAccount.user_id;

    // 1. Delete all transactions created by the SBM webhook
    await supabase.from("transactions").delete().eq("user_id", userId).contains("metadata", { source: "sbm_webhook" });

    const sbmList = [
      "Dear ROY, online purchase of KES 149.00 has been made on your card 529058******4101 at GOOGLE *Truecaller Spa on 2026-05-15 01:49:30.  For queries, call 0709800000.",
      "Dear ROY : KES 900 Incoming Pesalink , has been credited to account ending 7860001 on 5-11-2026 .For any queries call 0709800000",
      "Dear ROY : KES 3000 Incoming Pesalink , has been credited to account ending 7860001 on 5-8-2026 .For any queries call 0709800000",
      "Dear ROY, online purchase of KES 149.00 has been made on your card 529058******4101 at GOOGLE *Truecaller Spa on 2026-04-15 01:49:30.  For queries, call 0709800000.",
      "Dear ROY, online purchase of KES 289.00 has been made on your card 529058******4101 at GOOGLE *YouTubePremium on 2026-04-10 04:56:46.  For queries, call 0709800000.",
      "Dear ROY : KES 47500 Inward Clg EFT has been deposited to account ending with 7860001 on 4-10-2026 .For any queries call 0709800000",
      "Dear ROY, online purchase of KES 745.00 has been made on your card 529058******4101 at Google ChatGPT on 2026-03-31 21:54:10.  For queries, call 0709800000.",
      "Dear ROY : KES 1850 , has been credited to account ending 7860001 through MPESA Mobile Banking Terminal on 4-1-2026 .For any queries call 0709800000",
      "Dear ROY, online purchase of KES 750.00 has been made on your card 529058******4101 at GOOGLE *Canva AI Photo on 2026-03-31 15:23:14.  For queries, call 0709800000.",
      "Your M-Pesa payment of KES 1850.00 to 0322417860001 was successful on 31/03/26 10:22 PM. M-Pesa Ref: UCVLAB13O1. SBM Bank. For queries contact us on 0709800000",
      "Dear ROY : KES 47500 Inward Clg EFT has been deposited to account ending with 7860001 on 3-6-2026 .For any queries call 0709800000",
      "Dear ROY, Retail transaction of KES 745.00 has been made on your card 529058******4101 at GOOGLE *ChatGPT on 2026-01-29 22:16:08. . For queries call 0709800000",
      "Dear ROY : KES 400 , has been credited to account ending 7860001 through MPESA Mobile Banking Terminal on 2-28-2026 .For any queries call 0709800000",
      "Dear ROY, Retail transaction of KES 375.00 has been made on your card 529058******4101 at Google Canva AI Photo on 2026-02-28 09:41:12. . For queries call 0709800000",
      "Your M-Pesa payment of KES 400.00 to 0322417860001 was successful on 28/02/26 11:40 AM. M-Pesa Ref: UBSLA7T9HY. SBM Bank. For queries contact us on 0709800000",
      "Dear ROY, Retail transaction of KES 745.00 has been made on your card 529058******4101 at GOOGLE *ChatGPT on 2026-02-28 02:26:01. . For queries call 0709800000",
      "Dear ROY : KES 800 , has been credited to account ending 7860001 through MPESA Mobile Banking Terminal on 2-28-2026 .For any queries call 0709800000",
      "Your M-Pesa payment of KES 800.00 to 0322417860001 was successful on 28/02/26 10:17 AM. M-Pesa Ref: UBSLA7SZ0V. SBM Bank. For queries contact us on 0709800000"
    ];

    const ingested = [];
    for (const sms of sbmList) {
      const sbm = parseSbmSMS(sms);
      if (!sbm) continue;

      // Dedup by receipt
      if (sbm.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, txn_type")
          .eq("user_id", userId)
          .or(`metadata->>sbm_receipt.eq.${sbm.receipt},metadata->>mpesa_receipt.eq.${sbm.receipt}`);

        if (existing && existing.length > 0) {
          const incorrectExpense = existing.find((t: any) => t.txn_type === "expense" && sbm.kind === "transfer");
          if (incorrectExpense) {
            await supabase.from("transactions").delete().eq("id", incorrectExpense.id);
          } else {
            continue;
          }
        }
      }

      if (sbm.kind === "transfer") {
        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: mpesa.id, transfer_account_id: sbmAccount.id, category_id: null,
          txn_type: "transfer", amount: sbm.amount, currency_code: "KES", occurred_on: sbm.occurredOn,
          description: sbm.description,
          metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: sms },
        }).select("id").single();
        if (txn) ingested.push({ receipt: sbm.receipt, kind: "transfer", amount: sbm.amount });
      } else {
        const categoryName = guessCategory(sms, sbm.kind);
        const category = await getOrCreateCategory(supabase, userId, categoryName, sbm.kind);
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: sbmAccount.id, category_id: category.id,
            txn_type: sbm.kind, amount: sbm.amount, currency_code: "KES", occurred_on: sbm.occurredOn,
            description: sbm.description,
            metadata: { source: "sbm_webhook", sbm_receipt: sbm.receipt, counterparty: sbm.counterparty, raw_sms: sms },
          }).select("id").single();
          if (txn) ingested.push({ receipt: sbm.receipt, kind: sbm.kind, amount: sbm.amount });
        }
      }
    }

    return NextResponse.json({ status: "sbm_backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?backfilldtb=1 → delete duplicates and re-ingest all pasted DTB SMS notifications!
  if (request.nextUrl.searchParams.get("backfilldtb") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });

    const dtbAccount = accts.find((a: any) => a.account_code === "bank_a");
    const mpesa = accts.find((a: any) => a.account_code === "main");
    if (!dtbAccount || !mpesa) return NextResponse.json({ error: "DTB Bank or M-Pesa account missing" }, { status: 500 });
    const userId = dtbAccount.user_id;

    // 1. Delete all transactions created by the DTB webhook
    await supabase.from("transactions").delete().eq("user_id", userId).contains("metadata", { source: "dtb_webhook" });

    const dtbList = [
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 484.66 for a POS PURCHASE at Name.com, Inc 7202492374 CO  on 02/06/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 500.00 from your MPESA to account: 58XXXX5001. Mpesa Ref No: UEVLA5Z7JP. DTB",
      "Dear Roy otieno , you have successfully transferred KES 1,450.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UDHLA10FYX. Ref No: 455402879. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 1450 for a MOBILE BANKING TXN on 17/04/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 1,000.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UDHLA0Z0G9. Ref No: 455289170. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 1000 for a MOBILE BANKING TXN on 17/04/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 454.53 for a POS PURCHASE at APPLE.COM/BILL CORK IRL on 13/04/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 2,000.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UDDLA0JJ1U. Ref No: 454160140. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 2000 for a MOBILE BANKING TXN on 13/04/2026.  DTB",
      "Dear Roy otieno , you have successfully transferred KES 100.00 to  ROY OKOLA OTIENO 254726683835. M-PESA Ref: UD6LABNAGI. Ref No: 452046969. DTB.",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 100 for a MOBILE BANKING TXN on 07/04/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 51 for a POS PURCHASE at UBER * PENDING Vorden NLD on 27/02/2026.  DTB",
      "Dear ROY  OKOLA OTIENO , you have received KES 100 in your account 580XXXX001 from 254726683835-ROY OKOLA OTIENO. Ref UBRLA7QIOV. DTB",
      "Dear ROY OKOLA OTIENO, you have successfully transferred KES 100 from your M-PESA to account 5804605001. Ref UBRLA7QIOV. DTB",
      "Dear ROY  OKOLA OTIENO , you have received KES 105 in your account 580XXXX001 from 254726683835-ROY OKOLA OTIENO. Ref UAJLA440Q0. DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 102 for a POS PURCHASE at GOOGLE *1 1 1 1 WARP S MOUNTAIN VIEW CA  on 19/01/2026.  DTB",
      "Dear ROY OKOLA OTIENO, you have successfully transferred KES 105 from your M-PESA to account 5804605001. Ref UAJLA440Q0. DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 10.99 for a POS PURCHASE at GOOGLE *TikTok Videos MOUNTAIN VIEW CA  on 09/01/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 45 for a POS PURCHASE at GOOGLE *TikTok Videos MOUNTAIN VIEW CA  on 09/01/2026.  DTB",
      "ALERT: Your account no. 5XXXXX5001 has been debited with KES 67.61 for a POS PURCHASE at GOOGLE *YouTube Member MOUNTAIN VIEW CA  on 05/01/2026.  DTB"
    ];

    const ingested = [];
    for (const sms of dtbList) {
      const dtb = parseDtbSMS(sms);
      if (!dtb) continue;

      // Deduplicate for mobile banking alert messages based on date and amount
      if (dtb.isMobileBankingAlert) {
        const { data: dup } = await supabase.from("transactions").select("id")
          .eq("user_id", userId)
          .eq("amount", dtb.amount)
          .eq("occurred_on", dtb.occurredOn)
          .or(`account_id.eq.${dtbAccount.id},transfer_account_id.eq.${dtbAccount.id}`);
        if (dup && dup.length > 0) {
          continue;
        }
      }

      // Dedup by receipt
      if (dtb.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, txn_type")
          .eq("user_id", userId)
          .or(`metadata->>dtb_receipt.eq.${dtb.receipt},metadata->>mpesa_receipt.eq.${dtb.receipt}`);

        if (existing && existing.length > 0) {
          continue;
        }
      }

      if (dtb.kind === "transfer") {
        const isOutflow = dtb.description === "Transfer to M-Pesa";
        const fromId = isOutflow ? dtbAccount.id : mpesa.id;
        const toId   = isOutflow ? mpesa.id : dtbAccount.id;

        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
          txn_type: "transfer", amount: dtb.amount, currency_code: "KES", occurred_on: dtb.occurredOn,
          description: dtb.description,
          metadata: { source: "dtb_webhook", dtb_receipt: dtb.receipt, counterparty: dtb.counterparty, raw_sms: sms },
        }).select("id").single();
        if (txn) ingested.push({ receipt: dtb.receipt, kind: "transfer", amount: dtb.amount });
      } else {
        const categoryName = guessCategory(sms, dtb.kind);
        const category = await getOrCreateCategory(supabase, userId, categoryName, dtb.kind);
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: dtbAccount.id, category_id: category.id,
            txn_type: dtb.kind, amount: dtb.amount, currency_code: "KES", occurred_on: dtb.occurredOn,
            description: dtb.description,
            metadata: { source: "dtb_webhook", dtb_receipt: dtb.receipt, counterparty: dtb.counterparty, raw_sms: sms },
          }).select("id").single();
          if (txn) ingested.push({ receipt: dtb.receipt, kind: dtb.kind, amount: dtb.amount });
        }
      }
    }

    return NextResponse.json({ status: "dtb_backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?backfillim=1 → delete duplicates and re-ingest all pasted I&M Bank SMS notifications!
  if (request.nextUrl.searchParams.get("backfillim") === "1") {
    const { data: accts } = await supabase.from("accounts").select("id, user_id, account_code");
    if (!accts || accts.length === 0) return NextResponse.json({ error: "No accounts found" }, { status: 500 });

    const imAccount = accts.find((a: any) => a.account_code === "bank_b");
    const mpesa = accts.find((a: any) => a.account_code === "main");
    if (!imAccount || !mpesa) return NextResponse.json({ error: "I&M Bank or M-Pesa account missing" }, { status: 500 });
    const userId = imAccount.user_id;

    // 1. Delete all transactions created by the I&M webhook
    await supabase.from("transactions").delete().eq("user_id", userId).contains("metadata", { source: "im_webhook" });

    const imList = [
      "Dear Customer,you have successfully sent KES 700.0 to 254726683835 with M Pesa Reference Number UAGLA3TKPT I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 800.0 to 254726683835 with M Pesa Reference Number UAKLA47X0Q I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 150.0 to 254726683835 with M Pesa Reference Number UAKLA48KKZ I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 300.0 to 254726683835 with M Pesa Reference Number UAPLA4NCZV I&amp;M Bank",
      "You have received KES 500.00 from CIZRENN VYLLIN. Transaction Ref ID: 3449RNSD5689. Mpesa Ref ID: UB4LA5K6SA. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Dear Customer,you have successfully sent KES 50.0 to 254726683835 with M Pesa Reference Number UB6LA5RU78 I&amp;M Bank",
      "Dear Customer,You have received KES 35000 via PesaLink into Acc 05508402466150 Tran Ref 006000572026020917143214463567. For enquiry,call 020 3221000. IM Bank.",
      "Dear Customer,you have successfully sent KES 25000.0 to 254721656815 with M Pesa Reference Number UB9JL656WR I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 5000.0 to 254726683835 with M Pesa Reference Number UB9LA63CMS I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 3800.0 to 254746511297 with M Pesa Reference Number UB9AG69Q4D I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 1200.0 to 254726683835 with M Pesa Reference Number UBALA64O6B I&amp;M Bank",
      "Dear Customer,You have received KES 71600 via PesaLink into Acc 05508402466150 Tran Ref 006000572026021015273861210733. For enquiry,call 020 3221000. IM Bank.",
      "Bank to M-PESA transfer of KES 20,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3503OSKR6953. M-PESA Ref ID: UBALA661SH",
      "You have received KES 20,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3503OSKR6953. Mpesa Ref ID: UBALA661SH. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 1,000.00 to 254720214254 - BRIAN MUSINA BURUDI successfully processed. Transaction Ref ID: 3505KUAD0280. M-PESA Ref ID: UBACY6D82Z",
      "Bank to M-PESA transfer of KES 1,000.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 3512YLKR9016. M-PESA Ref ID: UBBIN69TB3",
      "Bank to M-PESA transfer of KES 1,600.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3519CMTT1133. M-PESA Ref ID: UBCLA6C3NF",
      "You have received KES 1,600.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3519CMTT1133. Mpesa Ref ID: UBCLA6C3NF. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3547DZAO4271. M-PESA Ref ID: UBFLA6NGJA",
      "You have received KES 2,500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3547DZAO4271. Mpesa Ref ID: UBFLA6NGJA. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 3,000.00 to 0746511297 - SONIA AKOTH OTIENO successfully processed. Transaction Ref ID: 3554ENKU3417. M-PESA Ref ID: UBGAG6WUEB",
      "Bank to M-PESA transfer of KES 2,000.00 to 254705036864 - CIZRENN VYLLIN successfully processed. Transaction Ref ID: 3554DCTB3460. M-PESA Ref ID: UBG256QQGK",
      "Bank to M-PESA transfer of KES 500.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 3554INQE3509. M-PESA Ref ID: UBGQS6WRD0",
      "Dear Customer,you have successfully sent KES 2000.0 to 254726683835 with M Pesa Reference Number UBHLA6SHQ9 I&amp;M Bank",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3565LBJP8282. M-PESA Ref ID: UBHP66XQFM",
      "Bank to M-PESA transfer of KES 2,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3578KWLH9592. M-PESA Ref ID: UBJLA6YUR1",
      "You have received KES 2,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3578KWLH9592. Mpesa Ref ID: UBJLA6YUR1. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 0758198422 - pauline sau chamangi successfully processed. Transaction Ref ID: 3578GGEW9638. M-PESA Ref ID: UBJK672AC3",
      "M-PESA transfer of KES 3,320.00 to  successfully processed. Transaction Ref ID: 667620796801. M-PESA Ref ID: UBJS883K90",
      "You have received KES 600.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3591EWRT6052. Mpesa Ref ID: UBKLA74NEP. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 600.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3591EWRT6052. M-PESA Ref ID: UBKLA74NEP",
      "Dear Customer,you have successfully sent KES 3000.0 to 254726683835 with M Pesa Reference Number UBLLA76Y4U I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 500.0 to 254708767392 with M Pesa Reference Number UBMP67CGLK I&amp;M Bank",
      "Dear Customer,you have successfully sent KES 2000.0 to 254726683835 with M Pesa Reference Number UBMLA79C5U I&amp;M Bank",
      "Bank to M-PESA transfer of KES 4,500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3612MBBT8200. M-PESA Ref ID: UBNLA7BO20",
      "You have received KES 4,500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3612MBBT8200. Mpesa Ref ID: UBNLA7BO20. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 400.00 to 254716497978 - ALEX LUVAI LUVAI successfully processed. Transaction Ref ID: 3685QCCN6583. M-PESA Ref ID: UC3077ZMH6",
      "Bank to M-PESA transfer of KES 1,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3685WURQ6612. M-PESA Ref ID: UC3LA84E39",
      "You have received KES 1,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3685WURQ6612. Mpesa Ref ID: UC3LA84E39. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3694EJXR7588. M-PESA Ref ID: UC4P68BPQE",
      "Bank to M-PESA transfer of KES 1,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3694AYSX7552. M-PESA Ref ID: UC4LA888AS",
      "You have received KES 1,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3694AYSX7552. Mpesa Ref ID: UC4LA888AS. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 3,500.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 3710LZKI7688. M-PESA Ref ID: UC6IN8DZXH",
      "Bank to M-PESA transfer of KES 500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3720VMHM0518. M-PESA Ref ID: UC7LA8HXJ7",
      "You have received KES 500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3720VMHM0518. Mpesa Ref ID: UC7LA8HXJ7. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3742KHPO7556. M-PESA Ref ID: UCALA8QLUM",
      "You have received KES 2,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3742KHPO7556. Mpesa Ref ID: UCALA8QLUM. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3755PBKY5314. M-PESA Ref ID: UCBP68ZUZ9",
      "Bank to M-PESA transfer of KES 800.00 to 0112217747 - Donald ombok odera successfully processed. Transaction Ref ID: 3812XVRW5194. M-PESA Ref ID: UCIQW9UPKN",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3815AFOS5807. M-PESA Ref ID: UCIP69OTBK",
      "Bank to M-PESA transfer of KES 1,200.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3824SPNP8251. M-PESA Ref ID: UCJLA9PCPR",
      "You have received KES 1,200.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3824SPNP8251. Mpesa Ref ID: UCJLA9PCPR. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 5,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3840QRFB4007. M-PESA Ref ID: UCLLA9VXCK",
      "You have received KES 5,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3840QRFB4007. Mpesa Ref ID: UCLLA9VXCK. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,100.00 to 0743257910 - EMMANUEL NSENGIYUMVA successfully processed. Transaction Ref ID: 3842IOSU6163. M-PESA Ref ID: UCL5ZABD0I",
      "Bank to M-PESA transfer of KES 3,700.00 to 254705131326 - OTIENO ODEK MYLES successfully processed. Transaction Ref ID: 3858JGKS8718. M-PESA Ref ID: UCNBXAFTZR",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3863SWOS5135. M-PESA Ref ID: UCOP6A9EMD",
      "Bank to M-PESA transfer of KES 600.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 3894RWOR3473. M-PESA Ref ID: UCRQSASYWG",
      "You have received KES 2,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 3902PNUI6111. Mpesa Ref ID: UCSLAAOA75. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 2,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 3902PNUI6111. M-PESA Ref ID: UCSLAAOA75",
      "Bank to M-PESA transfer of KES 500.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 3908QFXD8083. M-PESA Ref ID: UCTQSAZ0TU",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 3928SOIZ2190. M-PESA Ref ID: UCVP6B3OE1",
      "You have received KES 400.00 from CIZRENN VYLLIN. Transaction Ref ID: 3969UVZI0811. Mpesa Ref ID: UD5LABJICH. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 4014CUSX2328. M-PESA Ref ID: UDAP60CERC",
      "Pesalink transfer of KES 5,000.00 to 254726683835 on 10/04/2026 17:48 processed successfully. Transaction Ref ID:060690198038",
      "Bank to M-PESA transfer of KES 18,000.00 to 254721656815 - JUDITH MAUREEN AKINYI OKWEMBA successfully processed. Transaction Ref ID: 4014HOSU2487. M-PESA Ref ID: UDAJL0AWZT",
      "Bank to M-PESA transfer of KES 2,561.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4014NJHU3362. M-PESA Ref ID: UDALA08HSP",
      "You have received KES 2,561.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4014NJHU3362. Mpesa Ref ID: UDALA08HSP. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 1,000.00 to 254705131326 - OTIENO ODEK MYLES successfully processed. Transaction Ref ID: 4014BJMU2419. M-PESA Ref ID: UDABX0KU5V",
      "Bank to M-PESA transfer of KES 6,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4014AMTR2949. M-PESA Ref ID: UDALA08F0N",
      "You have received KES 6,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4014AMTR2949. Mpesa Ref ID: UDALA08F0N. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 4,000.00 to 0746511297 - SONIA AKOTH OTIENO successfully processed. Transaction Ref ID: 4014AGXK2617. M-PESA Ref ID: UDAAG0I0EI",
      "Bank to M-PESA transfer of KES 500.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 4022DEAH8038. M-PESA Ref ID: UDBIN0AKDS",
      "Bank to M-PESA transfer of KES 1,500.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4032JKST3552. M-PESA Ref ID: UDCLA0HGLD",
      "You have received KES 1,500.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4032JKST3552. Mpesa Ref ID: UDCLA0HGLD. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 500.00 to 254708767392 - Gathogo Kirubi Kigotho successfully processed. Transaction Ref ID: 4032RIVM3574. M-PESA Ref ID: UDCP60LC98",
      "Bank to M-PESA transfer of KES 200.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 4032SXQR3619. M-PESA Ref ID: UDCQS0QJCR",
      "Bank to M-PESA transfer of KES 600.00 to 254748459641 - Nicholas Nganga Mugi successfully processed. Transaction Ref ID: 4056ROKE5786. M-PESA Ref ID: UDFQS11DV5",
      "You have received KES 3,000.00 from ROY OKOLA OTIENO. Transaction Ref ID: 4092ADKO1333. Mpesa Ref ID: UDJLA18WEJ. Bank to Mpesa Ni Sare Kabisa with I&M Bank.",
      "Bank to M-PESA transfer of KES 3,000.00 to 0726683835 - ROY OKOLA OTIENO successfully processed. Transaction Ref ID: 4092ADKO1333. M-PESA Ref ID: UDJLA18WEJ",
      "Bank to M-PESA transfer of KES 1,000.00 to 0796322807 - DOREEN NDINDAH MUEMA successfully processed. Transaction Ref ID: 4096HYZR7980. M-PESA Ref ID: UDKIN189G6",
      "KES 15.00 paid to VISTACOM CYBER & PRINTS (Acc 071616) on 20/04/26 at 12:18 PM Ref: UDKLA1BJF7. Enquiries, call 0719088000.",
      "KES 30.00 paid to VISTACOM CYBER & PRINTS (Acc 071616) on 20/04/26 at 12:24 PM Ref: UDKLA1BFUW. Enquiries, call 07190"
    ];

    const ingested = [];
    for (const sms of imList) {
      const im = parseImSMS(sms);
      if (!im) continue;

      // Dedup by receipt
      if (im.receipt !== "UNKNOWN") {
        const { data: existing } = await supabase.from("transactions").select("id, txn_type")
          .eq("user_id", userId)
          .or(`metadata->>im_receipt.eq.${im.receipt},metadata->>mpesa_receipt.eq.${im.receipt}`);

        if (existing && existing.length > 0) {
          continue;
        }
      }

      if (im.kind === "transfer") {
        const isOutflow = im.description.toLowerCase().includes("transfer to");
        const fromId = isOutflow ? imAccount.id : mpesa.id;
        const toId   = isOutflow ? mpesa.id : imAccount.id;

        const { data: txn } = await supabase.from("transactions").insert({
          user_id: userId, account_id: fromId, transfer_account_id: toId, category_id: null,
          txn_type: "transfer", amount: im.amount, currency_code: "KES", occurred_on: im.occurredOn,
          description: im.description,
          metadata: { source: "im_webhook", im_receipt: im.receipt, counterparty: im.counterparty, raw_sms: sms },
        }).select("id").single();
        if (txn) ingested.push({ receipt: im.receipt, kind: "transfer", amount: im.amount });
      } else {
        const categoryName = guessCategory(sms, im.kind);
        const category = await getOrCreateCategory(supabase, userId, categoryName, im.kind);
        if (category) {
          const { data: txn } = await supabase.from("transactions").insert({
            user_id: userId, account_id: imAccount.id, category_id: category.id,
            txn_type: im.kind, amount: im.amount, currency_code: "KES", occurred_on: im.occurredOn,
            description: im.description,
            metadata: { source: "im_webhook", im_receipt: im.receipt, counterparty: im.counterparty, raw_sms: sms },
          }).select("id").single();
          if (txn) ingested.push({ receipt: im.receipt, kind: im.kind, amount: im.amount });
        }
      }
    }

    return NextResponse.json({ status: "im_backfill_complete", parsed_and_inserted: ingested.length, details: ingested });
  }

  // ?recent=1 → list the latest transactions with full metadata
  if (request.nextUrl.searchParams.get("recent") === "1") {
    const { data: recent } = await supabase
      .from("transactions")
      .select("created_at, txn_type, amount, description, occurred_on, metadata")
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({ count, recent });
  }

  // ?testfilter=1 → compare different JSONB metadata filter methods
  if (request.nextUrl.searchParams.get("testfilter") === "1") {
    const q1 = await supabase.from("transactions").select("id", { count: "exact", head: true })
      .not("metadata->>is_transfer_counter", "eq", "true");
    const q2 = await supabase.from("transactions").select("id", { count: "exact", head: true })
      .or("metadata->>is_transfer_counter.is.null,metadata->>is_transfer_counter.neq.true");
    const q3 = await supabase.from("transactions").select("id", { count: "exact", head: true });

    return NextResponse.json({
      not_filter_count: q1.count,
      or_filter_count: q2.count,
      no_filter_count: q3.count,
      errors: { q1: q1.error, q2: q2.error, q3: q3.error }
    });
  }
  // Confirm which Supabase project the running app is bound to
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^["']|["']$/g, "").trim();
  const projectRef = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ?? "unknown";

  // ?cleardebug=1 → delete all webhook_debug placeholder rows
  if (request.nextUrl.searchParams.get("cleardebug") === "1") {
    const { count: deleted } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .contains("metadata", { source: "webhook_debug" });
    return NextResponse.json({ status: "cleared", deleted });
  }

  // ?debug=1 → return recent raw captures from failed parses
  if (request.nextUrl.searchParams.get("debug") === "1") {
    const { data: debug } = await supabase
      .from("transactions")
      .select("created_at, description, metadata")
      .contains("metadata", { source: "webhook_debug" })
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({ project_ref: projectRef, debug });
  }

  return NextResponse.json({ status: "ok", project_ref: projectRef, accounts, transaction_count: count });
}
