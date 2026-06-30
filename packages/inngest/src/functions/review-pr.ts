/**
 * AI Code Review — Inngest Function
 *
 * The QA Agent: Reviews a pull request against the PRD requirements,
 * acceptance criteria, and engineering tasks. Categorizes issues as
 * blocking or non-blocking.
 *
 * This is the core review loop function referenced in the requirement:
 * Code → AI Review → Fixes → Re-Review → Human Approval → Ship
 */

import { inngest } from "../client";
import {
  pullRequestRepo,
  reviewRepo,
  featureRequestRepo,
  prdRepo,
} from "@shipflow/db";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Octokit } from "octokit";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const reviewPullRequest = inngest.createFunction(
  {
    id: "review-pull-request",
    retries: 2,
    concurrency: [{ limit: 5 }],
  },
  { event: "shipflow/pr.review" },
  async ({ event, step }) => {
    const { pullRequestId, featureRequestId } = event.data;

    // Step 1: Fetch PR data
    const pr = await step.run("fetch-pr", async () => {
      const p = await pullRequestRepo.findById(pullRequestId);
      if (!p) throw new Error(`Pull request ${pullRequestId} not found`);
      return p;
    });

    // Step 2: Update PR status to processing
    await step.run("set-processing", async () => {
      await pullRequestRepo.updateStatus(pullRequestId, "processing");
    });

    // Step 3: Create a review record
    const review = await step.run("create-review", async () => {
      return reviewRepo.create({ pullRequestId, reviewType: "ai" });
    });

    // Step 4: Fetch PRD context (if linked to a feature request)
    const prdContext = await step.run("fetch-prd-context", async () => {
      if (!featureRequestId) return null;

      const fr = await featureRequestRepo.findById(featureRequestId);
      if (!fr?.prd) return null;

      return {
        problemStatement: fr.prd.problemStatement,
        acceptanceCriteria: fr.prd.acceptanceCriteria as string[],
        edgeCases: fr.prd.edgeCases as string[],
        tasks: fr.prd.tasks.map((t) => ({ title: t.title, description: t.description })),
      };
    });

    // Step 5: Fetch PR diff from GitHub
    const diff = await step.run("fetch-pr-diff", async () => {
      const octokit = new Octokit({
        auth: process.env.GITHUB_APP_PRIVATE_KEY,
      });

      const [owner, repo] = pr.repoFullName.split("/");
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pr.prNumber,
      });

      return files.map((f) => ({
        filename: f.filename,
        status: f.status,
        patch: f.patch ?? "",
        additions: f.additions,
        deletions: f.deletions,
      }));
    });

    // Step 6: AI Review against PRD
    const reviewResult = await step.run("ai-review", async () => {
      const diffSummary = diff
        .map((f) => `### ${f.filename} (${f.status})\n\`\`\`diff\n${f.patch}\n\`\`\``)
        .join("\n\n");

      const prdSection = prdContext
        ? `
## PRD Context
**Problem:** ${prdContext.problemStatement}

**Acceptance Criteria:**
${prdContext.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}

**Edge Cases:**
${prdContext.edgeCases.map((e) => `- ${e}`).join("\n")}

**Engineering Tasks:**
${prdContext.tasks.map((t) => `- ${t.title}: ${t.description}`).join("\n")}
`
        : "";

      const prompt = `You are a senior QA engineer and code reviewer. Review this pull request thoroughly.

## Pull Request
**Title:** ${pr.title}
**Branch:** ${pr.baseBranch}
**Author:** ${pr.authorLogin}

${prdSection}

## Code Changes
${diffSummary}

## Review Instructions
Evaluate the code against:
1. **PRD Compliance** — Does the implementation satisfy the product requirements?
2. **Acceptance Criteria** — Are all acceptance criteria met?
3. **Security** — Any vulnerabilities, injection risks, or auth issues?
4. **Performance** — Any N+1 queries, memory leaks, or inefficiencies?
5. **Code Quality** — Clean code, proper naming, no code smells?
6. **Edge Cases** — Are edge cases from the PRD handled?

Return valid JSON:
{
  "summary": "Overall review summary in 2-3 sentences",
  "markdown": "Full review as markdown with sections",
  "issues": [
    {
      "severity": "blocking" | "non_blocking" | "suggestion",
      "category": "prd_compliance" | "security" | "performance" | "code_quality" | "edge_case",
      "title": "Issue title",
      "description": "Detailed description with actionable fix",
      "filePath": "path/to/file.ts",
      "lineNumber": 42
    }
  ]
}

Be thorough but fair. Focus on issues that would cause production problems.`;

      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash"),
        prompt,
        maxTokens: 6000,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to extract JSON from AI response");

      return JSON.parse(jsonMatch[0]) as {
        summary: string;
        markdown: string;
        issues: Array<{
          severity: string;
          category: string;
          title: string;
          description: string;
          filePath?: string;
          lineNumber?: number;
        }>;
      };
    });

    // Step 7: Save review results
    await step.run("save-review-results", async () => {
      await reviewRepo.complete(review.id, {
        summary: reviewResult.summary,
        markdown: reviewResult.markdown,
        issues: reviewResult.issues,
      });
    });

    // Step 8: Post review comment to GitHub
    await step.run("post-github-comment", async () => {
      try {
        const octokit = new Octokit({
          auth: process.env.GITHUB_APP_PRIVATE_KEY,
        });

        const [owner, repo] = pr.repoFullName.split("/");
        await octokit.request(
          "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
          {
            owner,
            repo,
            issue_number: pr.prNumber,
            body: `## 🤖 ShipFlow AI Review\n\n${reviewResult.markdown}\n\n---\n*Reviewed by ShipFlow AI • ${reviewResult.issues.length} issue(s) found*`,
          }
        );
      } catch (error) {
        // Non-critical — review is saved to DB even if GitHub comment fails
        console.error("Failed to post GitHub comment:", error);
      }
    });

    // Step 9: Determine next state based on blocking issues
    const hasBlocking = reviewResult.issues.some((i) => i.severity === "blocking");

    await step.run("update-pr-status", async () => {
      const newStatus = hasBlocking ? "fix_needed" : "reviewed";
      await pullRequestRepo.updateStatus(pullRequestId, newStatus);

      // If linked to a feature request, update its state too
      if (featureRequestId) {
        const nextFeatureStatus = hasBlocking ? "fix_needed" : "human_review";
        await featureRequestRepo.transitionStatus(featureRequestId, nextFeatureStatus);
      }
    });

    return {
      reviewId: review.id,
      hasBlockingIssues: hasBlocking,
      issueCount: reviewResult.issues.length,
      status: hasBlocking ? "fix_needed" : "ready_for_human_review",
    };
  }
);
