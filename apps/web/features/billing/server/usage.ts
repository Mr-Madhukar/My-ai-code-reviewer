/**
 * Tracks how many AI reviews a user has used and whether they can start another.
 *
 * Free plan: capped per month (`FREE_MONTHLY_LIMIT`).
 * Pro plan: unlimited reviews while subscription status is active.
 *
 * @module features/billing/server/usage
 */

import { FREE_MONTHLY_LIMIT, getMonthStart } from "@/features/billing/lib/limits";
import { prisma } from "@/lib/db";

/** Review count plus optional limit for display on the settings page. */
export type UsageSummary = {
  used: number;
  /** `null` means unlimited (Pro). A number means the free-tier monthly cap. */
  limit: number | null;
};

import { getActiveWorkspaceForUser } from "./workspace-helper";

/**
 * Counts completed AI reviews for the user's active workspace this month.
 *
 * Only reviews with `status: "completed"` and `createdAt` in the current month count.
 *
 * @param userId - The user whose usage we are measuring.
 * @returns Number of reviews used this month.
 */
export async function getReviewsThisMonth(userId: string): Promise<number> {
  const workspace = await getActiveWorkspaceForUser(userId);

  if (!workspace) {
    return 0;
  }

  return prisma.review.count({
    where: {
      reviewType: "ai",
      status: "completed",
      createdAt: { gte: getMonthStart() },
      pullRequest: {
        project: {
          workspaceId: workspace.id,
        },
      },
    },
  });
}

/**
 * Decides whether the user is allowed to trigger another AI review right now.
 *
 * Called from the GitHub webhook handler before enqueueing a review job.
 *
 * @param userId - The user who owns the GitHub installation.
 * @returns `true` if Pro (active) or free tier still has quota remaining.
 */
export async function canUserReview(userId: string): Promise<boolean> {
  const workspace = await getActiveWorkspaceForUser(userId);
  if (!workspace) {
    return false;
  }

  // Pro with an active subscription — no monthly cap.
  if (workspace.plan === "pro" && workspace.subscriptionStatus === "active") {
    return true;
  }

  const used = await getReviewsThisMonth(userId);
  return used < FREE_MONTHLY_LIMIT;
}

/**
 * Builds usage numbers for the settings UI (used + limit).
 *
 * @param userId - The user viewing their settings.
 * @returns `{ used, limit }` where `limit` is `null` for unlimited Pro.
 */
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const workspace = await getActiveWorkspaceForUser(userId);
  const used = await getReviewsThisMonth(userId);

  if (workspace && workspace.plan === "pro" && workspace.subscriptionStatus === "active") {
    return { used, limit: null };
  }

  return { used, limit: FREE_MONTHLY_LIMIT };
}
