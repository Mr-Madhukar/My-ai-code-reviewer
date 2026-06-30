/**
 * @module lib/actions/billing
 * @description Server Actions for Pro subscription billing.
 *
 * Wraps Stripe (or billing provider) logic from `features/billing/` so Client
 * Components can upgrade or cancel plans without exposing secret keys. Every
 * action checks the session first — billing changes always require a logged-in user.
 */

"use server";

import { cancelProSubscription } from "@/features/billing/server/cancel-subscription";
import { createProSubscription } from "@/features/billing/server/create-subscription";
import { getActiveWorkspaceForUser } from "@/features/billing/server/workspace-helper";
import { getRazorpay } from "@/features/billing/lib/razorpay";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";
import { redirect } from "next/navigation";

/**
 * Creates a Pro checkout session (or equivalent) for the current user.
 *
 * @description Returns whatever the billing layer needs for the client — often a
 * Stripe Checkout URL or session ID for redirect. Guests are sent to sign-in.
 * @returns Checkout payload from {@link createProSubscription} (shape depends on billing setup).
 */
export async function startProSubscription() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return createProSubscription(session.user.id);
}

/**
 * Cancels the current user's Pro subscription at period end (or immediately per provider rules).
 *
 * @description Does not return data to the client; the UI typically revalidates or
 * refreshes subscription state after this action completes.
 * @returns Resolves when cancellation has been recorded with the payment provider.
 */
export async function cancelSubscription() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  await cancelProSubscription(session.user.id);
}

/**
 * Verifies Razorpay payment signature and activates the Pro plan directly.
 *
 * @description Called by the client-side checkout handler upon successful payment.
 * Ensures the subscription changes to Pro instantly.
 */
export async function verifyProSubscription(payload: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}) {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("Razorpay is not configured on the server.");
  }

  // 1. Generate expected signature
  const text = `${payload.razorpay_subscription_id}|${payload.razorpay_payment_id}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(text)
    .digest("hex");

  // 2. Compare signature
  if (expectedSignature !== payload.razorpay_signature) {
    throw new Error("Signature verification failed. Invalid transaction signature.");
  }

  // 3. Find active workspace
  const workspace = await getActiveWorkspaceForUser(session.user.id);
  if (!workspace) {
    throw new Error("No active workspace found.");
  }

  // 4. Fetch subscription current end date from Razorpay
  const razorpay = getRazorpay();
  let renewalDate: Date | null = null;
  try {
    const sub = await razorpay.subscriptions.fetch(payload.razorpay_subscription_id);
    if (sub.current_end) {
      renewalDate = new Date(sub.current_end * 1000);
    }
  } catch (error) {
    console.error("[verifyProSubscription] Failed to fetch subscription renewal date:", error);
  }

  if (!renewalDate) {
    // Fallback: 30 days from now
    renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // 5. Update workspace plan to Pro
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      plan: "pro",
      razorpaySubscriptionId: payload.razorpay_subscription_id,
      subscriptionStatus: "active",
      subscriptionRenewsAt: renewalDate,
    },
  });

  return { success: true };
}
