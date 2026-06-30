/**
 * Feature Requests page (`/dashboard/features`).
 *
 * Core Phase 1-2 UI: Create, list, and track feature requests.
 * Shows the feature request lifecycle state machine status and links
 * to PRD editor and task board for each feature.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  LightbulbIcon,
  PlusIcon,
  MessageSquareIcon,
  FileTextIcon,
  KanbanIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  AlertCircleIcon,
  RocketIcon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Feature Requests · Dashboard",
};

/** Status display config */
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  new: { label: "New", icon: CircleDotIcon, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-l-blue-500/60" },
  clarifying: { label: "Clarifying", icon: MessageSquareIcon, color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-l-yellow-500/60" },
  prd_generation: { label: "Generating PRD", icon: FileTextIcon, color: "text-orange-400", bg: "bg-orange-500/15", border: "border-l-orange-500/60" },
  prd_ready: { label: "PRD Ready", icon: FileTextIcon, color: "text-green-400", bg: "bg-green-500/15", border: "border-l-green-500/60" },
  planning: { label: "Planning", icon: KanbanIcon, color: "text-purple-400", bg: "bg-purple-500/15", border: "border-l-purple-500/60" },
  tasks_ready: { label: "Tasks Ready", icon: KanbanIcon, color: "text-green-400", bg: "bg-green-500/15", border: "border-l-green-500/60" },
  in_development: { label: "In Development", icon: CircleDotIcon, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-l-blue-500/60" },
  ai_review: { label: "AI Review", icon: AlertCircleIcon, color: "text-orange-400", bg: "bg-orange-500/15", border: "border-l-orange-500/60" },
  fix_needed: { label: "Fix Needed", icon: AlertCircleIcon, color: "text-red-400", bg: "bg-red-500/15", border: "border-l-red-500/60" },
  human_review: { label: "Human Review", icon: CheckCircle2Icon, color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-l-yellow-500/60" },
  shipped: { label: "Shipped", icon: RocketIcon, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-l-emerald-500/60" },
};

import { CreateFeatureDialog } from "@/features/dashboard/components/create-feature-dialog";

async function getFeatureRequests(userId: string, projectId?: string) {
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  return prisma.featureRequest.findMany({
    where: {
      project: {
        workspaceId: { in: workspaceIds },
        ...(projectId ? { id: projectId } : {}),
      },
    },
    include: {
      project: { select: { name: true } },
      _count: { select: { messages: true } },
      prd: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getProjects(userId: string) {
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  return prisma.project.findMany({
    where: { workspaceId: { in: workspaceIds } },
    select: { id: true, name: true },
  });
}

export default async function FeatureRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const features = await getFeatureRequests(session.user.id, params.projectId);
  const projects = await getProjects(session.user.id);

  return (
    <>
      <DashboardHeader
        title="Feature Requests"
        description="Create, track, and manage feature requests through the ShipFlow pipeline."
      >
        {projects.length > 0 && (
          <CreateFeatureDialog
            projects={projects}
            defaultProjectId={params.projectId}
          />
        )}
      </DashboardHeader>
      <div className="p-6">
        {features.length === 0 ? (
          <Card className="card-glow relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <LightbulbIcon className="size-7 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No feature requests yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create one to start the ShipFlow pipeline.
                </p>
              </div>
              {projects.length > 0 ? (
                <CreateFeatureDialog
                  projects={projects}
                  defaultProjectId={params.projectId}
                  trigger={
                    <Button className="gap-1">
                      <PlusIcon className="size-4" />
                      New Feature Request
                    </Button>
                  }
                />
              ) : (
                <p className="text-xs text-amber-400">
                  Please create a Project or sync a Repository first to add feature requests.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {features.map((feature) => {
              const statusConfig = STATUS_CONFIG[feature.status] ?? STATUS_CONFIG.new;
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={feature.id}
                  className={`card-glow relative overflow-hidden border-l-2 transition-all hover:border-primary/20 ${statusConfig.border}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${statusConfig.bg}`}>
                        <StatusIcon className={`size-4 ${statusConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`${DASHBOARD_ROUTES.featureRequests}/${feature.id}`}
                            className="font-medium text-sm hover:text-primary transition-colors"
                          >
                            {feature.title}
                          </Link>
                          <Badge variant="secondary" className="text-xs">
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {feature.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {feature.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-violet-400/60" />
                            {feature.project.name}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquareIcon className="size-3" />
                            {feature._count.messages} messages
                          </span>
                          {feature.prd && (
                            <Link
                              href={`${DASHBOARD_ROUTES.prd}/${feature.prd.id}`}
                              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <FileTextIcon className="size-3" />
                              View PRD
                            </Link>
                          )}
                          <span className="ml-auto">
                            {formatDistanceToNow(feature.updatedAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
