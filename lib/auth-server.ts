import { auth } from "./auth";
import { headers } from "next/headers";

/**
 * Get the current session on the server side
 * Use this in Server Components and Server Actions
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Get the current user on the server side
 * Returns null if not authenticated
 */
export async function getServerUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}

/**
 * Check if the user is authenticated on the server side
 */
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session?.user;
}
