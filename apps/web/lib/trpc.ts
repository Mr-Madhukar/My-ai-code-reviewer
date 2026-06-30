/**
 * tRPC Client Configuration
 *
 * Creates the tRPC React Query hooks for use in client components.
 * Uses httpBatchLink for efficient request batching.
 */

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@shipflow/api";

/** tRPC React hooks — use `trpc.workspace.list.useQuery()` etc. */
export const trpc = createTRPCReact<AppRouter>() as any;

/** Creates tRPC client links. Called once in the TRPCProvider. */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  });
}
