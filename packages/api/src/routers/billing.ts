/**
 * Billing Router
 *
 * Workspace-level billing management with Razorpay.
 */

import { z } from "zod";
import { createTRPCRouter, workspaceProcedure, adminProcedure } from "../trpc";
import { workspaceRepo } from "@shipflow/db";

export const billingRouter = createTRPCRouter({
  /** Get billing info for the active workspace. */
  getStatus: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const workspace = await workspaceRepo.findById(input.workspaceId);
      if (!workspace) return null;

      return {
        plan: workspace.plan,
        subscriptionStatus: workspace.subscriptionStatus,
        subscriptionRenewsAt: workspace.subscriptionRenewsAt,
        aiReviewCredits: workspace.aiReviewCredits,
        repoLimit: workspace.repoLimit,
      };
    }),

  /** Initiate a subscription upgrade (returns Razorpay checkout data). */
  createCheckout: adminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        planId: z.enum(["pro", "enterprise"]),
      })
    )
    .mutation(async ({ input }) => {
      // Razorpay integration will create a subscription here
      // For now, return a placeholder — actual implementation uses Razorpay SDK
      return {
        subscriptionId: `sub_placeholder_${input.workspaceId}`,
        planId: input.planId,
        // The frontend will use this to open Razorpay checkout
      };
    }),

  /** Cancel the current subscription. */
  cancelSubscription: adminProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ input }) => {
      return workspaceRepo.updateBilling(input.workspaceId, {
        subscriptionStatus: "cancelled",
      });
    }),
});
