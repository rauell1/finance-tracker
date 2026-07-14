import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FC] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black text-[#EA580C] mb-4">404</h1>
        <p className="text-xl text-[#33375C]/70 mb-6">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#EA580C] rounded-xl hover:bg-[#433BC2] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}