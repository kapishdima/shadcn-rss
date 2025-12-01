import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

// Export commonly used hooks and methods
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
