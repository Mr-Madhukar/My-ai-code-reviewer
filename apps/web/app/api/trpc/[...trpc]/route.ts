/**
 * tRPC HTTP Handler
 *
 * Next.js route handler that serves all tRPC requests at /api/trpc/[...trpc].
 * Extracts the session from the request and builds the tRPC context.
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@shipflow/api";
import { auth } from "@shipflow/auth";
import { headers } from "next/headers";

const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      // Get the current session from BetterAuth
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      return createTRPCContext({
        user: session?.user
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }
          : null,
        activeWorkspaceId: (session?.session as Record<string, unknown>)?.activeOrganizationId as string | null,
      });
    },
  });
};

export { handler as GET, handler as POST };
