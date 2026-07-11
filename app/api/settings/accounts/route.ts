import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, account_code, currency_code = "KES", opening_balance = 0 } = body;

    if (!name || !account_code) {
      return NextResponse.json({ error: "Name and Account Code are required" }, { status: 400 });
    }

    // Sanitize account_code: lowercase, alphanumeric and underscores only
    const sanitizedCode = account_code.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!sanitizedCode) {
      return NextResponse.json({ error: "Invalid Account Code" }, { status: 400 });
    }

    // Create the account
    const { data: newAcc, error } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        account_code: sanitizedCode,
        name,
        currency_code,
        opening_balance,
        current_balance: opening_balance
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(newAcc);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const { fuliza_limit } = body;

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    if (fuliza_limit === undefined) {
      return NextResponse.json({ error: "fuliza_limit is required" }, { status: 400 });
    }

    const { data: acc, error: findErr } = await supabase
      .from("accounts")
      .select("account_code")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (findErr || !acc) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    const val = Number(fuliza_limit);
    if (isNaN(val) || val < 0) {
      return NextResponse.json({ error: "Invalid fuliza_limit" }, { status: 400 });
    }

    const { error } = await supabase
      .from("accounts")
      .update({ fuliza_limit: val })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, fuliza_limit: val });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Retrieve account details to verify permissions and safety rules
    const { data: acc, error: findErr } = await supabase
      .from("accounts")
      .select("account_code")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (findErr || !acc) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    // Enforce safety: do not allow deleting the main MPESA wallet to prevent system breakdown
    if (acc.account_code === "main") {
      return NextResponse.json({ error: "The protected system main wallet cannot be deleted." }, { status: 400 });
    }

    // Delete the account
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
