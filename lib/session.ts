import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * The NextAuth session for the current request, decoded once. The account
 * layout and every fetchServerApi() call in its page share this result
 * instead of each decrypting the JWT cookie again, which saves CPU time on
 * every /account render.
 */
export const getCurrentSession = cache(() => getServerSession(authOptions));
