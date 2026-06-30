/**
 * Re-Review Pull Request — Inngest Workflow
 *
 * Phase 4 re-review loop: When a PR has blocking issues and the developer
 * pushes fixes, this function re-reviews the updated code against the
 * previous review's findings.
 *
 * Flow:
 * 1. Fetch the previous review and its blocking issues
 * 2. Fetch the updated PR diff from GitHub
 * 3. AI evaluates whether previous issues are resolved
 * 4. Generate new review with focus on previously-blocking items
 * 5. Update PR and feature request status
 */

import { inngest } from "@/features/inngest/client";
import { prisma } from "@/lib/db";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getGithubApp } from "@/features/github/utils/github-app";
import { splitRepoFullName } from "@/features/reviews/utils/repo-name";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const reReviewPullRequest = inngest.createFunction(
  {
    id: "re-review-pull-request",
    retries: 2,
    concurrency: [{ limit: 5 }],
    triggers: [{ event: "shipflow/pr.re-review" }],
  },
  async ({ event, step }) => {
    const { pullRequestId, previousReviewId } = event.data;

    // Step 1: Fetch PR and previous review
    const context = await step.run("fetch-context", async () => {
      const pr = await prisma.pullRequest.findUnique({
        where: { id: pullRequestId },
      });
      if (!pr) throw new Error(`Pull request ${pullRequestId} not found`);

      const previousReview = await prisma.review.findUnique({
        where: { id: previousReviewId },
        include: {
          issues: { where: { severity: "blocking" } },
        },
      });

      return { pr, previousReview };
    });

    // Step 2: Update status
    await step.run("set-processing", async () => {
      await prisma.pullRequest.update({
        where: { id: pullRequestId },
        data: { status: "processing" },
      });
    });

    // Step 3: Create new review record
    const review = await step.run("create-review", async () => {
      return prisma.review.create({
        data: {
          pullRequestId,
          reviewType: "ai",
          status: "processing",
        },
      });
    });

    // Step 4: Fetch updated PR diff
    const diff = await step.run("fetch-updated-diff", async () => {
      const app = getGithubApp();
      const octokit = await app.getInstallationOctokit(
        context.pr.installationId
      );
      const { owner, repo } = splitRepoFullName(context.pr.repoFullName);

      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: context.pr.prNumber,
      });

      return files.map((f) => ({
        filename: f.filename,
        status: f.status,
        patch: f.patch ?? "",
        additions: f.additions,
        deletions: f.deletions,
      }));
    });

    // Step 5: AI re-review focusing on previous blocking issues
    const reviewResult = await step.run("ai-re-review", async () => {
      const previousIssues = context.previousReview?.issues ?? [];
      const previousIssuesSummary = previousIssues
        .map(
          (i, idx) =>
            `${idx + 1}. [${i.severity}] ${i.title}: ${i.description}${i.filePath ? ` (${i.filePath}:${i.lineNumber})` : ""}`
        )
        .join("\n");

      const diffSummary = diff
        .map(
          (f) =>
            `### ${f.filename} (${f.status})\n\`\`\`diff\n${f.patch}\n\`\`\``
        )
        .join("\n\n");

      const prompt = `You are a senior QA engineer performing a RE-REVIEW of a pull request that was previously flagged with blocking issues.

## Pull Request
**Title:** ${context.pr.title}
**Branch:** ${context.pr.baseBranch}
**Author:** ${context.pr.authorLogin}

## Previous Blocking Issues
The following issues were identified in the previous review and need to be verified as resolved:

${previousIssuesSummary || "No previous issues recorded"}

## Updated Code Changes
${diffSummary}

## Re-Review Instructions
1. Check each previous blocking issue — has it been resolved in the updated code?
2. Identify any NEW issues introduced by the fix
3. Determine if the PR is now ready for human review

Return valid JSON:
{
  "summary": "Re-review summary in 2-3 sentences",
  "markdown": "Full re-review as markdown",
  "previousIssuesResolved": [
    { "issueTitle": "Original issue title", "resolved": true | false, "notes": "Explanation" }
  ],
  "newIssues": [
    {
      "severity": "blocking" | "non_blocking" | "suggestion",
      "category": "prd_compliance" | "security" | "performance" | "code_quality" | "edge_case",
      "title": "Issue title",
      "description": "Detailed description with actionable fix",
      "filePath": "path/to/file.ts",
      "lineNumber": 42
    }
  ]
}`;

      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash"),
        prompt,
        maxOutputTokens: 6000,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch)
        throw new Error("Failed to extract JSON from AI response");

      return JSON.parse(jsonMatch[0]) as {
        summary: string;
        markdown: string;
        previousIssuesResolved: Array<{
          issueTitle: string;
          resolved: boolean;
          notes: string;
        }>;
        newIssues: Array<{
          severity: string;
          category: string;
          title: string;
          description: string;
          filePath?: string;
          lineNumber?: number;
        }>;
      };
    });

    // Step 6: Save results
    await step.run("save-re-review-results", async () => {
      // Update review record
      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "completed",
          summary: reviewResult.summary,
          markdown: reviewResult.markdown,
        },
      });

      // Save new issues
      if (reviewResult.newIssues.length > 0) {
        await prisma.reviewIssue.createMany({
          data: reviewResult.newIssues.map((issue) => ({
            reviewId: review.id,
            severity: issue.severity,
            category: issue.category,
            title: issue.title,
            description: issue.description,
            filePath: issue.filePath,
            lineNumber: issue.lineNumber,
          })),
        });
      }

      // Mark resolved previous issues
      for (const resolved of reviewResult.previousIssuesResolved) {
        if (resolved.resolved) {
          const issue = context.previousReview?.issues.find(
            (i) => i.title === resolved.issueTitle
          );
          if (issue) {
            await prisma.reviewIssue.update({
              where: { id: issue.id },
              data: { resolved: true },
            });
          }
        }
      }
    });

    // Step 7: Determine next state
    const hasBlocking = reviewResult.newIssues.some(
      (i) => i.severity === "blocking"
    );
    const allPreviousResolved = reviewResult.previousIssuesResolved.every(
      (r) => r.resolved
    );

    await step.run("update-status", async () => {
      const newStatus =
        hasBlocking || !allPreviousResolved ? "fix_needed" : "reviewed";
      await prisma.pullRequest.update({
        where: { id: pullRequestId },
        data: { status: newStatus },
      });
    });

    return {
      reviewId: review.id,
      hasBlockingIssues: hasBlocking,
      allPreviousResolved,
      newIssueCount: reviewResult.newIssues.length,
      status:
        hasBlocking || !allPreviousResolved
          ? "fix_needed"
          : "ready_for_human_review",
    };
  }
) as any;
