import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already authenticated, redirect straight to the dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Otherwise, render the showstopper fintech SaaS landing page
  return <LandingContent />;
}
