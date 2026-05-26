import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

/**
 * Server-side API fetching utility for Next.js Server Components.
 * Automatically handles NextAuth session passing and 401 redirects.
 */
export async function fetchServerApi(endpoint: string, options: RequestInit = {}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    redirect("/login");
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  const result = await res.json();
  return result.data || result;
}
