/**
 * Review Repository
 *
 * Database operations for AI and human reviews, plus individual review issues
 * categorized as blocking / non-blocking.
 */

import { db } from "../client";

export const reviewRepo = {
  /** Create a new review for a pull request. */
  async create(data: {
    pullRequestId: string;
    reviewType?: string;
    status?: string;
  }) {
    return db.review.create({
      data: {
        pullRequestId: data.pullRequestId,
        reviewType: data.reviewType ?? "ai",
        status: data.status ?? "pending",
      },
    });
  },

  /** Find a review by id with all issues. */
  async findById(id: string) {
    return db.review.findUnique({
      where: { id },
      include: {
        issues: { orderBy: { createdAt: "asc" } },
        pullRequest: {
          select: { id: true, repoFullName: true, prNumber: true, title: true },
        },
      },
    });
  },

  /** List reviews for a pull request. */
  async listByPullRequest(pullRequestId: string) {
    return db.review.findMany({
      where: { pullRequestId },
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Complete a review with results. */
  async complete(
    id: string,
    data: {
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
    }
  ) {
    return db.$transaction(async (tx) => {
      // Update review status and content
      const review = await tx.review.update({
        where: { id },
        data: {
          status: "completed",
          summary: data.summary,
          markdown: data.markdown,
        },
      });

      // Create all review issues
      if (data.issues.length > 0) {
        await tx.reviewIssue.createMany({
          data: data.issues.map((issue) => ({
            reviewId: id,
            ...issue,
          })),
        });
      }

      return review;
    });
  },

  /** Check if a review has any blocking issues. */
  async hasBlockingIssues(reviewId: string) {
    const count = await db.reviewIssue.count({
      where: { reviewId, severity: "blocking", resolved: false },
    });
    return count > 0;
  },

  /** Mark an issue as resolved. */
  async resolveIssue(issueId: string) {
    return db.reviewIssue.update({
      where: { id: issueId },
      data: { resolved: true },
    });
  },

  /** Get review history for a workspace (across all projects). */
  async listByWorkspace(workspaceId: string, limit: number = 20) {
    return db.review.findMany({
      where: {
        pullRequest: {
          project: { workspaceId },
        },
      },
      include: {
        pullRequest: {
          select: { repoFullName: true, prNumber: true, title: true },
        },
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
