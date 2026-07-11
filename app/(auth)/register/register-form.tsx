"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: resData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (resData.session) {
        toast.success("Account created successfully! Signing in...");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.success("Registration successful! Please check your email to verify your account.");
        router.push("/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E2FF] shadow-xl shadow-[#524CF2]/[0.06] p-7 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A0D27] tracking-tight">Create your account</h1>
        <p className="text-sm text-[#33375C]/70 mt-1">Get started with FinTrack today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-bold text-[#33375C] uppercase tracking-wider">Full Name</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#33375C]/40">
              <User className="h-4 w-4" />
            </span>
            <Input id="fullName" type="text" placeholder="John Doe" className="pl-9" {...register("fullName")} />
          </div>
          {errors.fullName && <p className="text-xs text-rose-600">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-[#33375C] uppercase tracking-wider">Email</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#33375C]/40">
              <Mail className="h-4 w-4" />
            </span>
            <Input id="email" type="email" placeholder="you@example.com" className="pl-9" {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-[#33375C] uppercase tracking-wider">Password</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#33375C]/40">
              <Lock className="h-4 w-4" />
            </span>
            <Input id="password" type="password" placeholder="••••••••" className="pl-9" {...register("password")} />
          </div>
          {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#33375C] uppercase tracking-wider">Confirm Password</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#33375C]/40">
              <Lock className="h-4 w-4" />
            </span>
            <Input id="confirmPassword" type="password" placeholder="••••••••" className="pl-9" {...register("confirmPassword")} />
          </div>
          {errors.confirmPassword && <p className="text-xs text-rose-600">{errors.confirmPassword.message}</p>}
        </div>

        {/* Accept Terms */}
        <div className="space-y-1.5 mt-2">
          <div className="flex items-start gap-2.5">
            <input
              id="acceptTerms"
              type="checkbox"
              className="h-4 w-4 rounded border-[#E2E2FF] text-[#524CF2] focus:ring-[#524CF2] mt-0.5 cursor-pointer"
              {...register("acceptTerms")}
            />
            <label htmlFor="acceptTerms" className="text-xs text-[#33375C]/75 leading-tight font-medium cursor-pointer">
              I accept the{" "}
              <Link href="/terms" target="_blank" className="text-[#524CF2] hover:underline font-semibold">
                Terms of Service
              </Link>
            </label>
          </div>
          {errors.acceptTerms && <p className="text-xs text-rose-600 font-semibold">{errors.acceptTerms.message}</p>}
        </div>

        {/* Accept Privacy */}
        <div className="space-y-1.5 mt-2">
          <div className="flex items-start gap-2.5">
            <input
              id="acceptPrivacy"
              type="checkbox"
              className="h-4 w-4 rounded border-[#E2E2FF] text-[#524CF2] focus:ring-[#524CF2] mt-0.5 cursor-pointer"
              {...register("acceptPrivacy")}
            />
            <label htmlFor="acceptPrivacy" className="text-xs text-[#33375C]/75 leading-tight font-medium cursor-pointer">
              I accept the{" "}
              <Link href="/privacy" target="_blank" className="text-[#524CF2] hover:underline font-semibold">
                Privacy Policy
              </Link>{" "}
              (DPA, GDPR &amp; CCPA compliant)
            </label>
          </div>
          {errors.acceptPrivacy && <p className="text-xs text-rose-600 font-semibold">{errors.acceptPrivacy.message}</p>}
        </div>

        <Button type="submit" className="w-full h-11 mt-4" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <div className="border-t border-[#E2E2FF] mt-5 pt-4 text-center">
        <p className="text-xs text-[#33375C]/70">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#524CF2] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
