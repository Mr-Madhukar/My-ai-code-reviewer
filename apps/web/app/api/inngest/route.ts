/**
 * Inngest serve endpoint — the worker runtime for background jobs.
 *
 * Inngest's cloud (or dev server) POSTs to this route to execute registered
 * functions step-by-step. All ShipFlow workflow functions are registered here:
 *
 * Legacy (features/):
 *   - reviewPullRequest — webhook-triggered PR review with Pinecone context
 *   - syncRepoCodebase  — on-demand full-repo indexing
 *   - processTask       — scaffold / example function
 *
 * ShipFlow Workflow (@shipflow/inngest):
 *   - generatePrd       — AI-powered PRD generation from feature request
 *   - generateTasks     — AI-powered task decomposition from PRD
 *   - reviewPullRequestV2 — PRD-aware AI code review
 *   - checkReleaseReadiness — Evaluate if feature is ready for human approval
 *   - clarifyFeatureRequest — AI clarification agent for gathering requirements
 *   - reReviewPullRequest   — Re-review after fixes
 */
import { inngest } from "@/features/inngest/client";
import { syncRepoCodebase } from "@/features/repo-sync/server/sync-repo-function";
import { reviewPullRequest } from "@/features/reviews/server/review-pr-function";
import { serve } from "inngest/next";
import { processTask } from "./function";

// Import new ShipFlow workflow functions
import { generatePrd } from "@/features/workflows/generate-prd";
import { generateTasks } from "@/features/workflows/generate-tasks";
import { clarifyFeatureRequest } from "@/features/workflows/clarify-feature";
import { reReviewPullRequest } from "@/features/workflows/re-review-pr";
import { checkReleaseReadiness } from "@/features/workflows/release-readiness";

/**
 * Next.js route handlers that Inngest uses to run and manage functions.
 *
 * @returns HTTP method handlers (`GET`, `POST`, `PUT`) for the Inngest platform
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Legacy features
    processTask,
    reviewPullRequest,
    syncRepoCodebase,
    // ShipFlow core workflow
    generatePrd,
    generateTasks,
    clarifyFeatureRequest,
    reReviewPullRequest,
    checkReleaseReadiness,
  ],
});
