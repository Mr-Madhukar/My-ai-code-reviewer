/**
 * @module lib/actions/tasks
 * @description Server Actions for Kanban Task Board.
 */

"use server";

import { revalidatePath } from "next/cache";
import { taskRepo } from "@shipflow/db";
import { getServerSession } from "@/lib/auth-session";

/**
 * Moves a task to a different Kanban status column.
 *
 * @param taskId - ID of the task to update.
 * @param status - Target status column.
 */
export async function moveTask(
  taskId: string,
  status: "todo" | "in_progress" | "review" | "done"
) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  await taskRepo.updateStatus(taskId, status);
  revalidatePath("/dashboard/tasks");
}
