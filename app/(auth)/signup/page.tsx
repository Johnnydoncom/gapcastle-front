"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Gift } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  // Invite links look like /signup?ref=CODE.
  const invitedCode = (useSearchParams().get("ref") ?? "").trim().toUpperCase();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", referralCode: invitedCode });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          password_confirmation: form.password,
          name: form.fullName,
          phone: form.phone,
          referral_code: form.referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Auto-login after successful registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (signInRes?.error) {
        throw new Error("Login failed after registration");
      }

      toast.success("Account created! Welcome to GapCastle 🎉");
      router.push("/account");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start paying bills and earning cashback</p>
      {invitedCode && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
          <Gift className="h-4 w-4 shrink-0" />You were invited by a friend. Their code is applied below.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2"><Label>Full name</Label>
          <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Adaeze Okafor" />
        </div>
        <div className="space-y-2"><Label>Email</Label>
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </div>
        <div className="space-y-2"><Label>Phone</Label>
          <Input type="tel" required pattern="[0-9]{11}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08012345678" />
        </div>
        <div className="space-y-2"><Label>Password</Label>
          <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
        </div>
        <div className="space-y-2"><Label>Referral code <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input value={form.referralCode} maxLength={16} className="font-mono uppercase tracking-widest" onChange={(e) => setForm({ ...form, referralCode: e.target.value.replace(/\s/g, "").toUpperCase() })} placeholder="e.g. 7KQ2MXRA" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </>
  );
}

export default function Signup() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Link href="/"><Logo /></Link></div>
        <div className="rounded-2xl border bg-card p-8 shadow-card">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
