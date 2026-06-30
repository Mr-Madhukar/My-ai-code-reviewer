/**
 * Task Board page (`/dashboard/tasks`).
 *
 * Kanban board view of engineering tasks derived from PRDs.
 * Tasks are organized into columns: Todo, In Progress, Review, Done.
 */

import type { Metadata } from "next";
import {
  KanbanIcon,
  CircleDotIcon,
  PlayIcon,
  ScanSearchIcon,
  CheckCircle2Icon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/features/dashboard/components/task-card";

export const metadata: Metadata = {
  title: "Task Board · Dashboard",
};

const COLUMNS = [
  { key: "todo", label: "To Do", icon: CircleDotIcon, color: "text-blue-400", bg: "bg-blue-500/15", accent: "border-blue-500/30" },
  { key: "in_progress", label: "In Progress", icon: PlayIcon, color: "text-amber-400", bg: "bg-amber-500/15", accent: "border-amber-500/30" },
  { key: "review", label: "Review", icon: ScanSearchIcon, color: "text-violet-400", bg: "bg-violet-500/15", accent: "border-violet-500/30" },
  { key: "done", label: "Done", icon: CheckCircle2Icon, color: "text-emerald-400", bg: "bg-emerald-500/15", accent: "border-emerald-500/30" },
] as const;

async function getTasks(userId: string, projectId?: string) {
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  const tasks = await prisma.task.findMany({
    where: {
      prd: {
        featureRequest: {
          project: {
            workspaceId: { in: workspaceIds },
            ...(projectId ? { id: projectId } : {}),
          },
        },
      },
    },
    include: {
      prd: {
        select: {
          featureRequest: { select: { title: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return tasks;
}

export default async function TaskBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const tasks = await getTasks(session.user.id, params.projectId);

  const grouped = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    review: tasks.filter((t) => t.status === "review"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <>
      <DashboardHeader
        title="Task Board"
        description="Kanban view of engineering tasks from approved PRDs."
      />
      <div className="p-6">
        {tasks.length === 0 ? (
          <Card className="card-glow relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <KanbanIcon className="size-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generate tasks from an approved PRD to populate the board.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((column) => {
              const Icon = column.icon;
              const columnTasks = grouped[column.key];

              return (
                <div key={column.key} className="flex flex-col gap-3">
                  {/* Column Header */}
                  <div className="flex items-center gap-2 px-1">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${column.bg}`}>
                      <Icon className={`size-3.5 ${column.color}`} />
                    </div>
                    <span className="text-sm font-medium">{column.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>

                  {/* Column Body */}
                  <div className={`flex flex-col gap-2 min-h-[200px] rounded-lg border border-dashed p-2 transition-colors ${column.accent} bg-muted/5`}>
                    {columnTasks.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center">
                        <p className="text-xs text-muted-foreground/60">
                          No tasks
                        </p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
