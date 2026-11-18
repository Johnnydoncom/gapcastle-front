"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, Camera, CheckCircle2, ExternalLink, Glasses,
  LifeBuoy, Loader2, RefreshCw, ShieldCheck, Sun, Timer, User, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioCard, RadioCardGroup } from "@/components/ui/RadioCardGroup";
import { fetchApi, useKycStatus, useProfile, type IdentityStatus } from "@/hooks/useGapcastle";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type AccountType = "individual" | "business";
type IdType = "nin" | "bvn";

const ID_HINTS: Record<IdType, string> = {
  nin: "Dial *346# from the phone number linked to your NIN, or check your NIN slip.",
  bvn: "Dial *565*0# from the phone number linked to your bank account.",
};

const STEPS = ["Account type", "Your details", "Face check"] as const;

/** Only return to pages inside the account area. */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/account/") && !next.startsWith("//") ? next : null;
}

/**
 * Platform KYC onboarding (Zeeh). Individuals and agents verify an NIN or
 * BVN; a registered business verifies its CAC registration and then its
 * representative. Both finish with a hosted liveness (face) check, whose
 * result reaches the API by callback while this page polls for it.
 */
export function IdentityOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const { data: kyc, isLoading } = useKycStatus({ pollWhilePending: true });
  const { data: profile } = useProfile();
  const identity = kyc?.identity;

  const [step, setStep] = useState<1 | 2>(1);
  const [restarting, setRestarting] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [idType, setIdType] = useState<IdType>("nin");
  const [idNumber, setIdNumber] = useState("");
  const [companyType, setCompanyType] = useState("RC");
  const [rcNumber, setRcNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Announce a change of state once (e.g. the liveness result arriving while polling).
  const previousStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = identity?.status;
    if (previousStatus.current === "pending" && status === "verified") {
      toast.success("You're verified! Every service is now open to you.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } else if (previousStatus.current === "pending" && status === "failed") {
      toast.error("The face check didn't pass. See the details below.");
    }
    previousStatus.current = status;
  }, [identity?.status, qc]);

  // Back from Zeeh's page through the API's redirect.
  const returned = searchParams.get("liveness");
  useEffect(() => {
    if (returned) qc.invalidateQueries({ queryKey: ["kyc"] });
  }, [returned, qc]);

  const profileName: string = profile?.name ?? session?.user?.name ?? "";
  const profileNameUsable = profileName.trim().split(/\s+/).filter(Boolean).length >= 2;
  const businessReady = accountType === "individual" || (rcNumber.trim().length > 0 && !!companyType);
  const canSubmit = idNumber.length === 11 && consent && businessReady && profileNameUsable && !submitting;

  const submit = async () => {
    if (!token || !canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetchApi("/kyc/identity", token, {
        method: "POST",
        body: JSON.stringify({
          account_type: accountType,
          id_type: idType,
          id_number: idNumber,
          consent,
          ...(accountType === "business" ? { rc_number: rcNumber, company_type: companyType } : {}),
        }),
      });
      const status: IdentityStatus | undefined = res?.data;
      if (status?.status === "pending") {
        toast.success("Your details check out. One last step: the face check.");
        setRestarting(false);
        setIdNumber("");
        setConsent(false);
      } else if (status?.failure_reason) {
        toast.error(status.failure_reason);
      }
      await qc.invalidateQueries({ queryKey: ["kyc"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We couldn't check your details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !kyc) {
    return (
      <Shell>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </Shell>
    );
  }

  const verified = kyc.verified ?? kyc.status === "verified";

  if (verified) {
    return (
      <Shell>
        <VerifiedCard identity={identity} bvnName={kyc.verified_name} bvnLast4={kyc.bvn_last4} next={next} />
      </Shell>
    );
  }

  if (!identity?.enabled) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Identity verification isn&apos;t available right now</h2>
          <p className="mt-1 text-sm text-muted-foreground">Please check back soon.</p>
          <Button variant="outline" className="mt-5" onClick={() => router.push("/account")}>Back to dashboard</Button>
        </div>
      </Shell>
    );
  }

  if (identity.status === "pending" && !restarting) {
    return (
      <Shell>
        <Stepper current={3} />
        <LivenessCard identity={identity} onRestart={() => { setRestarting(true); setStep(1); }} onRefresh={() => qc.invalidateQueries({ queryKey: ["kyc"] })} />
      </Shell>
    );
  }

  if (identity.attempts_remaining === 0) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
          <LifeBuoy className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Let&apos;s finish this together</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            You&apos;ve used all {identity.max_attempts} verification attempts. Our support team can check what went wrong and give you another go.
          </p>
          {identity.failure_reason && <p className="mx-auto mt-4 max-w-sm rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">Last attempt: {identity.failure_reason}</p>}
          <Button asChild className="mt-5"><Link prefetch={false} href="/account/support">Contact support</Link></Button>
        </div>
      </Shell>
    );
  }

  const showProblem = !restarting && (identity.status === "failed" || identity.status === "expired" || identity.status === "revoked") && identity.failure_reason;

  return (
    <Shell>
      <Stepper current={step} />

      {showProblem && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">{identity.status === "expired" ? "Your face check link expired" : "We couldn't verify you last time"}</p>
            <p className="mt-0.5 text-muted-foreground">{identity.failure_reason}</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-card">
          <div>
            <h2 className="font-semibold">Who are you verifying as?</h2>
            <p className="text-sm text-muted-foreground">Choose the option that describes how you use GapCastle.</p>
          </div>
          <RadioCardGroup value={accountType} onValueChange={(v) => setAccountType(v as AccountType)} className="sm:grid-cols-2">
            <RadioCard value="individual" className="p-4">
              <User className="h-5 w-5 text-primary" />
              <p className="mt-2 font-medium">Individual or agent</p>
              <p className="text-xs text-muted-foreground">Including freelancers and unregistered businesses. Verify with your NIN or BVN.</p>
            </RadioCard>
            <RadioCard value="business" className="p-4">
              <Building2 className="h-5 w-5 text-primary" />
              <p className="mt-2 font-medium">Registered business</p>
              <p className="text-xs text-muted-foreground">Registered with the CAC. We verify the business, then you as its representative.</p>
            </RadioCard>
          </RadioCardGroup>
          <div className="flex justify-end gap-2">
            {restarting && <Button variant="ghost" onClick={() => setRestarting(false)}>Cancel</Button>}
            <Button onClick={() => setStep(2)}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form
          className="space-y-6 rounded-2xl border bg-card p-6 shadow-card"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          {accountType === "business" && (
            <section className="space-y-4">
              <div>
                <h2 className="font-semibold">Business registration</h2>
                <p className="text-sm text-muted-foreground">As shown on your CAC certificate.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="company-type">Registration type</Label>
                  <NativeSelect id="company-type" value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="w-full">
                    <NativeSelectOption value="RC">RC: Limited company</NativeSelectOption>
                    <NativeSelectOption value="BN">BN: Business name</NativeSelectOption>
                    <NativeSelectOption value="IT">IT: Incorporated trustees</NativeSelectOption>
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc-number">Registration number</Label>
                  <Input
                    id="rc-number"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="e.g. 1261103"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="font-semibold">{accountType === "business" ? "You, as the business representative" : "Your ID"}</h2>
              <p className="text-sm text-muted-foreground">Choose the ID you&apos;d like to verify with. You&apos;ll use the same one in the face check.</p>
            </div>

            <div className="inline-flex rounded-lg border bg-muted/40 p-1" role="radiogroup" aria-label="ID type">
              {(["nin", "bvn"] as IdType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={idType === type}
                  onClick={() => setIdType(type)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition",
                    idType === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id-number">{idType === "nin" ? "National Identification Number (NIN)" : "Bank Verification Number (BVN)"}</Label>
              <Input
                id="id-number"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                placeholder="11 digits"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
              <p className="text-xs text-muted-foreground">{ID_HINTS[idType]}</p>
            </div>

            <div className={cn("rounded-lg border p-3 text-sm", profileNameUsable ? "bg-muted/40" : "border-amber-300 bg-amber-50 text-amber-900")}>
              <p>
                Name on your profile: <span className="font-medium">{profileName || "not set"}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {profileNameUsable
                  ? `It must match the name on your ${idType.toUpperCase()}.`
                  : "Add your first and last name, exactly as they appear on your ID, before you continue."}{" "}
                <Link prefetch={false} href="/account/settings" className="font-medium text-primary underline-offset-2 hover:underline">Edit profile</Link>
              </p>
            </div>
          </section>

          <label htmlFor="identity-consent" className="flex cursor-pointer items-start gap-3 text-sm">
            <Checkbox id="identity-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span className="text-muted-foreground">
              I agree to GapCastle checking my {idType.toUpperCase()}{accountType === "business" ? " and my business's CAC registration" : ""} with
              our verification partner and the official registry, and to a face check that confirms I&apos;m the owner. Only my name and
              date of birth are kept. My ID number is never stored.
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={submitting}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {identity.attempts_remaining} of {identity.max_attempts} attempts left
              </span>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking your details…</> : <>Check my details <ArrowRight className="ml-1 h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Verify your identity</h1>
          <p className="text-sm text-muted-foreground">
            It takes about 3 minutes and unlocks Credit Reports, KYC Verification and every other service.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-xs sm:text-sm">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : number}
            </span>
            <span className={cn("truncate", active ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {number < STEPS.length && <span className="hidden h-px flex-1 bg-border sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

function LivenessCard({ identity, onRestart, onRefresh }: { identity: IdentityStatus; onRestart: () => void; onRefresh: () => void }) {
  const [opened, setOpened] = useState(false);

  const open = () => {
    if (!identity.liveness_url) return;
    window.open(identity.liveness_url, "_blank", "noopener,noreferrer");
    setOpened(true);
  };

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Your {identity.id_type?.toUpperCase()} ending {identity.id_last4}
          {identity.business_name ? ` and ${identity.business_name}` : ""} checked out.
        </p>
      </div>

      <div>
        <h2 className="font-semibold">Last step: a quick face check</h2>
        <p className="text-sm text-muted-foreground">
          Our verification partner will ask you to look at your camera for a few seconds, to confirm you&apos;re the owner of this ID.
        </p>
      </div>

      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        <li className="flex items-center gap-2 rounded-lg bg-muted/40 p-3"><Sun className="h-4 w-4 text-primary" /> Find good light</li>
        <li className="flex items-center gap-2 rounded-lg bg-muted/40 p-3"><Glasses className="h-4 w-4 text-primary" /> Remove glasses or a cap</li>
        <li className="flex items-center gap-2 rounded-lg bg-muted/40 p-3"><Camera className="h-4 w-4 text-primary" /> Allow camera access</li>
      </ul>

      <Button size="lg" className="w-full" onClick={open}>
        {opened ? "Open the face check again" : "Start face check"} <ExternalLink className="ml-2 h-4 w-4" />
      </Button>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {opened ? "Waiting for your result. This page updates by itself." : "We'll update this page as soon as your result is in."}
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Check again"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        {identity.liveness_expires_at && (
          <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> Link valid until {new Date(identity.liveness_expires_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
        )}
        <button type="button" onClick={onRestart} className="font-medium text-primary hover:underline">
          Start over with different details
        </button>
      </div>
      {identity.attempts_remaining > 0 && (
        <p className="text-[11px] text-muted-foreground">Starting over uses one of your {identity.attempts_remaining} remaining attempts.</p>
      )}
    </div>
  );
}

function VerifiedCard({ identity, bvnName, bvnLast4, next }: { identity?: IdentityStatus; bvnName: string | null; bvnLast4: string | null; next: string | null }) {
  const router = useRouter();
  const viaIdentity = identity?.method === "identity";
  const name = viaIdentity ? identity?.verified_name : bvnName;
  const idLine = viaIdentity
    ? `${identity?.id_type?.toUpperCase()} ending ${identity?.id_last4}`
    : bvnLast4 ? `BVN ending ${bvnLast4}` : null;

  return (
    <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <BadgeCheck className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">You&apos;re verified</h2>
      {name && <p className="mt-1 text-sm">{name}</p>}
      {viaIdentity && identity?.business_name && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Building2 className="h-3.5 w-3.5" /> Verified business: {identity.business_name}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {idLine}{identity?.verified_at ? ` · ${formatDate(identity.verified_at)}` : ""}
      </p>
      <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">Every service on GapCastle is open to you, including Credit Reports and KYC Verification.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {next ? (
          <Button onClick={() => router.push(next)}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
        ) : (
          <Button onClick={() => router.push("/account/services")}>Explore services</Button>
        )}
      </div>
    </div>
  );
}
