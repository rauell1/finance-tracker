import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Resolve or create a category dynamically.
 */
export async function getOrCreateCategory(
  supabase: AdminClient,
  userId: string,
  categoryName: string,
  type: "income" | "expense"
): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", categoryName)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const colorMap: Record<string, string> = {
    "Funds received": "#10B981",
    "Other Income": "#84CC16",
    "Other Expense": "#64748B",
    "Utilities": "#EC4899",
    "Food & Dining": "#F97316",
    "Transport": "#3B82F6",
    "Housing": "#8B5CF6",
    "Healthcare": "#EF4444",
    "Subscriptions": "#D946EF",
  };
  const color = colorMap[categoryName] ?? (type === "income" ? "#10B981" : "#64748B");

  const { data: created } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryName,
      type: type,
      color: color,
      is_system: false,
    })
    .select("id")
    .maybeSingle();

  if (created) {
    return created;
  }

  const { data: fb } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .limit(1)
    .maybeSingle();

  if (fb) {
    return fb;
  }

  throw new Error(`Category ${categoryName} could not be resolved or created for user ${userId}`);
}

/**
 * Perform a concurrent-safe, idempotent upsert of auto-tracked debts (Fuliza, M-Shwari, KCB).
 */
export async function upsertAutoDebt(
  supabase: AdminClient,
  userId: string,
  source: "fuliza" | "mshwari_loan" | "kcb_overdraft",
  creditor: string,
  balance: number,
) {
  try {
    const isActive = balance > 0;
    
    // Perform a single idempotent upsert operation based on the unique constraint on (user_id, source_identifier)
    const { error } = await supabase
      .from("debts")
      .upsert({
        user_id: userId,
        creditor,
        debt_type: source,
        principal: balance, // overwrites or keeps balance as principal
        current_balance: balance,
        currency_code: "KES",
        auto_tracked: true,
        is_active: isActive,
        source_identifier: source,
      }, { onConflict: "user_id,source_identifier" });

    if (error) throw error;
  } catch (err) {
    console.warn("[upsertAutoDebt] failed:", err);
  }
}

/**
 * Reconcile two legs of a transfer transaction between accounts.
 */
export async function reconcileLinkedTransaction(
  supabase: AdminClient,
  ref: string,
  incomingSource: string,
  amount: number,
  userId: string,
  occurredOn: string,
  rawSms: string,
  fromAccountId: string,
  toAccountId: string,
  fromAccountCode: string,
  toAccountCode: string,
  description: string,
  balanceAfter: number | null,
  txnCost: number | null
): Promise<{ status: string; reason?: string; transaction_id: string; counter_transaction_id?: string }> {
  // Query all transactions with this ref
  const { data: txns, error } = await supabase
    .from("transactions")
    .select("id, account_id, transfer_account_id, txn_type, metadata, occurred_on")
    .eq("user_id", userId)
    .or(`metadata->>mpesa_receipt.eq.${ref},metadata->>reference.eq.${ref},metadata->>sbm_receipt.eq.${ref},metadata->>dtb_receipt.eq.${ref},metadata->>im_receipt.eq.${ref}`);

  if (error) {
    console.error("[reconcile] Error fetching transactions:", error);
    throw error;
  }

  // Check if we have any existing transaction
  const existing = (txns ?? [])[0];
  const isSavings = fromAccountCode === "kcb_mpesa" || fromAccountCode === "mshwari" ||
                    toAccountCode === "kcb_mpesa" || toAccountCode === "mshwari";

  if (!existing) {
    if (isSavings) {
      // Create both legs immediately
      const { data: sourceTxn, error: insertErr1 } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: fromAccountId,
          transfer_account_id: toAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            raw_sms: rawSms,
            balance_after: balanceAfter,
            txn_cost: txnCost,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr1) throw insertErr1;

      const { data: counterTxn, error: insertErr2 } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: toAccountId,
          transfer_account_id: fromAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            is_transfer_counter: true,
            raw_sms: rawSms,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr2) throw insertErr2;

      return { status: "created", transaction_id: sourceTxn.id, counter_transaction_id: counterTxn.id };
    }

    // Otherwise, insert only source leg as pending_reconciliation
    const { data: newTxn, error: insertErr } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        account_id: fromAccountId,
        transfer_account_id: null,
        txn_type: "transfer",
        amount: amount,
        currency_code: "KES",
        occurred_on: occurredOn,
        description: description,
        metadata: {
          source: incomingSource,
          mpesa_receipt: ref,
          reference: ref,
          status: "pending_reconciliation",
          raw_sms: rawSms,
          balance_after: balanceAfter,
          txn_cost: txnCost,
          from_account_code: fromAccountCode,
          to_account_code: toAccountCode
        }
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    return { status: "created", transaction_id: newTxn.id };
  }

  // If the existing transaction is already a transfer:
  if (existing.txn_type === "transfer") {
    // Check if both source and counter leg exist
    const sourceLeg = (txns ?? []).find(
      (t: any) => t.account_id === fromAccountId &&
           t.transfer_account_id === toAccountId &&
           t.metadata &&
           (t.metadata as any).is_transfer_counter !== true
    );
    const counterLeg = (txns ?? []).find(
      (t: any) => t.account_id === toAccountId &&
           t.transfer_account_id === fromAccountId &&
           t.metadata &&
           (t.metadata as any).is_transfer_counter === true
    );

    if (sourceLeg && counterLeg) {
      return { status: "ignored", reason: "duplicate", transaction_id: sourceLeg.id };
    }

    if (sourceLeg && !counterLeg) {
      // Source leg exists, counter leg does not.
      // Check if it's from the same source
      const meta = sourceLeg.metadata as Record<string, any>;
      if (meta && meta.source === incomingSource) {
        return { status: "ignored", reason: "duplicate", transaction_id: sourceLeg.id };
      }

      // Reconcile: Update source leg and insert counter leg
      const updatedMeta: Record<string, any> = {
        ...meta,
        status: "fully_reconciled",
        fully_reconciled: true,
        from_account_code: fromAccountCode,
        to_account_code: toAccountCode
      };
      if (balanceAfter !== null) updatedMeta.balance_after = balanceAfter;
      if (txnCost !== null) updatedMeta.txn_cost = txnCost;
      if (rawSms) updatedMeta.raw_sms_mpesa = rawSms;

      await supabase
        .from("transactions")
        .update({ 
          transfer_account_id: toAccountId,
          metadata: updatedMeta 
        })
        .eq("id", sourceLeg.id);

      const { data: newTxn, error: insertErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: toAccountId,
          transfer_account_id: fromAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            is_transfer_counter: true,
            raw_sms: rawSms,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      return { status: "reconciled", transaction_id: sourceLeg.id, counter_transaction_id: newTxn.id };
    }

    if (!sourceLeg && counterLeg) {
      const meta = counterLeg.metadata as Record<string, any>;
      const updatedMeta = {
        ...meta,
        status: "fully_reconciled",
        fully_reconciled: true,
        from_account_code: fromAccountCode,
        to_account_code: toAccountCode
      };
      await supabase
        .from("transactions")
        .update({ metadata: updatedMeta })
        .eq("id", counterLeg.id);

      const { data: newTxn, error: insertErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: fromAccountId,
          transfer_account_id: toAccountId,
          txn_type: "transfer",
          amount: amount,
          currency_code: "KES",
          occurred_on: occurredOn,
          description: description,
          metadata: {
            source: incomingSource,
            mpesa_receipt: ref,
            reference: ref,
            status: "fully_reconciled",
            fully_reconciled: true,
            raw_sms: rawSms,
            balance_after: balanceAfter,
            txn_cost: txnCost,
            from_account_code: fromAccountCode,
            to_account_code: toAccountCode
          }
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      return { status: "reconciled", transaction_id: newTxn.id, counter_transaction_id: counterLeg.id };
    }
  }

  // If the existing transaction is NOT a transfer (e.g. it was logged as income/expense),
  // convert it to the transfer source leg, and insert the counter leg!
  const meta = existing.metadata as Record<string, any>;
  const updatedMeta: Record<string, any> = {
    ...meta,
    source: incomingSource,
    status: "fully_reconciled",
    fully_reconciled: true,
    from_account_code: fromAccountCode,
    to_account_code: toAccountCode
  };
  if (balanceAfter !== null) updatedMeta.balance_after = balanceAfter;
  if (txnCost !== null) updatedMeta.txn_cost = txnCost;
  if (rawSms) updatedMeta.raw_sms_mpesa = rawSms;

  await supabase
    .from("transactions")
    .update({
      txn_type: "transfer",
      account_id: fromAccountId,
      transfer_account_id: toAccountId,
      category_id: null,
      description: description,
      metadata: updatedMeta
    })
    .eq("id", existing.id);

  const { data: newTxn, error: insertErr } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      account_id: toAccountId,
      transfer_account_id: fromAccountId,
      txn_type: "transfer",
      amount: amount,
      currency_code: "KES",
      occurred_on: occurredOn,
      description: description,
      metadata: {
        source: incomingSource,
        mpesa_receipt: ref,
        reference: ref,
        status: "fully_reconciled",
        fully_reconciled: true,
        is_transfer_counter: true,
        raw_sms: rawSms,
        from_account_code: fromAccountCode,
        to_account_code: toAccountCode
      }
    })
    .select("id")
    .single();

  if (insertErr) throw insertErr;

  return { status: "reconciled", transaction_id: existing.id, counter_transaction_id: newTxn.id };
}
