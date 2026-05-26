import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    token: string;
    name?: string | null;
    email?: string | null;
    roles?: string[];
    permissions?: string[];
  }

  interface Session {
    user: User;
    accessToken: string;
  }
}
