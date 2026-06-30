/**
 * Task Repository
 *
 * Database operations for engineering tasks derived from PRDs.
 * Tasks are displayed on the Kanban board.
 */

import { db } from "../client";

export const taskRepo = {
  /** Create a single task. */
  async create(data: {
    prdId: string;
    title: string;
    description: string;
    priority?: string;
    order?: number;
  }) {
    return db.task.create({ data });
  },

  /** Bulk create tasks from PRD decomposition. */
  async createMany(
    prdId: string,
    tasks: Array<{ title: string; description: string; priority?: string }>
  ) {
    const data = tasks.map((t, index) => ({
      prdId,
      title: t.title,
      description: t.description,
      priority: t.priority ?? "medium",
      order: index,
    }));

    // createMany doesn't support returning records, so we use a transaction
    return db.$transaction(data.map((d) => db.task.create({ data: d })));
  },

  /** Find a task by id. */
  async findById(id: string) {
    return db.task.findUnique({
      where: { id },
      include: { prd: { select: { id: true, featureRequestId: true } } },
    });
  },

  /** List all tasks for a PRD (Kanban board data). */
  async listByPrd(prdId: string) {
    return db.task.findMany({
      where: { prdId },
      orderBy: { order: "asc" },
    });
  },

  /** List tasks grouped by status for Kanban display. */
  async listByPrdGrouped(prdId: string) {
    const tasks = await db.task.findMany({
      where: { prdId },
      orderBy: { order: "asc" },
    });

    return {
      todo: tasks.filter((t) => t.status === "todo"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      review: tasks.filter((t) => t.status === "review"),
      done: tasks.filter((t) => t.status === "done"),
    };
  },

  /** Update a task's status (Kanban column move). */
  async updateStatus(id: string, status: string) {
    return db.task.update({ where: { id }, data: { status } });
  },

  /** Update a task's details. */
  async update(
    id: string,
    data: { title?: string; description?: string; priority?: string; order?: number; status?: string }
  ) {
    return db.task.update({ where: { id }, data });
  },

  /** Reorder tasks within a column. */
  async reorder(taskOrders: Array<{ id: string; order: number }>) {
    return db.$transaction(
      taskOrders.map((t) => db.task.update({ where: { id: t.id }, data: { order: t.order } }))
    );
  },

  /** Delete a task. */
  async delete(id: string) {
    return db.task.delete({ where: { id } });
  },
};
