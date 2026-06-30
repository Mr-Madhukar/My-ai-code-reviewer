/**
 * Dashboard Overview page (`/dashboard`).
 *
 * Server component that loads aggregated overview data and renders stat cards
 * plus recent AI review activity.
 */

import type { Metadata } from "next";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { OverviewContent } from "@/features/dashboard/components/overview-content";
import { getOverview } from "@/features/overview/server/get-overview";
import type { OverviewData } from "@/features/overview/types/overview";
import { requireAuth } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Overview · Dashboard",
};

/** Fallback overview shown when the data fetch fails. */
const FALLBACK_OVERVIEW: OverviewData = {
  installation: { connected: false, accountLogin: null, installedAt: null },
  reviewsUsed: 0,
  reviewsLimit: 5,
  plan: "free",
  recentActivity: [],
  repos: null,
};

/**
 * Default dashboard landing page with summary stats and activity feed.
 *
 * @returns Overview header and content for the signed-in user.
 */
export default async function DashboardOverviewPage() {
  const session = await requireAuth();

  let overview: OverviewData;

  try {
    overview = await getOverview(session.user.id);
  } catch (error) {
    console.error(
      "[DashboardOverviewPage] Failed to load overview for user:",
      session.user.id,
      error,
    );
    overview = FALLBACK_OVERVIEW;
  }

  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Summary of reviews and connected repositories."
      />
      <OverviewContent overview={overview} />
    </>
  );
}

