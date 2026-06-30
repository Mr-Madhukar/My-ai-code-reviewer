/**
 * Feature Request Router
 *
 * Manages feature requests and their lifecycle transitions.
 * Triggers AI clarification and PRD generation via Inngest events.
 */

import { z } from "zod";
import { createTRPCRouter, workspaceProcedure } from "../trpc";
import { featureRequestRepo } from "@shipflow/db";

export const featureRequestRouter = createTRPCRouter({
  /** Create a new feature request. */
  create: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        projectId: z.string(),
        title: z.string().min(3).max(200),
        description: z.string().min(10),
        source: z.enum(["manual", "email", "support_ticket"]).default("manual"),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      })
    )
    .mutation(async ({ input }) => {
      return featureRequestRepo.create({
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        source: input.source,
        priority: input.priority,
      });
    }),

  /** List feature requests for a project. */
  list: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        projectId: z.string(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return featureRequestRepo.listByProject(input.projectId, input.status);
    }),

  /** Get a single feature request with full details. */
  getById: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ input }) => {
      return featureRequestRepo.findById(input.id);
    }),

  /** Send a clarification message (user reply to AI questions). */
  sendMessage: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        featureRequestId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return featureRequestRepo.addMessage(
        input.featureRequestId,
        "user",
        input.content
      );
    }),

  /** Transition the feature request to a new status. */
  transitionStatus: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        status: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return featureRequestRepo.transitionStatus(input.id, input.status);
    }),

  /** Update feature request details. */
  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, id, ...data } = input;
      return featureRequestRepo.update(id, data);
    }),

  /** Delete a feature request. */
  delete: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      return featureRequestRepo.delete(input.id);
    }),
});
