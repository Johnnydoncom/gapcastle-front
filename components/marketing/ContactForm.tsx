"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * There is no contact endpoint on the API, so the form hands the message to
 * the visitor's email app, addressed to the support inbox. Nothing is
 * silently dropped.
 */
export function ContactForm({ email }: { email: string }) {
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const from = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const body = `${message}\n\n— ${name} (${from})`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setDone(true);
  };

  if (done) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-success/10 p-10 text-center animate-scale-in" role="status">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-4 text-xl font-bold">Almost there</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your email app should now be open with your message. Press send there to reach us. If nothing opened, email us
          directly at <a href={`mailto:${email}`} className="font-semibold text-primary underline-offset-4 hover:underline">{email}</a>.
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => setDone(false)}>Write another message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" autoComplete="name" required placeholder="Adaeze Okafor" /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" required placeholder="How can we help?" /></div>
      <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" required rows={5} placeholder="Tell us a little about your enquiry…" /></div>
      <Button type="submit" className="w-full gap-2">Send message <Send className="h-4 w-4" /></Button>
    </form>
  );
}
