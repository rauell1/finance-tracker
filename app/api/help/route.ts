import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validCategories = ["bug", "feature", "question", "improvement"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert request
    const { data, error } = await supabase
      .from("help_requests")
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting help request:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("Help request POST error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isAdmin = profile.role === "admin";

    let query = supabase.from("help_requests").select("*, profiles(full_name, role)");

    // If not admin, restrict to own requests
    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    // Sort by newest first
    const { data: requests, error: queryError } = await query.order("created_at", { ascending: false });

    if (queryError) {
      console.error("Error querying help requests:", queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({
      requests: requests || [],
      isAdmin,
      userProfile: {
        id: user.id,
        fullName: profile.full_name,
        role: profile.role,
      }
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("Help request GET error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
