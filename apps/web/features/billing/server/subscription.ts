/**
 * Reads a user's subscription plan and status from the database.
 *
 * Razorpay webhooks update raw fields (`plan`, `subscriptionStatus`, `subscriptionRenewsAt`).
 * This module translates those into a clean `UserSubscription` object for the UI.
 *
 * @module features/billing/server/subscription
 */

import "server-only";

import type {
  SubscriptionPlan,
  UserSubscription,
} from "@/features/dashboard/lib/types";
import { prisma } from "@/lib/db";
import { getReviewsThisMonth } from "./usage";
import { getActiveWorkspaceForUser } from "./workspace-helper";

/** Normalizes the string stored in Prisma to our `SubscriptionPlan` union. */
function getPlanFromDb(plan: string): SubscriptionPlan {
  if (plan === "pro") {
    return "pro";
  }
  return "free";
}

/**
 * Maps database subscription fields to a user-facing status.
 *
 * Pro users who canceled but are still inside the paid period stay `active`
 * until `subscriptionRenewsAt` passes — they keep Pro features until then.
 */
function getStatusFromDb(
  plan: SubscriptionPlan,
  subscriptionStatus: string | null,
  subscriptionRenewsAt: Date | null
): UserSubscription["status"] {
  if (plan !== "pro") {
    return "active";
  }

  if (subscriptionStatus === "canceled") {
    if (subscriptionRenewsAt && subscriptionRenewsAt > new Date()) {
      return "active";
    }
    return "canceled";
  }

  if (subscriptionStatus === "pending") {
    return "trialing";
  }

  if (subscriptionStatus === "active") {
    return "active";
  }

  return "canceled";
}

/** Pro features only apply when plan is pro AND status is still active. */
function getEffectivePlan(
  plan: SubscriptionPlan,
  status: UserSubscription["status"]
): SubscriptionPlan {
  if (plan === "pro" && status === "active") {
    return "pro";
  }

  return "free";
}

/**
 * Loads the current subscription snapshot for a user's active workspace.
 *
 * @param userId - The user whose plan and renewal date we need.
 * @returns `UserSubscription` with effective plan, status, and optional `renewsAt` ISO string.
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  const workspace = await getActiveWorkspaceForUser(userId);

  if (!workspace) {
    return {
      plan: "free",
      status: "active",
      renewsAt: null,
      usage: {
        reviewsUsed: 0,
        reposConnected: 0,
      },
    };
  }

  const dbPlan = getPlanFromDb(workspace.plan);
  const status = getStatusFromDb(
    dbPlan,
    workspace.subscriptionStatus,
    workspace.subscriptionRenewsAt
  );
  const plan = getEffectivePlan(dbPlan, status);

  let renewsAt: string | null = null;
  if (workspace.subscriptionRenewsAt) {
    renewsAt = workspace.subscriptionRenewsAt.toISOString();
  }

  // Fetch usage statistics
  const reviewsUsed = await getReviewsThisMonth(userId);
  const reposConnected = await prisma.project.count({
    where: {
      workspaceId: workspace.id,
      repoFullName: { not: null },
    },
  });

  return {
    plan,
    status,
    renewsAt,
    usage: {
      reviewsUsed,
      reposConnected,
    },
  };
}
