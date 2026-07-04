import Link from "next/link";
import { TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Registration | FinTrack",
  description:
    "FinTrack is a private personal finance tracker. Access is restricted and public registration is disabled.",
  alternates: {
    canonical: "https://finance.rauell.systems/register",
  },
  openGraph: {
    title: "Private Registration | FinTrack",
    description:
      "FinTrack registration is restricted to authorized personal use only.",
    url: "https://finance.rauell.systems/register",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinTrack Private Registration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Registration | FinTrack",
    description:
      "FinTrack registration is restricted to authorized personal use only.",
    images: ["/og-image.png"],
  },
};

export default function RegisterPage() {
  return (
    <div className="w-full">
      <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
        <div className="h-10 w-10 rounded-xl bg-[#524CF2] flex items-center justify-center shadow-md shadow-[#524CF2]/20">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-[#0A0D27]">FinTrack</span>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-xl shadow-[#524CF2]/[0.06] p-7 sm:p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-[#F0F0FF] flex items-center justify-center mx-auto mb-5">
          <Lock className="h-7 w-7 text-[#524CF2]" />
        </div>
        <h1 className="text-xl font-bold text-[#0A0D27] tracking-tight">Private Application</h1>
        <p className="text-sm text-[#33375C]/70 mt-2 max-w-xs mx-auto">
          Registration is disabled. This is a personal finance tracker with restricted access.
        </p>
        <Button asChild className="mt-6 w-full h-11">
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
