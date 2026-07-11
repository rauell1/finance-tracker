import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = [
  (process.env.ALLOWED_EMAIL || "royokola3@gmail.com").toLowerCase(),
  "info@rauell.systems"
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all logs
    const { error } = await supabase
      .from("error_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
