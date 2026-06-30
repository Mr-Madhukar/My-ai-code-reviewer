/**
 * Root tRPC Router
 *
 * Merges all feature-specific routers into a single app router.
 * This is the type that the frontend tRPC client uses.
 */

import { createTRPCRouter, createCallerFactory } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { projectRouter } from "./routers/project";
import { featureRequestRouter } from "./routers/feature-request";
import { prdRouter } from "./routers/prd";
import { taskRouter } from "./routers/task";
import { reviewRouter } from "./routers/review";
import { releaseRouter } from "./routers/release";
import { billingRouter } from "./routers/billing";

export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  project: projectRouter,
  featureRequest: featureRequestRouter,
  prd: prdRouter,
  task: taskRouter,
  review: reviewRouter,
  release: releaseRouter,
  billing: billingRouter,
});

/** The type of the root router — used for client-side type inference. */
export type AppRouter = typeof appRouter;

/** Server-side caller factory for calling tRPC procedures from server code. */
export const createCaller = createCallerFactory(appRouter);

// Re-export context and procedure types for consumers
export { createTRPCContext, type CreateContextOptions } from "./trpc";
