import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { AccountShell } from "@/components/AccountShell";
import { AccountSessionProvider } from "@/components/AccountSessionProvider";

export const dynamic = "force-dynamic";

/**
 * Server component: guards the whole /account area with a server-side session
 * check (no client loading flash, and unauthenticated/expired sessions are
 * redirected to /login before any UI renders). All interactive chrome lives in
 * the client <AccountShell>.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AccountSessionProvider session={session}>
      <AccountShell user={session.user}>{children}</AccountShell>
    </AccountSessionProvider>
  );
}
