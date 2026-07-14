"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fintrack-theme", next ? "dark" : "light");
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        "group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full",
        "text-[#33375C] hover:bg-[#FEF9C3] hover:text-[#EA580C]"
      )}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4.5 w-4.5 shrink-0" /> : <Moon className="h-4.5 w-4.5 shrink-0" />}
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
