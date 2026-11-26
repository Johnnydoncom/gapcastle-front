"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * No newsletter endpoint exists yet, so a sign-up is sent as an email to the
 * support inbox instead of being discarded.
 */
export function NewsletterForm({ email }: { email: string }) {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subscriber = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const subject = encodeURIComponent("Newsletter subscription");
    const body = encodeURIComponent(`Please add ${subscriber} to the Gap Castle newsletter.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="mx-auto mt-6 flex max-w-md gap-2">
        <Input type="email" name="email" aria-label="Email address" autoComplete="email" placeholder="you@example.com" required />
        <Button type="submit">Subscribe</Button>
      </form>
      {sent && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Your email app should now be open. Press send there to confirm your subscription.
        </p>
      )}
    </>
  );
}
