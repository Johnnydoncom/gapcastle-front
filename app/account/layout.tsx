import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountShell } from "@/components/AccountShell";

export const dynamic = "force-dynamic";

/**
 * Server component: guards the whole /account area with a server-side session
 * check (no client loading flash, and unauthenticated/expired sessions are
 * redirected to /login before any UI renders). All interactive chrome lives in
 * the client <AccountShell>.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <AccountShell user={session.user}>{children}</AccountShell>;
}
