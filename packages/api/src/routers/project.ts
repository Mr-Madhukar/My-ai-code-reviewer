/**
 * Project Router
 *
 * CRUD for projects within a workspace + GitHub repo connection.
 */

import { z } from "zod";
import { createTRPCRouter, workspaceProcedure, adminProcedure } from "../trpc";
import { projectRepo } from "@shipflow/db";

export const projectRouter = createTRPCRouter({
  /** Create a project within the active workspace. */
  create: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return projectRepo.create({
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description,
      });
    }),

  /** List all projects in the active workspace. */
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      return projectRepo.listByWorkspace(input.workspaceId);
    }),

  /** Get a single project by id. */
  getById: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), projectId: z.string() }))
    .query(async ({ input }) => {
      return projectRepo.findById(input.projectId);
    }),

  /** Update a project. */
  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        projectId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { projectId, workspaceId, ...data } = input;
      return projectRepo.update(projectId, data);
    }),

  /** Connect a GitHub repository to a project. */
  connectRepo: adminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        projectId: z.string(),
        repoFullName: z.string(),
        installationId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return projectRepo.connectRepo(
        input.projectId,
        input.repoFullName,
        input.installationId
      );
    }),

  /** Disconnect GitHub repo from a project. */
  disconnectRepo: adminProcedure
    .input(z.object({ workspaceId: z.string(), projectId: z.string() }))
    .mutation(async ({ input }) => {
      return projectRepo.disconnectRepo(input.projectId);
    }),

  /** Delete a project (admin only). */
  delete: adminProcedure
    .input(z.object({ workspaceId: z.string(), projectId: z.string() }))
    .mutation(async ({ input }) => {
      return projectRepo.delete(input.projectId);
    }),
});
