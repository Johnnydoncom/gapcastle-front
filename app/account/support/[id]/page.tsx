"use client";
import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useTicket, useReplyToTicket, useCloseTicket } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import {
  TICKET_REPLY_MIN,
  MAX_TICKET_ATTACHMENTS,
  TICKET_ATTACHMENT_ACCEPT,
  addTicketAttachments,
  ticketCategoryLabel,
  ticketStatusLabel,
  ticketStatusStyle,
} from "@/lib/support";
import { ArrowLeft, Paperclip, X, Send, Download, LifeBuoy } from "lucide-react";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: ticket, isLoading, isError, error, refetch } = useTicket(id);
  const { mutate: reply, isPending: isReplying } = useReplyToTicket();
  const { mutate: closeTicket, isPending: isClosing } = useCloseTicket();

  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenMessages = useRef<number | null>(null);
  const { toast } = useToast();

  const messageCount = ticket?.messages?.length ?? 0;

  // Bring a newly sent reply into view, but leave the header in view on first load.
  useEffect(() => {
    if (!ticket) return;
    if (seenMessages.current !== null && messageCount > seenMessages.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    seenMessages.current = messageCount;
  }, [ticket, messageCount]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4" aria-busy="true">
        <div className="h-28 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-24 w-3/4 animate-pulse rounded-2xl bg-secondary" />
        <div className="ml-auto h-20 w-2/3 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <LifeBuoy className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">We couldn&apos;t open this ticket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isError && error?.message && !/not found|unauthori[sz]ed|forbidden/i.test(error.message)
            ? error.message
            : "It may not exist, or it belongs to another account."}
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          <Button asChild>
            <Link href="/account/support">All tickets</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";
  const trimmedBody = body.trim();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;

    const { files: next, error: fileError } = addTicketAttachments(files, picked);
    setFiles(next);
    if (fileError) {
      toast({ title: "Some files were not added", description: fileError, variant: "destructive" });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendReply = () => {
    if (isReplying || trimmedBody.length < TICKET_REPLY_MIN) return;

    const formData = new FormData();
    formData.append("body", trimmedBody);
    files.forEach(f => formData.append("attachments[]", f));

    reply({ id: ticket.id, formData }, {
      onSuccess: () => {
        setBody("");
        setFiles([]);
        toast({ title: "Reply sent", description: "Our support team has been notified." });
      },
      onError: (err) => {
        toast({ title: "Could not send reply", description: err.message || "Please try again.", variant: "destructive" });
      },
    });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    sendReply();
  };

  const handleReopen = () => {
    const formData = new FormData();
    formData.append("body", "I need to reopen this ticket.");
    reply({ id: ticket.id, formData }, {
      onSuccess: () => toast({ title: "Ticket reopened", description: "Add any details below so we can help." }),
      onError: (err) => {
        toast({ title: "Could not reopen ticket", description: err.message || "Please try again.", variant: "destructive" });
      },
    });
  };

  const handleClose = () => {
    closeTicket(ticket.id, {
      onSuccess: () => {
        setConfirmClose(false);
        toast({ title: "Ticket closed", description: "Glad we could help. You can reopen it anytime." });
      },
      onError: (err) => {
        setConfirmClose(false);
        toast({ title: "Could not close ticket", description: err.message || "Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-card sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1 shrink-0 rounded-full">
            <Link href="/account/support" aria-label="Back to support tickets">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">{ticket.reference}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ticketStatusStyle(ticket.status)}`}>
                {ticketStatusLabel(ticket.status)}
              </span>
              <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {ticketCategoryLabel(ticket.category)}
              </span>
            </div>
            <h1 className="break-words text-xl font-bold">{ticket.subject}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Created {formatDate(ticket.created_at)}</p>
          </div>
        </div>

        {!isClosed && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClose(true)}
            disabled={isClosing}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            {isClosing ? "Closing..." : "Close Ticket"}
          </Button>
        )}
      </div>

      {ticket.status === "waiting_on_customer" && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
          Our team has replied and is waiting for your response.
        </div>
      )}

      {/* Messages Thread */}
      <div className="space-y-6">
        {ticket.messages?.map((msg) => (
          <div key={msg.id} className={`flex gap-3 sm:gap-4 ${msg.is_staff_reply ? "" : "flex-row-reverse"}`}>
            <div className="shrink-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-sm ${msg.is_staff_reply ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                {(msg.user?.initial || "U").toUpperCase()}
              </div>
            </div>
            <div className={`flex min-w-0 max-w-[85%] flex-col gap-1 ${msg.is_staff_reply ? "items-start" : "items-end"}`}>
              <div className="flex flex-wrap items-baseline gap-2 px-1">
                <span className="text-sm font-semibold">{msg.is_staff_reply ? msg.user?.name || "Support" : "You"}</span>
                {msg.is_staff_reply && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">Staff</span>}
                <span className="text-[11px] text-muted-foreground">{formatDate(msg.created_at)}</span>
              </div>

              <div className={`whitespace-pre-wrap break-words rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                msg.is_staff_reply
                  ? "rounded-tl-none border bg-card text-card-foreground"
                  : "rounded-tr-none bg-primary text-primary-foreground"
              }`}>
                {msg.body}
              </div>

              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`mt-1 flex flex-wrap gap-2 ${msg.is_staff_reply ? "justify-start" : "justify-end"}`}>
                  {msg.attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="max-w-[150px] truncate font-medium">{att.original_filename}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box */}
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        {isClosed ? (
          <div className="py-4 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              This ticket is {ticket.status === "resolved" ? "resolved" : "closed"}. Still need help? Reopen it and our team will pick it up.
            </p>
            <Button variant="outline" onClick={handleReopen} disabled={isReplying}>
              {isReplying ? "Reopening..." : "Reopen Ticket"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReply}>
            <label htmlFor="ticket-reply" className="sr-only">Your reply</label>
            <Textarea
              id="ticket-reply"
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              placeholder="Type your reply here..."
              className="mb-3 resize-none border-0 bg-secondary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
              disabled={isReplying}
            />

            {files.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-2 px-2">
                {files.map((f, i) => (
                  <li key={`${f.name}-${f.size}`} className="flex items-center gap-1.5 rounded bg-secondary px-2 py-1 text-[11px]">
                    <span className="max-w-[120px] truncate font-medium">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept={TICKET_ATTACHMENT_ACCEPT} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReplying || files.length >= MAX_TICKET_ATTACHMENTS}
                className="text-muted-foreground"
              >
                <Paperclip className="mr-2 h-4 w-4" /> Add File
              </Button>
              <div className="flex items-center gap-3">
                {trimmedBody.length > 0 && trimmedBody.length < TICKET_REPLY_MIN && (
                  <span className="hidden text-xs text-muted-foreground sm:inline">At least {TICKET_REPLY_MIN} characters</span>
                )}
                <Button type="submit" size="sm" disabled={isReplying || trimmedBody.length < TICKET_REPLY_MIN} className="rounded-full px-6">
                  {isReplying ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send</>}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      <AlertDialog open={confirmClose} onOpenChange={(open) => !isClosing && setConfirmClose(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              Close it if your issue is sorted. You can reopen it later by replying if you still need help.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClosing}>Keep open</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClosing}
              onClick={(e) => {
                e.preventDefault();
                handleClose();
              }}
            >
              {isClosing ? "Closing..." : "Close ticket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
