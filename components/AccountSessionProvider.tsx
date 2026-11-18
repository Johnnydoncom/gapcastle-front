"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

/**
 * Session context for the signed-in area only.
 *
 * It is seeded with the session the server layout already read, so the
 * browser does not call /api/auth/session on load, and it does not refetch
 * on every tab focus. SessionTimeout and the API's own 401s already end
 * expired sessions. Public pages render without it, so anonymous visitors
 * never call the auth endpoint.
 */
export function AccountSessionProvider({ session, children }: { session: Session; children: React.ReactNode }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
