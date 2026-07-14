import { AppShell } from "@/components/layout/app-shell";
import { AIChatWidget } from "@/components/layout/ai-chat-widget";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <AIChatWidget />
    </>
  );
}
