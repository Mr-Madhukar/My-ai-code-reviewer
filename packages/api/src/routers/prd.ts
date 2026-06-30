/**
 * PRD Router
 *
 * CRUD for Product Requirements Documents + approval workflow.
 */

import { z } from "zod";
import { createTRPCRouter, workspaceProcedure } from "../trpc";
import { prdRepo } from "@shipflow/db";

export const prdRouter = createTRPCRouter({
  /** Get PRD by id. */
  getById: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ input }) => {
      return prdRepo.findById(input.id);
    }),

  /** Get PRD by feature request id. */
  getByFeatureRequest: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), featureRequestId: z.string() }))
    .query(async ({ input }) => {
      return prdRepo.findByFeatureRequestId(input.featureRequestId);
    }),

  /** Update PRD content (editor save). */
  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        problemStatement: z.string().optional(),
        goals: z.array(z.string()).optional(),
        nonGoals: z.array(z.string()).optional(),
        userStories: z
          .array(
            z.object({
              as: z.string(),
              iWant: z.string(),
              soThat: z.string(),
            })
          )
          .optional(),
        acceptanceCriteria: z.array(z.string()).optional(),
        edgeCases: z.array(z.string()).optional(),
        successMetrics: z.array(z.string()).optional(),
        rawMarkdown: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, id, ...data } = input;
      return prdRepo.update(id, data);
    }),

  /** Approve a PRD and move feature to planning phase. */
  approve: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      return prdRepo.approve(input.id);
    }),

  /** Request revision on a PRD. */
  requestRevision: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      return prdRepo.requestRevision(input.id);
    }),
});
