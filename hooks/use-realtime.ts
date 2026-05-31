"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";
interface UseRealtimeOptions {
  table: string;
  filter?: string;
  onInsert?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}
export function useRealtime({ table, filter, onInsert, onUpdate, onDelete, enabled = true }: UseRealtimeOptions) {
  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    let channel: RealtimeChannel;
    const channelConfig: Record<string, unknown> = { event: "*", schema: "public", table };
    if (filter) channelConfig.filter = filter;
    channel = supabase.channel(`realtime-${table}-${filter ?? "all"}`)
      .on("postgres_changes" as never, channelConfig, (payload: { eventType: string }) => {
        switch (payload.eventType) {
          case "INSERT": onInsert?.(); break;
          case "UPDATE": onUpdate?.(); break;
          case "DELETE": onDelete?.(); break;
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, filter, onInsert, onUpdate, onDelete, enabled]);
}
