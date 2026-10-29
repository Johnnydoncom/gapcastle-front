import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SESSION_MAX_AGE_SECONDS, sessionHasExpired } from "@/lib/session-policy";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const res = await fetch(`${API_URL}/auth/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
                    });

                    const resData = await res.json();
                    if (res.ok && resData.success && resData.data?.user && resData.data?.token) {
                        return {
                            id: resData.data.user.id.toString(),
                            name: resData.data.user.name,
                            email: resData.data.user.email,
                            phone: resData.data.user.phone ?? "",
                            token: resData.data.token,
                            roles: resData.data.user.roles || [],
                            permissions: resData.data.user.permissions || [],
                        };
                    }
                    return null; // authentication failed
                } catch (e) {
                    console.error(e);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.token;
                token.id = user.id;
                token.phone = user.phone;
                token.roles = user.roles;
                token.permissions = user.permissions;
                token.loginAt = Date.now();
            }
            // NextAuth renews the cookie on every read, so maxAge alone never
            // ends an active session. Throwing here makes it clear the cookie.
            // Sessions from before loginAt existed have none and end now.
            if (sessionHasExpired(token.loginAt)) {
                throw new Error("Session expired");
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.loginAt = token.loginAt as number;
            if (session.user) {
                session.user.id = token.id as string;
                session.user.phone = token.phone as string;
                session.user.roles = token.roles as string[];
                session.user.permissions = token.permissions as string[];
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: SESSION_MAX_AGE_SECONDS,
    },
    events: {
        // Revoke the API token too, so a copy of it stops working at once.
        async signOut({ token }) {
            if (!token?.accessToken) return;
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: "POST",
                    headers: { "Accept": "application/json", "Authorization": `Bearer ${token.accessToken}` },
                });
            } catch {
                // Already expired or unreachable: the API expires it anyway.
            }
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
