import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Webhook } from "lucide-react";
import { WebhookLogsList, type WebhookLog } from "@/components/webhook-logs/webhook-logs-list";

export const dynamic = "force-dynamic";

export default async function WebhookLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: logs } = await admin
    .from("webhook_logs")
    .select("id, raw_body, content_type, sms_text, reason, created_at, replayed_at, replay_result")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Webhook className="h-6 w-6 text-[#524CF2]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0D27] tracking-tight">Webhook Logs</h1>
        </div>
        <p className="text-sm text-[#33375C]/60 mt-1">
          SMS deliveries that didn&apos;t produce a transaction - review, replay, or dismiss them.
        </p>
      </div>

      <WebhookLogsList logs={(logs ?? []) as WebhookLog[]} />
    </div>
  );
}
