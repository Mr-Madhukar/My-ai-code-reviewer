/**
 * Projects page (`/dashboard/projects`).
 *
 * Lists all projects in the active workspace. Users can create new projects,
 * connect GitHub repos, and navigate to feature requests within each project.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  FolderKanbanIcon,
  PlusIcon,
  GitBranchIcon,
  LightbulbIcon,
  GitPullRequestIcon,
  ArrowRightIcon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Projects · Dashboard",
};

async function getProjects(userId: string) {
  // Get all workspaces the user belongs to, then get projects
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      projects: {
        include: {
          _count: {
            select: { featureRequests: true, pullRequests: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return workspaces.flatMap((w) =>
    w.projects.map((p) => ({
      ...p,
      workspaceName: w.name,
      workspaceSlug: w.slug,
    }))
  );
}

export default async function ProjectsPage() {
  const session = await requireAuth();
  const projects = await getProjects(session.user.id);

  return (
    <>
      <DashboardHeader
        title="Projects"
        description="Manage your projects and connect GitHub repositories."
      />
      <div className="p-6">
        {projects.length === 0 ? (
          <Card className="card-glow relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                <FolderKanbanIcon className="size-7 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No projects yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first project to start tracking feature requests.
                </p>
              </div>
              <Button className="gap-1">
                <PlusIcon className="size-4" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="card-glow relative overflow-hidden transition-all hover:border-primary/30"
              >
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/15">
                      <FolderKanbanIcon className="size-3.5 text-violet-400" />
                    </div>
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {project.repoFullName ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <GitBranchIcon className="size-3" />
                        {project.repoFullName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-dashed">
                        No repo connected
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <LightbulbIcon className="size-3 text-amber-400" />
                      {project._count.featureRequests} features
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GitPullRequestIcon className="size-3 text-blue-400" />
                      {project._count.pullRequests} PRs
                    </span>
                    <span className="ml-auto">
                      {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs gap-1 hover:border-primary/30"
                      nativeButton={false}
                      render={
                        <Link href={`${DASHBOARD_ROUTES.featureRequests}?projectId=${project.id}`} />
                      }
                    >
                      <LightbulbIcon className="size-3" />
                      Features
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs gap-1 hover:border-primary/30"
                      nativeButton={false}
                      render={
                        <Link href={`${DASHBOARD_ROUTES.tasks}?projectId=${project.id}`} />
                      }
                    >
                      <ArrowRightIcon className="size-3" />
                      Tasks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
