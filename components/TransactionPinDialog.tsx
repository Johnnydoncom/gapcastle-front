"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { PinStatus, TransactionPinError, pinRequest } from "@/lib/transaction-pin";

type Step = "loading" | "enter" | "create" | "change" | "locked" | "forgot" | "reset";

interface TransactionPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * confirm: collect the PIN for a withdrawal or wallet payment, creating one
   * first if the account has none. manage: create, change or reset it from
   * Settings, then close.
   */
  mode?: "confirm" | "manage";
  /** In manage mode, start on the forgotten-PIN flow instead of change. */
  startWithReset?: boolean;
  title?: string;
  description?: string;
  /**
   * Runs the protected request with the PIN. Throw a TransactionPinError to
   * keep the dialog open and show why (wrong PIN, locked); anything else the
   * caller reports itself.
   */
  onConfirm?: (pin: string) => Promise<unknown>;
  /** Called after a PIN is created, changed or reset in manage mode. */
  onManaged?: () => void;
}

function PinInput({ value, onChange, onComplete, autoFocus, disabled, length = 4, masked = true, id }: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  length?: number;
  masked?: boolean;
  id?: string;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={length}
      value={value}
      onChange={(v) => onChange(v.replace(/\D/g, ""))}
      onComplete={onComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      inputMode="numeric"
      pattern="^[0-9]*$"
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        {Array.from({ length }, (_, i) => (
          <InputOTPSlot key={i} index={i} masked={masked} className="h-12 w-12 text-lg" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

export function TransactionPinDialog({
  open,
  onOpenChange,
  mode = "confirm",
  startWithReset = false,
  title,
  description,
  onConfirm,
  onManaged,
}: TransactionPinDialogProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [step, setStep] = useState<Step>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const resetFields = () => {
    setPin(""); setNewPin(""); setConfirmPin(""); setPassword(""); setCode(""); setError(null);
  };

  const goTo = (next: Step) => { resetFields(); setStep(next); };

  /** Close and start over next time; the PIN may be created, locked or reset meanwhile. */
  const close = () => {
    resetFields();
    setStep("loading");
    onOpenChange(false);
  };

  // Ask the API where to start each time the dialog opens.
  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;

    pinRequest<PinStatus>(token, "")
      .then((status) => {
        if (cancelled) return;
        if (!status.has_pin) return setStep("create");
        if (startWithReset) return setStep("forgot");
        if (status.locked_until) {
          setLockedUntil(status.locked_until);
          return setStep("locked");
        }
        setStep(mode === "manage" ? "change" : "enter");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        toast.error(e.message);
        close();
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);

  const finishManaged = (message: string) => {
    toast.success(message);
    onManaged?.();
    close();
  };

  /** Run the caller's request, keeping the dialog open on a PIN refusal. */
  const confirmWith = async (value: string) => {
    if (!onConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(value);
      close();
    } catch (e) {
      if (e instanceof TransactionPinError) {
        if (e.code === "pin_locked") {
          setLockedUntil(e.lockedUntil);
          goTo("locked");
        } else if (e.code === "pin_not_set") {
          goTo("create");
        } else {
          setStep("enter");
          setPin("");
          setError(e.message);
        }
      } else {
        // The caller reports its own failures.
        close();
      }
    } finally {
      setBusy(false);
    }
  };

  /** Submit a form step, showing the API's message inline on failure. */
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      if (e instanceof TransactionPinError && e.code === "pin_locked") {
        setLockedUntil(e.lockedUntil);
        goTo("locked");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const newPinMismatch = newPin.length === 4 && confirmPin.length === 4 && newPin !== confirmPin;
  const newPinReady = newPin.length === 4 && confirmPin.length === 4 && !newPinMismatch;

  const createPin = () => run(async () => {
    await pinRequest(token!, "", "POST", { pin: newPin, pin_confirmation: confirmPin, password });
    if (mode === "manage") return finishManaged("Transaction PIN created.");
    toast.success("Transaction PIN created.");
    const created = newPin;
    goTo("enter");
    await confirmWith(created);
  });

  const changePin = () => run(async () => {
    await pinRequest(token!, "", "PUT", { current_pin: pin, pin: newPin, pin_confirmation: confirmPin });
    finishManaged("Transaction PIN changed.");
  });

  const sendResetCode = () => run(async () => {
    await pinRequest(token!, "/forgot", "POST", { password });
    toast.success("We've emailed you a 6-digit code.");
    goTo("reset");
  });

  const resetPin = () => run(async () => {
    await pinRequest(token!, "/reset", "POST", { code, pin: newPin, pin_confirmation: confirmPin });
    if (mode === "manage") return finishManaged("Transaction PIN reset.");
    toast.success("Transaction PIN reset.");
    const reset = newPin;
    goTo("enter");
    await confirmWith(reset);
  });

  const newPinFields = (
    <>
      <div className="space-y-2">
        <Label className="block text-center">New PIN</Label>
        <PinInput value={newPin} onChange={setNewPin} autoFocus={step === "create"} />
      </div>
      <div className="space-y-2">
        <Label className="block text-center">Confirm new PIN</Label>
        <PinInput value={confirmPin} onChange={setConfirmPin} />
        {newPinMismatch && <p className="text-center text-xs text-destructive">The PINs do not match.</p>}
      </div>
    </>
  );

  const headings: Record<Step, { title: string; description: string }> = {
    loading: { title: title ?? "Transaction PIN", description: "" },
    enter: {
      title: title ?? "Enter your transaction PIN",
      description: description ?? "Enter your 4-digit PIN to authorise this transaction.",
    },
    create: {
      title: "Create a transaction PIN",
      description: "You'll use this 4-digit PIN to confirm withdrawals and wallet payments. Avoid repeated or consecutive digits.",
    },
    change: { title: "Change transaction PIN", description: "Enter your current PIN, then choose a new one." },
    locked: { title: "PIN locked", description: "" },
    forgot: { title: "Reset transaction PIN", description: "Confirm your account password and we'll email you a code." },
    reset: { title: "Reset transaction PIN", description: "Enter the 6-digit code we emailed you and choose a new PIN." },
  };

  const forgotLink = (
    <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => goTo("forgot")}>
      Forgot PIN?
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy && !next) close(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">{headings[step].title}</DialogTitle>
          {headings[step].description && (
            <DialogDescription className="text-center">{headings[step].description}</DialogDescription>
          )}
        </DialogHeader>

        {step === "loading" && (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}

        {step === "enter" && (
          <div className="space-y-4">
            <PinInput value={pin} onChange={setPin} onComplete={confirmWith} autoFocus disabled={busy} />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy || pin.length !== 4} onClick={() => confirmWith(pin)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Processing…" : "Confirm"}
            </Button>
            <div className="text-center">{forgotLink}</div>
          </div>
        )}

        {step === "create" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (newPinReady && password) createPin(); }}>
            {newPinFields}
            <div className="space-y-2">
              <Label htmlFor="pin-password">Account password</Label>
              <Input id="pin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !newPinReady || !password}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "confirm" ? "Create PIN and continue" : "Create PIN"}
            </Button>
          </form>
        )}

        {step === "change" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (pin.length === 4 && newPinReady) changePin(); }}>
            <div className="space-y-2">
              <Label className="block text-center">Current PIN</Label>
              <PinInput value={pin} onChange={setPin} autoFocus />
            </div>
            {newPinFields}
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || pin.length !== 4 || !newPinReady}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change PIN
            </Button>
            <div className="text-center">{forgotLink}</div>
          </form>
        )}

        {step === "locked" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Too many incorrect attempts. You can try again {lockedUntil ? `after ${formatTime(lockedUntil)}` : "later"}, or reset your PIN now.
            </p>
            <Button className="w-full" onClick={() => goTo("forgot")}>Reset PIN</Button>
          </div>
        )}

        {step === "forgot" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (password) sendResetCode(); }}>
            <div className="space-y-2">
              <Label htmlFor="reset-password">Account password</Label>
              <Input id="reset-password" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !password}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Email me a code
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (code.length === 6 && newPinReady) resetPin(); }}>
            <div className="space-y-2">
              <Label className="block text-center">Code from your email</Label>
              <PinInput value={code} onChange={setCode} length={6} masked={false} autoFocus />
            </div>
            {newPinFields}
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6 || !newPinReady}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "confirm" ? "Reset PIN and continue" : "Reset PIN"}
            </Button>
            <div className="text-center">
              <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => goTo("forgot")}>
                Send a new code
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
