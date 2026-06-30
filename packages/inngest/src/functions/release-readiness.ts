/**
 * Release Readiness Check — Inngest Function
 *
 * Evaluates whether a feature is ready for human approval by checking:
 * - PRD completeness
 * - All tasks completed
 * - AI review passed (no unresolved blocking issues)
 */

import { inngest } from "../client";
import { featureRequestRepo, prdRepo, reviewRepo, db } from "@shipflow/db";

export const checkReleaseReadiness = inngest.createFunction(
  {
    id: "check-release-readiness",
    retries: 1,
  },
  { event: "shipflow/release.check" },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;

    const result = await step.run("evaluate-readiness", async () => {
      const fr = await featureRequestRepo.findById(featureRequestId);
      if (!fr) throw new Error(`Feature request ${featureRequestId} not found`);

      const checks = {
        hasPrd: !!fr.prd,
        prdApproved: fr.prd?.status === "approved",
        allTasksDone: fr.prd?.tasks?.every((t) => t.status === "done") ?? false,
        taskCount: fr.prd?.tasks?.length ?? 0,
        completedTasks: fr.prd?.tasks?.filter((t) => t.status === "done").length ?? 0,
      };

      // Check for unresolved blocking issues across all reviews
      const pullRequests = await db.pullRequest.findMany({
        where: { projectId: fr.projectId },
        include: {
          reviews: {
            include: {
              issues: {
                where: { severity: "blocking", resolved: false },
              },
            },
          },
        },
      });

      const unresolvedBlockingIssues = pullRequests.flatMap((pr) =>
        pr.reviews.flatMap((r) => r.issues)
      );

      const isReady =
        checks.hasPrd &&
        checks.prdApproved &&
        checks.allTasksDone &&
        unresolvedBlockingIssues.length === 0;

      return {
        ...checks,
        unresolvedBlockingCount: unresolvedBlockingIssues.length,
        isReady,
      };
    });

    return result;
  }
);
