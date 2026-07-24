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
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Webhook className="h-6 w-6 text-[#EA580C]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0D27] tracking-tight">Incoming SMS Log</h1>
        </div>
        <p className="text-sm text-[#33375C]/60 mt-1">
          Every SMS your webhook received and what happened to it - filter, review, or replay any message.
        </p>
      </div>

      <WebhookLogsList logs={(logs ?? []) as WebhookLog[]} />
    </div>
  );
}
