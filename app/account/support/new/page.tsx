"use client";
import { useState, useRef } from "react";
import { useCreateTicket } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Paperclip, X } from "lucide-react";

export default function NewTicketPage() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: createTicket, isPending } = useCreateTicket();
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        toast({ title: "Too many files", description: "You can only attach up to 5 files.", variant: "destructive" });
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !category || body.length < 10) {
      toast({ title: "Validation Error", description: "Please fill in all required fields. Message must be at least 10 characters.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("category", category);
    formData.append("priority", priority);
    formData.append("body", body);
    files.forEach(f => formData.append("attachments[]", f));

    createTicket(formData, {
      onSuccess: (res) => {
        toast({ title: "Ticket Created", description: "Your support ticket has been submitted successfully." });
        router.push(`/app/support/${res.data.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to create ticket.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Open New Ticket</h1>
          <p className="text-sm text-muted-foreground">Please describe your issue in detail.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 sm:flex sm:gap-4 sm:space-y-0">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Category <span className="text-destructive">*</span></label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Enquiry</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="account_issue">Account Issue</SelectItem>
                  <SelectItem value="transaction_dispute">Transaction Dispute</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject <span className="text-destructive">*</span></label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of the issue" required maxLength={150} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message <span className="text-destructive">*</span></label>
            <Textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Please provide as much detail as possible..." 
              rows={6} 
              required 
              minLength={10} 
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Attachments (Optional)</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
              accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.doc" 
            />
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border bg-secondary/50 px-3 py-1.5 text-xs">
                    <span className="truncate max-w-[150px]">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={files.length >= 5}
              className="w-full sm:w-auto"
            >
              <Paperclip className="mr-2 h-4 w-4" /> Add Files
            </Button>
            <p className="text-xs text-muted-foreground">Max 5 files. Supported: JPG, PNG, PDF, TXT, DOCX (up to 5MB each).</p>
          </div>

          <div className="flex justify-end border-t pt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="mr-2">Cancel</Button>
            <Button type="submit" disabled={isPending || !subject || !category || body.length < 10}>
              {isPending ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
