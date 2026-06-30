/**
 * Review Router
 *
 * Handles AI review data, issue management, and review history.
 */

import { z } from "zod";
import { createTRPCRouter, workspaceProcedure } from "../trpc";
import { reviewRepo, pullRequestRepo } from "@shipflow/db";

export const reviewRouter = createTRPCRouter({
  /** List reviews for a pull request. */
  listByPullRequest: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), pullRequestId: z.string() }))
    .query(async ({ input }) => {
      return reviewRepo.listByPullRequest(input.pullRequestId);
    }),

  /** Get a single review with all issues. */
  getById: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ input }) => {
      return reviewRepo.findById(input.id);
    }),

  /** Get review history for the active workspace. */
  history: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return reviewRepo.listByWorkspace(input.workspaceId, input.limit);
    }),

  /** Mark a review issue as resolved. */
  resolveIssue: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), issueId: z.string() }))
    .mutation(async ({ input }) => {
      return reviewRepo.resolveIssue(input.issueId);
    }),

  /** List pull requests for a project. */
  listPullRequests: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), projectId: z.string() }))
    .query(async ({ input }) => {
      return pullRequestRepo.listByProject(input.projectId);
    }),

  /** Get a single pull request with reviews. */
  getPullRequest: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ input }) => {
      return pullRequestRepo.findById(input.id);
    }),
});
