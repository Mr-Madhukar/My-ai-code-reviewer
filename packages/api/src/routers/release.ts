/**
 * Release Router
 *
 * Human approval and release management for feature requests.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, workspaceProcedure } from "../trpc";
import { db, featureRequestRepo } from "@shipflow/db";

export const releaseRouter = createTRPCRouter({
  /** Get the release record for a feature request. */
  getByFeatureRequest: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), featureRequestId: z.string() }))
    .query(async ({ input }) => {
      return db.release.findUnique({
        where: { featureRequestId: input.featureRequestId },
      });
    }),

  /** Approve a feature for release (human approval). */
  approve: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        featureRequestId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the feature is in human_review state
      const status = await featureRequestRepo.getStatus(input.featureRequestId);
      if (status !== "human_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Feature must be in 'human_review' state to approve. Current: ${status}`,
        });
      }

      // Create or update the release record
      const release = await db.release.upsert({
        where: { featureRequestId: input.featureRequestId },
        create: {
          featureRequestId: input.featureRequestId,
          approvedBy: ctx.user.id,
          status: "approved",
          notes: input.notes,
          decidedAt: new Date(),
        },
        update: {
          approvedBy: ctx.user.id,
          status: "approved",
          notes: input.notes,
          decidedAt: new Date(),
        },
      });

      // Transition feature to shipped
      await featureRequestRepo.transitionStatus(input.featureRequestId, "shipped");

      return release;
    }),

  /** Reject a feature release (send back for fixes). */
  reject: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        featureRequestId: z.string(),
        notes: z.string().min(10, "Please provide a reason for rejection"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const status = await featureRequestRepo.getStatus(input.featureRequestId);
      if (status !== "human_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Feature must be in 'human_review' state to reject. Current: ${status}`,
        });
      }

      const release = await db.release.upsert({
        where: { featureRequestId: input.featureRequestId },
        create: {
          featureRequestId: input.featureRequestId,
          approvedBy: ctx.user.id,
          status: "rejected",
          notes: input.notes,
          decidedAt: new Date(),
        },
        update: {
          approvedBy: ctx.user.id,
          status: "rejected",
          notes: input.notes,
          decidedAt: new Date(),
        },
      });

      // Send back to fix-needed state
      await featureRequestRepo.transitionStatus(input.featureRequestId, "fix_needed");

      return release;
    }),
});
