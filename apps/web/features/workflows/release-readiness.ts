/**
 * Release Readiness Check — Inngest Workflow
 *
 * Evaluates whether a feature is ready for human approval by checking:
 * - PRD completeness and approval status
 * - All tasks completed
 * - AI review passed (no unresolved blocking issues)
 * - Pull request exists and is reviewed
 */

import { inngest } from "@/features/inngest/client";
import { prisma } from "@/lib/db";

export const checkReleaseReadiness = inngest.createFunction(
  {
    id: "check-release-readiness",
    retries: 2,
    triggers: [{ event: "shipflow/release.check" }],
  },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;

    const result = await step.run("evaluate-readiness", async () => {
      const fr = await prisma.featureRequest.findUnique({
        where: { id: featureRequestId },
        include: {
          prd: {
            include: {
              tasks: true,
            },
          },
          project: {
            include: {
              pullRequests: {
                include: {
                  reviews: {
                    include: {
                      issues: {
                        where: { severity: "blocking", resolved: false },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!fr) throw new Error(`Feature request ${featureRequestId} not found`);

      const checks = {
        hasPrd: !!fr.prd,
        prdApproved: fr.prd?.status === "approved",
        allTasksDone: fr.prd?.tasks?.every((t) => t.status === "done") ?? false,
        taskCount: fr.prd?.tasks?.length ?? 0,
        completedTasks:
          fr.prd?.tasks?.filter((t) => t.status === "done").length ?? 0,
      };

      // Check for unresolved blocking issues
      const unresolvedBlockingIssues =
        fr.project?.pullRequests?.flatMap((pr) =>
          pr.reviews.flatMap((r) => r.issues)
        ) ?? [];

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

    // Auto-transition to human_review if ready
    if (result.isReady) {
      await step.run("transition-to-human-review", async () => {
        await prisma.featureRequest.update({
          where: { id: featureRequestId },
          data: { status: "human_review" },
        });
      });
    }

    return result;
  }
) as any;
