/**
 * tRPC Initialization
 *
 * Sets up the tRPC instance with:
 * - Context creation (session + workspace scoping)
 * - Middleware layers (auth, workspace membership, admin)
 * - Procedure builders (publicProcedure, protectedProcedure, workspaceProcedure)
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { db, workspaceRepo } from "@shipflow/db";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateContextOptions {
  /** The authenticated user, or null for public routes. */
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  /** The active workspace id from the session, if set. */
  activeWorkspaceId?: string | null;
}

/**
 * Creates the tRPC context from the incoming request.
 * This function is called for every tRPC request.
 */
export function createTRPCContext(opts: CreateContextOptions) {
  return {
    db,
    user: opts.user,
    activeWorkspaceId: opts.activeWorkspaceId,
  };
}

export type Context = ReturnType<typeof createTRPCContext>;

// ─────────────────────────────────────────────────────────────────────────────
// tRPC Instance
// ─────────────────────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

/** Enforces that the user is authenticated. */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const enforceWorkspaceMembership = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const rawInput = (opts as any).rawInput;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
  }

  // Extract workspaceId from input or context
  const parsed = z.object({ workspaceId: z.string().optional() }).safeParse(rawInput);
  const workspaceId = parsed.success ? parsed.data.workspaceId : undefined;
  const resolvedWorkspaceId = workspaceId ?? ctx.activeWorkspaceId;

  if (!resolvedWorkspaceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No workspace selected. Please select or create a workspace.",
    });
  }

  // Verify membership
  const isMember = await workspaceRepo.isMember(resolvedWorkspaceId, ctx.user.id);
  if (!isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this workspace.",
    });
  }

  const role = await workspaceRepo.getMemberRole(resolvedWorkspaceId, ctx.user.id);

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      workspaceId: resolvedWorkspaceId,
      workspaceRole: role,
    },
  });
});

/** Enforces admin or owner role within the workspace. */
const enforceWorkspaceAdmin = enforceWorkspaceMembership.unstable_pipe(
  async ({ ctx, next }) => {
    if (ctx.workspaceRole !== "admin" && ctx.workspaceRole !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required for this action.",
      });
    }
    return next({ ctx });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Procedure Builders
// ─────────────────────────────────────────────────────────────────────────────

/** Public procedure — no auth required. */
export const publicProcedure = t.procedure;

/** Protected procedure — requires authenticated user. */
export const protectedProcedure = t.procedure.use(enforceAuth);

/** Workspace procedure — requires auth + workspace membership. */
export const workspaceProcedure = t.procedure.use(enforceWorkspaceMembership);

/** Admin procedure — requires auth + workspace admin/owner role. */
export const adminProcedure = t.procedure.use(enforceWorkspaceAdmin);
