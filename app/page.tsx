import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing-content";
import type { Metadata } from "next";

// ISR: revalidate every hour. This replaces force-dynamic, which was
// setting cache-control: no-store on the landing page, preventing
// CDN caching and hurting Google crawl efficiency.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "FinTrack | Free Personal Finance Tracker for Kenya & East Africa",
  description:
    "Track M-Pesa, bank, and cash transactions in real time. Automatic SMS sync, budget alerts, and smart spending insights - built for Kenyans. Free to start.",
  alternates: {
    canonical: "https://finance.rauell.systems",
  },
  openGraph: {
    title: "FinTrack | Free Personal Finance Tracker for Kenya & East Africa",
    description:
      "Automatic M-Pesa SMS sync, multi-account tracking, and budget insights. The personal finance dashboard built for East Africa.",
    url: "https://finance.rauell.systems",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}
