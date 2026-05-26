"use client";
import { useState, useRef, useEffect, use } from "react";
import { useTicket, useReplyToTicket, useCloseTicket } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { ArrowLeft, Paperclip, X, Send, Download } from "lucide-react";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { data: ticket, isLoading } = useTicket(id);
  const { mutate: reply, isPending: isReplying } = useReplyToTicket();
  const { mutate: closeTicket, isPending: isClosing } = useCloseTicket();
  
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const isClosed = ticket?.status === "closed" || ticket?.status === "resolved";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="py-12 text-center text-sm text-destructive">Ticket not found or you don't have access.</div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        toast({ title: "Too many files", description: "Max 5 files allowed.", variant: "destructive" });
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (body.length < 5) return;

    const formData = new FormData();
    formData.append("body", body);
    files.forEach(f => formData.append("attachments[]", f));

    reply({ id: ticket.id, formData }, {
      onSuccess: () => {
        setBody("");
        setFiles([]);
        toast({ title: "Reply sent" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to send reply.", variant: "destructive" });
      }
    });
  };

  const handleClose = () => {
    if (confirm("Are you sure you want to close this ticket?")) {
      closeTicket(ticket.id, {
        onSuccess: () => toast({ title: "Ticket closed" }),
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="shrink-0 rounded-2xl border bg-card p-6 shadow-card flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex gap-4 items-start">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full mt-1 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">{ticket.reference}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                ticket.status === 'waiting_on_customer' ? 'bg-purple-100 text-purple-700' :
                ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {ticket.status.replace(/_/g, ' ')}
              </span>
              <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {ticket.category.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground mt-1">Created {formatDate(ticket.created_at)}</p>
          </div>
        </div>
        
        {!isClosed && (
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isClosing} className="text-muted-foreground hover:text-destructive shrink-0">
            {isClosing ? "Closing..." : "Mark as Resolved"}
          </Button>
        )}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {ticket.messages?.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.is_staff_reply ? '' : 'flex-row-reverse'}`}>
            <div className="shrink-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-sm ${msg.is_staff_reply ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                {msg.user.initial || 'U'}
              </div>
            </div>
            <div className={`flex max-w-[85%] flex-col gap-1 ${msg.is_staff_reply ? 'items-start' : 'items-end'}`}>
              <div className="flex items-baseline gap-2 px-1">
                <span className="text-sm font-semibold">{msg.user.name}</span>
                {msg.is_staff_reply && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">Staff</span>}
                <span className="text-[11px] text-muted-foreground">{formatDate(msg.created_at)}</span>
              </div>
              
              <div className={`rounded-2xl px-5 py-3.5 shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                msg.is_staff_reply 
                  ? 'bg-card border rounded-tl-none text-card-foreground' 
                  : 'bg-primary text-primary-foreground rounded-tr-none'
              }`}>
                {msg.body}
              </div>

              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`mt-1 flex flex-wrap gap-2 ${msg.is_staff_reply ? 'justify-start' : 'justify-end'}`}>
                  {msg.attachments.map(att => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" 
                       className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                         msg.is_staff_reply ? 'bg-card hover:bg-accent text-foreground' : 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20'
                       }`}>
                      <Download className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[150px] font-medium">{att.original_filename}</span>
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
      <div className="shrink-0 rounded-2xl border bg-card p-4 shadow-card">
        {isClosed ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">This ticket has been marked as resolved or closed.</p>
            <Button variant="outline" onClick={() => reply({ id: ticket.id, formData: (() => { const fd = new FormData(); fd.append("body", "I need to reopen this ticket."); return fd; })() })}>
              Reopen Ticket
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReply}>
            <Textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Type your reply here..." 
              className="resize-none border-0 bg-secondary/50 focus-visible:ring-0 focus-visible:ring-offset-0 mb-3" 
              rows={3} 
            />
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded bg-secondary px-2 py-1 text-[11px]">
                    <span className="truncate max-w-[120px] font-medium">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.doc" />
              <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={files.length >= 5} className="text-muted-foreground">
                <Paperclip className="mr-2 h-4 w-4" /> Add File
              </Button>
              <Button type="submit" size="sm" disabled={isReplying || body.length < 5} className="px-6 rounded-full">
                {isReplying ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send</>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
