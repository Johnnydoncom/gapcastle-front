export type TicketStatus = "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketCategory = "general" | "billing" | "technical" | "account_issue" | "transaction_dispute" | "other";

export interface TicketUser {
  id: number;
  name: string;
  email: string;
  initial?: string;
}

export interface TicketAttachment {
  id: number;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
}

export interface TicketMessage {
  id: number;
  body: string;
  is_staff_reply: boolean;
  created_at: string;
  user: TicketUser;
  attachments?: TicketAttachment[];
}

export interface Ticket {
  id: number;
  uuid: string;
  reference: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  messages_count?: number;
  user?: TicketUser;
  assignee?: TicketUser;
  latest_message?: TicketMessage;
  messages?: TicketMessage[];
}
