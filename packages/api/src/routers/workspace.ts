/**
 * Workspace Router
 *
 * CRUD operations for workspaces (multi-tenant organizations).
 */

import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  workspaceProcedure,
  adminProcedure,
} from "../trpc";
import { workspaceRepo } from "@shipflow/db";

export const workspaceRouter = createTRPCRouter({
  /** Create a new workspace. The caller becomes the owner. */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
        slug: z
          .string()
          .min(2)
          .max(30)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return workspaceRepo.create({
        name: input.name,
        slug: input.slug,
        creatorUserId: ctx.user.id,
      });
    }),

  /** List all workspaces the current user belongs to. */
  list: protectedProcedure.query(async ({ ctx }) => {
    return workspaceRepo.listByUserId(ctx.user.id);
  }),

  /** Get a single workspace by slug. */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return workspaceRepo.findBySlug(input.slug);
    }),

  /** Get the current active workspace. */
  getCurrent: workspaceProcedure.query(async ({ ctx }) => {
    return workspaceRepo.findById(ctx.workspaceId);
  }),

  /** Update workspace details (admin only). */
  update: adminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(2).max(50).optional(),
        slug: z.string().min(2).max(30).optional(),
        logo: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, ...data } = input;
      return workspaceRepo.update(workspaceId, data);
    }),

  /** Invite a member (admin only). */
  addMember: adminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
        role: z.enum(["member", "admin"]).default("member"),
      })
    )
    .mutation(async ({ input }) => {
      return workspaceRepo.addMember(input.workspaceId, input.userId, input.role);
    }),

  /** Remove a member (admin only). */
  removeMember: adminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return workspaceRepo.removeMember(input.workspaceId, input.userId);
    }),
});
