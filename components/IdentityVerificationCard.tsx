"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Building2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchApi, useKycStatus, type IdentityStatus } from "@/hooks/useGapcastle";
import { formatDate } from "@/lib/format";

/** What the API's callback reports in ?kyc= when the user returns from NIBSS. */
const RETURN_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  verified: { ok: true, text: "Your identity is verified. You can now withdraw." },
  pending: { ok: true, text: "We're confirming your BVN with NIBSS. This usually takes a moment." },
  failed: { ok: false, text: "We couldn't verify your BVN. See the details below." },
};

/**
 * KYC by BVN. The user consents, approves the request on NIBSS's page
 * (Flutterwave's consent flow), and is returned to Settings. Required before
 * any withdrawal.
 */
export function IdentityVerificationCard() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const { data: kyc, isLoading } = useKycStatus();

  const [bvn, setBvn] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const refreshStatus = () => qc.invalidateQueries({ queryKey: ["kyc"] });

  // Back from the NIBSS consent page.
  const returned = searchParams.get("kyc");
  useEffect(() => {
    const message = returned ? RETURN_MESSAGES[returned] : undefined;
    if (!message) return;
    if (message.ok) toast.success(message.text);
    else toast.error(message.text);
    qc.invalidateQueries({ queryKey: ["kyc"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }, [returned, qc]);

  const start = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetchApi("/kyc/bvn", token, {
        method: "POST",
        body: JSON.stringify({ bvn, consent }),
      });
      const consentUrl: string | null = res?.data?.consent_url ?? null;
      if (consentUrl) {
        // NIBSS's page: the user approves there and comes back to Settings.
        window.location.href = consentUrl;
        return;
      }
      if (res?.data?.status === "verified") toast.success("Your identity is verified. You can now withdraw.");
      setBvn("");
      setConsent(false);
      setRestarting(false);
      await refreshStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start verification.");
    } finally {
      setBusy(false);
    }
  };

  const checkAgain = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetchApi("/kyc/bvn/refresh", token, { method: "POST" });
      const status = res?.data?.status;
      if (status === "verified") toast.success("Your identity is verified. You can now withdraw.");
      else if (status === "pending") toast.info("Not confirmed yet. Finish the approval on the NIBSS page, then check again.");
      await refreshStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not check your verification.");
    } finally {
      setBusy(false);
    }
  };

  const showForm = kyc && (kyc.status === "unverified" || kyc.status === "failed" || restarting);

  // Platform KYC (NIN/BVN/CAC + face check) on: it is the one way to verify,
  // and it also counts for withdrawals.
  if (kyc?.identity?.enabled || (kyc?.verified && kyc.identity?.method === "identity")) {
    return <PlatformIdentitySummary identity={kyc.identity!} verified={!!kyc.verified} bvnLast4={kyc.bvn_last4} bvnName={kyc.verified_name} />;
  }

  // Switched off by an admin: nothing to do here unless already verified.
  if (kyc && !kyc.enabled && kyc.status !== "verified") return null;

  return (
    <div id="identity" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-semibold">Identity verification (BVN)</h2>
          <p className="text-sm text-muted-foreground">Verify your Bank Verification Number to withdraw from your wallet.</p>
        </div>
      </div>

      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}

      {kyc?.status === "verified" && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Verified{kyc.verified_name ? ` as ${kyc.verified_name}` : ""}</p>
            <p className="text-xs">
              BVN ending {kyc.bvn_last4}{kyc.verified_at ? ` · ${formatDate(kyc.verified_at)}` : ""}
            </p>
          </div>
        </div>
      )}

      {kyc?.status === "pending" && !restarting && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Waiting for your approval on the NIBSS page. If you&apos;ve approved it, check again.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={checkAgain} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check again
            </Button>
            <Button variant="ghost" onClick={() => setRestarting(true)} disabled={busy}>Start again</Button>
          </div>
        </div>
      )}

      {showForm && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (bvn.length === 11 && consent) start(); }}>
          {kyc?.status === "failed" && kyc.failure_reason && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{kyc.failure_reason}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="bvn">BVN</Label>
            <Input
              id="bvn"
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              placeholder="11-digit BVN"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
            />
            <p className="text-xs text-muted-foreground">
              Dial *565*0# on the phone number linked to your bank to get your BVN. The name on your BVN must match your profile name.
            </p>
          </div>
          <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Next, you&apos;ll go to NIBSS&apos;s secure consent page. Choose to receive a one-time code by email, enter it there to
            confirm you own this BVN, then approve sharing your details. You&apos;ll be brought back here when it&apos;s done.
          </p>
          <label htmlFor="bvn-consent" className="flex cursor-pointer items-start gap-3 text-sm">
            <Checkbox id="bvn-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span className="text-muted-foreground">
              I consent to GapCastle verifying my BVN with NIBSS through Flutterwave, and to receiving my name and date of
              birth from it to confirm my identity. My BVN itself is not stored.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || bvn.length !== 11 || !consent}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify BVN
            </Button>
            {restarting && <Button type="button" variant="ghost" onClick={() => setRestarting(false)}>Cancel</Button>}
          </div>
        </form>
      )}
    </div>
  );
}

const IDENTITY_STATE: Record<string, { label: string; tone: string; cta: string }> = {
  unverified: { label: "Not verified", tone: "bg-muted text-muted-foreground", cta: "Verify my identity" },
  pending: { label: "Face check pending", tone: "bg-amber-100 text-amber-800", cta: "Finish verification" },
  failed: { label: "Not verified", tone: "bg-destructive/10 text-destructive", cta: "Try again" },
  expired: { label: "Link expired", tone: "bg-amber-100 text-amber-800", cta: "Start again" },
  revoked: { label: "Verification withdrawn", tone: "bg-destructive/10 text-destructive", cta: "Verify again" },
};

/** Settings summary of platform KYC; the steps themselves live on /account/verify. */
function PlatformIdentitySummary({ identity, verified, bvnLast4, bvnName }: {
  identity: IdentityStatus;
  verified: boolean;
  bvnLast4: string | null;
  bvnName: string | null;
}) {
  const viaIdentity = identity.method === "identity";
  const state = IDENTITY_STATE[identity.status] ?? IDENTITY_STATE.unverified;

  return (
    <div id="identity" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold">Identity verification</h2>
            <p className="text-sm text-muted-foreground">
              Optional. Verify with your NIN, BVN or CAC registration and a quick face check to unlock Credit Reports, KYC Verification and withdrawals.
            </p>
          </div>
        </div>
        {!verified && <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${state.tone}`}>{state.label}</span>}
      </div>

      {verified ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Verified{(viaIdentity ? identity.verified_name : bvnName) ? ` as ${viaIdentity ? identity.verified_name : bvnName}` : ""}</p>
            {viaIdentity && identity.business_name && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium"><Building2 className="h-3.5 w-3.5" /> Verified business: {identity.business_name}</p>
            )}
            <p className="text-xs">
              {viaIdentity ? `${identity.id_type?.toUpperCase()} ending ${identity.id_last4}` : bvnLast4 ? `BVN ending ${bvnLast4}` : "Identity verified"}
              {identity.verified_at ? ` · ${formatDate(identity.verified_at)}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {identity.status === "pending"
              ? "Your ID checked out. Just the face check is left."
              : identity.failure_reason ?? "It takes about 3 minutes and you only do it once."}
          </p>
          <Button asChild>
            <Link href="/account/verify">{state.cta}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
