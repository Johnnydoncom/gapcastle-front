import type { TicketCategory, TicketPriority, TicketStatus } from "@/types/support";

/** Mirrors the API's TicketCategory enum labels. */
export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "general", label: "General Enquiry" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical Issue" },
  { value: "account_issue", label: "Account Issue" },
  { value: "transaction_dispute", label: "Transaction Dispute" },
  { value: "other", label: "Other" },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_customer: "Awaiting Your Reply",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  waiting_on_customer: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-700",
};

export const ticketCategoryLabel = (category: string) =>
  TICKET_CATEGORIES.find((c) => c.value === category)?.label ?? category.replace(/_/g, " ");

export const ticketStatusLabel = (status: string) =>
  TICKET_STATUS_LABELS[status as TicketStatus] ?? status.replace(/_/g, " ");

export const ticketStatusStyle = (status: string) =>
  TICKET_STATUS_STYLES[status as TicketStatus] ?? TICKET_STATUS_STYLES.closed;

/** Same limits the API enforces (StoreTicketRequest / ReplyTicketRequest). */
export const TICKET_SUBJECT_MAX = 150;
export const TICKET_BODY_MIN = 10;
export const TICKET_REPLY_MIN = 5;
export const MAX_TICKET_ATTACHMENTS = 5;
export const MAX_TICKET_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const TICKET_ATTACHMENT_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "txt", "doc", "docx"];
export const TICKET_ATTACHMENT_ACCEPT = TICKET_ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");

/**
 * Adds newly picked files to the current list, rejecting any the API would
 * refuse, so the customer learns about it before submitting.
 */
export function addTicketAttachments(current: File[], picked: File[]): { files: File[]; error?: string } {
  const accepted: File[] = [];
  const problems: string[] = [];

  for (const file of picked) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!TICKET_ATTACHMENT_EXTENSIONS.includes(ext)) {
      problems.push(`${file.name} is not a supported file type.`);
    } else if (file.size > MAX_TICKET_ATTACHMENT_BYTES) {
      problems.push(`${file.name} is larger than 5MB.`);
    } else if (current.some((f) => f.name === file.name && f.size === file.size)) {
      continue;
    } else {
      accepted.push(file);
    }
  }

  const room = MAX_TICKET_ATTACHMENTS - current.length;
  if (accepted.length > room) {
    problems.push(`You can attach up to ${MAX_TICKET_ATTACHMENTS} files.`);
  }

  return {
    files: [...current, ...accepted.slice(0, Math.max(room, 0))],
    error: problems.length ? problems.join(" ") : undefined,
  };
}

export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
