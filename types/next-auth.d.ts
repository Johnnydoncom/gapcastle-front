import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    token: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    roles?: string[];
    permissions?: string[];
  }

  interface Session {
    user: User;
    accessToken: string;
    /** Epoch ms of sign-in; the session ends SESSION_MAX_AGE_SECONDS later. */
    loginAt: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    loginAt?: number;
  }
}
