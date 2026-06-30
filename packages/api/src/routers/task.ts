/**
 * Task Router
 *
 * CRUD for engineering tasks + Kanban board operations.
 */

import { z } from "zod";
import { createTRPCRouter, workspaceProcedure } from "../trpc";
import { taskRepo } from "@shipflow/db";

export const taskRouter = createTRPCRouter({
  /** List all tasks for a PRD (Kanban board). */
  listByPrd: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), prdId: z.string() }))
    .query(async ({ input }) => {
      return taskRepo.listByPrd(input.prdId);
    }),

  /** List tasks grouped by status columns (Kanban). */
  kanban: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), prdId: z.string() }))
    .query(async ({ input }) => {
      return taskRepo.listByPrdGrouped(input.prdId);
    }),

  /** Get a single task. */
  getById: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .query(async ({ input }) => {
      return taskRepo.findById(input.id);
    }),

  /** Create a task manually. */
  create: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        prdId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      })
    )
    .mutation(async ({ input }) => {
      return taskRepo.create({
        prdId: input.prdId,
        title: input.title,
        description: input.description,
        priority: input.priority,
      });
    }),

  /** Move a task to a different column (status change). */
  move: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        status: z.enum(["todo", "in_progress", "review", "done"]),
      })
    )
    .mutation(async ({ input }) => {
      return taskRepo.updateStatus(input.id, input.status);
    }),

  /** Update task details. */
  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, id, ...data } = input;
      return taskRepo.update(id, data);
    }),

  /** Reorder tasks within a column. */
  reorder: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        taskOrders: z.array(z.object({ id: z.string(), order: z.number() })),
      })
    )
    .mutation(async ({ input }) => {
      return taskRepo.reorder(input.taskOrders);
    }),

  /** Delete a task. */
  delete: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      return taskRepo.delete(input.id);
    }),
});
