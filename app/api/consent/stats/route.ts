import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = [
  (process.env.ALLOWED_EMAIL || "royokola3@gmail.com").toLowerCase(),
  "info@rauell.systems"
];

// Generates rich mock stats for visualization
function getMockStats() {
  const regions = ["KE", "US", "DE", "FR", "GB", "CA", "IN", "ZA"];
  const platforms = ["Chrome / Windows", "Safari / iOS", "Firefox / macOS", "Edge / Windows", "Chrome / Android"];
  
  const total = 428;
  const all = 286;
  const custom = 78;
  const none = 64;

  const logs = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const occurredAt = new Date(now.getTime() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000));
    const randomTypeVal = Math.random();
    let type: "all" | "none" | "custom" = "all";
    let cats = { necessary: true, analytics: true, marketing: true, preferences: true };
    
    if (randomTypeVal < 0.15) {
      type = "none";
      cats = { necessary: true, analytics: false, marketing: false, preferences: false };
    } else if (randomTypeVal < 0.35) {
      type = "custom";
      cats = {
        necessary: true,
        analytics: Math.random() > 0.4,
        marketing: Math.random() > 0.7,
        preferences: Math.random() > 0.3
      };
    }

    logs.push({
      id: `mock-log-${i}`,
      consent_id: `uid-${Math.floor(100000 + Math.random() * 900000)}`,
      region: regions[Math.floor(Math.random() * regions.length)],
      consent_type: type,
      categories_granted: cats,
      user_agent: platforms[Math.floor(Math.random() * platforms.length)],
      ip_address_masked: `197.248.${Math.floor(Math.random() * 255)}.xxx`,
      created_at: occurredAt.toISOString()
    });
  }

  // Sort logs by newest first
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    totalConsents: total,
    acceptAllCount: all,
    rejectAllCount: none,
    customCount: custom,
    optInRate: Math.round(((all + custom) / total) * 100),
    regionBreakdown: { KE: 215, US: 98, DE: 42, FR: 28, GB: 25, CA: 12, IN: 6, ZA: 2 },
    categoryBreakdown: {
      necessary: 100,
      analytics: 78,
      preferences: 65,
      marketing: 38
    },
    recentLogs: logs
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    // If not admin, return mock data for developer visualization/sandbox
    if (!isAdmin) {
      return NextResponse.json({ ...getMockStats(), isMock: true });
    }

    // Admin: try to fetch from Database
    const { data: logs, error: logsError } = await supabase
      .from("cookie_consent_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (logsError) {
      console.warn("Database error querying logs, falling back to mock stats:", logsError);
      return NextResponse.json({ ...getMockStats(), db_error: logsError.message });
    }

    // Process DB logs to build analytics
    const total = logs.length;
    if (total === 0) {
      return NextResponse.json({ ...getMockStats(), isEmpty: true });
    }

    let all = 0;
    let none = 0;
    let custom = 0;
    const regions: Record<string, number> = {};
    const categories = { necessary: 0, analytics: 0, preferences: 0, marketing: 0 };

    logs.forEach((log) => {
      // Consent Type
      if (log.consent_type === "all") all++;
      else if (log.consent_type === "none") none++;
      else if (log.consent_type === "custom") custom++;

      // Region
      const reg = log.region || "unknown";
      regions[reg] = (regions[reg] || 0) + 1;

      // Categories
      const cats = log.categories_granted as Record<string, boolean> || {};
      if (cats.necessary !== false) categories.necessary++;
      if (cats.analytics) categories.analytics++;
      if (cats.preferences || cats.preference) categories.preferences++;
      if (cats.marketing) categories.marketing++;
    });

    const percent = (val: number) => Math.round((val / total) * 100);

    return NextResponse.json({
      totalConsents: total,
      acceptAllCount: all,
      rejectAllCount: none,
      customCount: custom,
      optInRate: percent(all + custom),
      regionBreakdown: regions,
      categoryBreakdown: {
        necessary: percent(categories.necessary),
        analytics: percent(categories.analytics),
        preferences: percent(categories.preferences),
        marketing: percent(categories.marketing)
      },
      recentLogs: logs.map(l => ({
        id: l.id,
        consent_id: l.consent_id,
        region: l.region,
        consent_type: l.consent_type,
        categories_granted: l.categories_granted,
        user_agent: l.user_agent ? l.user_agent.split("/")[0] : "unknown", // Simple client name parse
        ip_address_masked: l.ip_address_masked,
        created_at: l.created_at
      })),
      isMock: false
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Server error";
    console.error("Stats API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
