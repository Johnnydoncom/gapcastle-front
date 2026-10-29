import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionHasExpired } from "@/lib/session-policy";

const SESSION_COOKIES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isProtectedRoute = pathname.startsWith("/account");

  // if (isAuthRoute && token) {
  //   return NextResponse.redirect(new URL("/account", req.url));
  // }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // getToken() only decodes the cookie, skipping the jwt callback that
  // enforces the 12-hour limit, so check it here too.
  if (isProtectedRoute && token && sessionHasExpired(token.loginAt)) {
    const res = NextResponse.redirect(new URL("/login?reason=expired", req.url));
    SESSION_COOKIES.forEach((name) => res.cookies.delete(name));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/login", "/signup"],
};
