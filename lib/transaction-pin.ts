import { signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

/** Why the API refused a PIN-protected request. */
export type PinErrorCode = "pin_required" | "pin_not_set" | "pin_invalid" | "pin_locked";

export interface PinStatus {
  has_pin: boolean;
  /** ISO time the lockout ends, while locked. */
  locked_until: string | null;
}

/**
 * A withdrawal or wallet payment refused at the PIN check. Thrown back to the
 * PIN dialog, which keeps itself open to show it rather than closing.
 */
export class TransactionPinError extends Error {
  constructor(
    message: string,
    public code: PinErrorCode,
    public lockedUntil: string | null = null,
  ) {
    super(message);
    this.name = "TransactionPinError";
  }
}

/** The API's response envelope, as far as these helpers read it. */
interface ApiBody {
  code?: unknown;
  message?: string;
  locked_until?: string | null;
  errors?: Record<string, string[]>;
  data?: unknown;
}

/** Throw a TransactionPinError when a response body is a PIN refusal. */
export function assertPinAccepted(body: ApiBody | null | undefined) {
  const code = body?.code;
  if (typeof code === "string" && code.startsWith("pin_")) {
    throw new TransactionPinError(body?.message || "Transaction PIN error.", code as PinErrorCode, body?.locked_until ?? null);
  }
}

/**
 * Call a /transaction-pin endpoint. Throws an Error carrying the API's first
 * validation message (wrong password, invalid code, weak PIN) when refused.
 */
export async function pinRequest<T = unknown>(
  token: string,
  path: "" | "/forgot" | "/reset",
  method: "GET" | "POST" | "PUT" = "GET",
  body?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${API_URL}/transaction-pin${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data: ApiBody | null = await res.json().catch(() => null);

  if (res.status === 401) {
    if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    assertPinAccepted(data);
    const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
    throw new Error(firstFieldError || data?.message || "Something went wrong. Please try again.");
  }

  return (data?.data ?? data) as T;
}
