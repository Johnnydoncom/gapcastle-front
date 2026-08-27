import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth v4 App Router handler. Next.js 16's App Router shadows Pages Router
// API routes, so `pages/api/auth/[...nextauth].ts` no longer served /api/auth/*
// (it 404'd, breaking useSession with CLIENT_FETCH_ERROR). This handler serves
// the auth routes the App-Router way.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
