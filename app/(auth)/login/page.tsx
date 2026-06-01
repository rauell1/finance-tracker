"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (error) { toast.error(error.message); return; }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Mobile-only logo */}
      <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
        <div className="h-10 w-10 rounded-xl bg-[#524CF2] flex items-center justify-center shadow-md shadow-[#524CF2]/20">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-[#0A0D27]">FinTrack</span>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-xl shadow-[#524CF2]/[0.06] p-7 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Welcome back</h1>
          <p className="text-sm text-[#33375C]/70 mt-1">Sign in to your FinTrack account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-[#33375C] uppercase tracking-wider">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-[#33375C] uppercase tracking-wider">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full h-11 mt-2" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-sm text-[#33375C]/70 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#524CF2] font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
