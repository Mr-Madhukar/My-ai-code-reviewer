/**
 * Cancels an active Razorpay Pro subscription.
 *
 * Razorpay stops future charges; the user keeps Pro until the current billing
 * period ends (handled in `getUserSubscription` via `subscriptionRenewsAt`).
 *
 * @module features/billing/server/cancel-subscription
 */

import "server-only";

import { getRazorpay } from "@/features/billing/lib/razorpay";
import { prisma } from "@/lib/db";
import { getActiveWorkspaceForUser } from "./workspace-helper";

/**
 * Cancels the user's active workspace Razorpay subscription and marks it canceled in our database.
 *
 * @param userId - The user requesting cancellation.
 * @returns Resolves when Razorpay and our DB are updated.
 * @throws If the user's workspace has no `razorpaySubscriptionId` on file.
 */
export async function cancelProSubscription(userId: string) {
  const workspace = await getActiveWorkspaceForUser(userId);

  if (!workspace?.razorpaySubscriptionId) {
    throw new Error("No active subscription found.");
  }

  const razorpay = getRazorpay();
  // `cancel_at_cycle_end: 1` — user keeps access until the period they already paid for.
  await razorpay.subscriptions.cancel(workspace.razorpaySubscriptionId, 1);

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { subscriptionStatus: "canceled" },
  });
}

