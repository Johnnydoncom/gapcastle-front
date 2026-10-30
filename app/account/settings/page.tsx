"use client";
import { useState, useEffect } from "react";
import { useKycStatus, useProfile } from "@/hooks/useGapcastle";
import { IdentityVerificationCard } from "@/components/IdentityVerificationCard";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { TransactionPinDialog } from "@/components/TransactionPinDialog";
import { PinStatus, pinRequest } from "@/lib/transaction-pin";

export default function Settings() {
  const { data: session } = useSession();
  const user = session?.user;
  const { data: profile } = useProfile();
  const bvnVerified = useKycStatus().data?.status === "verified";
  // Withdrawals only reach accounts in this name, so the API allows a single
  // correction before the first withdrawal. Anything further goes to support.
  const nameLocked = bvnVerified || !!profile?.name_locked;
  const holdHours = profile?.name_change_hold_hours ?? 72;
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmNameOpen, setConfirmNameOpen] = useState(false);
  const token = session?.accessToken;
  const [pinDialog, setPinDialog] = useState<"closed" | "manage" | "reset">("closed");

  const { data: pinStatus, refetch: refetchPinStatus } = useQuery({
    queryKey: ["transaction-pin", user?.id],
    enabled: !!token,
    queryFn: () => pinRequest<PinStatus>(token as string, ""),
  });

  useEffect(() => {
    if (profile) { setFullName(profile.name ?? ""); setPhone(profile.phone ?? ""); }
  }, [profile]);

  const save = async () => {
    setLoading(true);
    try {
      if (!token) throw new Error("Session expired. Please log in again.");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      // The user route is typically /api/user, not /api/v1/user based on our setup
      const res = await fetch(`${API_URL.replace("/v1", "")}/user`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ name: fullName, phone })
      });
      
      const data = await res.json();
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /** A new name spends the one correction, so it is confirmed first. */
  const requestSave = () => {
    if (profile && fullName.trim() !== profile.name) {
      setConfirmNameOpen(true);
      return;
    }
    save();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account.</p>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-card space-y-4">
        <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={nameLocked} />
          <p className="text-xs text-muted-foreground">
            {bvnVerified
              ? "Verified with your BVN. Contact support if it needs correcting."
              : nameLocked
                ? "Your name can no longer be changed here. Contact support if it needs correcting."
                : `Use your name exactly as it appears on your bank account. You can correct it once, and withdrawals pause for ${holdHours} hours afterwards.`}
          </p>
        </div>
        <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <Button onClick={requestSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <AlertDialog open={confirmNameOpen} onOpenChange={setConfirmNameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change your name to {fullName.trim()}?</AlertDialogTitle>
            <AlertDialogDescription>
              You can only do this once, and after that only support can change it.
              Withdrawals will pause for {holdHours} hours, and you can only withdraw to an account in this name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={save}>Change my name</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <IdentityVerificationCard />

      <div className="rounded-2xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold">Transaction PIN</h2>
            <p className="text-sm text-muted-foreground">
              {pinStatus?.has_pin
                ? "Your 4-digit PIN confirms withdrawals and wallet payments."
                : "Create a 4-digit PIN to confirm withdrawals and wallet payments."}
            </p>
            {pinStatus?.locked_until && (
              <p className="mt-1 text-sm text-destructive">Locked after too many incorrect attempts. Reset it to unlock now.</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {pinStatus?.has_pin ? (
            <>
              <Button variant="outline" onClick={() => setPinDialog("manage")}>Change PIN</Button>
              <Button variant="ghost" onClick={() => setPinDialog("reset")}>Forgot PIN?</Button>
            </>
          ) : (
            <Button onClick={() => setPinDialog("manage")} disabled={!pinStatus}>Create PIN</Button>
          )}
        </div>
      </div>

      <TransactionPinDialog
        open={pinDialog !== "closed"}
        onOpenChange={(open) => { if (!open) setPinDialog("closed"); }}
        mode="manage"
        startWithReset={pinDialog === "reset"}
        onManaged={() => refetchPinStatus()}
      />
    </div>
  );
}
