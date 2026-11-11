"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Lock, ScanFace, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IdentityStatus } from "@/hooks/useGapcastle";

/**
 * Shown instead of a service an admin restricted to identity-verified
 * customers. Sends them to onboarding and back here when they're done.
 */
export function IdentityRequiredGate({ serviceName, identity }: { serviceName: string; identity?: IdentityStatus }) {
  const pathname = usePathname();
  const pending = identity?.status === "pending";
  const href = `/account/verify?next=${encodeURIComponent(pathname || "/account")}`;

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold">Verify your identity to use {serviceName}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {serviceName} reveals sensitive personal information. To protect the people being checked, it&apos;s only available to verified accounts.
        </p>

        <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left text-sm">
          <li className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Verify with your <strong>NIN or BVN</strong>, or your business&apos;s <strong>CAC</strong> registration</span>
          </li>
          <li className="flex items-start gap-3">
            <ScanFace className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Take a quick face check with your phone or laptop camera</span>
          </li>
          <li className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>It takes about 3 minutes, is free, and you only do it once</span>
          </li>
        </ul>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href={href}>{pending ? "Finish verification" : "Verify my identity"}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/account/services">Other services</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
