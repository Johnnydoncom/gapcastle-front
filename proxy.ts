import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionHasExpired } from "@/lib/session-policy";

const SESSION_COOKIES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

/**
 * Guards /account only. Every match costs a function invocation on Vercel,
 * so /login and /signup are left out: the proxy did nothing for them, but
 * marketing pages prefetch both on every view.
 */
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // getToken() only decodes the cookie, skipping the jwt callback that
  // enforces the session limit, so check it here too.
  if (sessionHasExpired(token.loginAt)) {
    const res = NextResponse.redirect(new URL("/login?reason=expired", req.url));
    SESSION_COOKIES.forEach((name) => res.cookies.delete(name));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
