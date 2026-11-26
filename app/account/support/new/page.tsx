"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateTicket } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_SUBJECT_MAX,
  TICKET_BODY_MIN,
  MAX_TICKET_ATTACHMENTS,
  TICKET_ATTACHMENT_ACCEPT,
  addTicketAttachments,
  formatFileSize,
} from "@/lib/support";
import { ArrowLeft, Paperclip, X } from "lucide-react";

export default function NewTicketPage() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: createTicket, isPending } = useCreateTicket();
  const router = useRouter();
  const { toast } = useToast();

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();
  const bodyTooShort = trimmedBody.length < TICKET_BODY_MIN;
  const isBusy = isPending || submitted;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    // Clear the input so picking the same file again (after removing it) still fires a change.
    e.target.value = "";
    if (!picked.length) return;

    const { files: next, error } = addTicketAttachments(files, picked);
    setFiles(next);
    if (error) {
      toast({ title: "Some files were not added", description: error, variant: "destructive" });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    if (!category || !trimmedSubject || bodyTooShort) {
      toast({
        title: "Please complete the form",
        description: `Choose a category, add a subject, and write a message of at least ${TICKET_BODY_MIN} characters.`,
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("subject", trimmedSubject);
    formData.append("category", category);
    formData.append("priority", priority);
    formData.append("body", trimmedBody);
    files.forEach(f => formData.append("attachments[]", f));

    createTicket(formData, {
      onSuccess: (ticket) => {
        // Keep the button disabled while we navigate away, so it can't be sent twice.
        setSubmitted(true);
        toast({
          title: "Ticket submitted",
          description: `Your reference is ${ticket.reference}. We'll reply here and by email.`,
        });
        // Replace, so "back" from the ticket returns to the list, not an emptied form.
        router.replace(`/account/support/${ticket.id}`);
      },
      onError: (err) => {
        toast({ title: "Could not submit ticket", description: err.message || "Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/account/support" aria-label="Back to support tickets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Open New Ticket</h1>
          <p className="text-sm text-muted-foreground">Please describe your issue in detail.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <fieldset disabled={isBusy} className="space-y-6">
            <div className="space-y-4 sm:flex sm:gap-4 sm:space-y-0">
              <div className="flex-1 space-y-2">
                <label htmlFor="ticket-category" className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select value={category} onValueChange={setCategory} disabled={isBusy}>
                  <SelectTrigger id="ticket-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <label htmlFor="ticket-priority" className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority} disabled={isBusy}>
                  <SelectTrigger id="ticket-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="ticket-subject" className="text-sm font-medium">
                Subject <span className="text-destructive">*</span>
              </label>
              <Input
                id="ticket-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief description of the issue"
                maxLength={TICKET_SUBJECT_MAX}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ticket-body" className="text-sm font-medium">
                Message <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="ticket-body"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Please provide as much detail as possible, e.g. the transaction reference, amount and date."
                rows={6}
              />
              <p className={`text-xs ${body && bodyTooShort ? "text-destructive" : "text-muted-foreground"}`}>
                {bodyTooShort
                  ? `At least ${TICKET_BODY_MIN} characters (${trimmedBody.length}/${TICKET_BODY_MIN}).`
                  : "Looks good."}
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-medium">Attachments (Optional)</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept={TICKET_ATTACHMENT_ACCEPT}
              />

              {files.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${f.size}`} className="flex items-center gap-2 rounded-md border bg-secondary/50 px-3 py-1.5 text-xs">
                      <span className="truncate max-w-[150px]">{f.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(f.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy || files.length >= MAX_TICKET_ATTACHMENTS}
                className="w-full sm:w-auto"
              >
                <Paperclip className="mr-2 h-4 w-4" /> Add Files
              </Button>
              <p className="text-xs text-muted-foreground">
                Max {MAX_TICKET_ATTACHMENTS} files. Supported: JPG, PNG, PDF, TXT, DOC, DOCX (up to 5MB each).
              </p>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 border-t pt-6">
            <Button asChild type="button" variant="ghost">
              <Link href="/account/support">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isBusy || !category || !trimmedSubject || bodyTooShort}>
              {isBusy ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
