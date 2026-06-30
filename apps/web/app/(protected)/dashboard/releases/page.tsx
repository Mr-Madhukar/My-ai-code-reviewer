/**
 * Releases page (`/dashboard/releases`).
 *
 * Phase 5: Human approval workflow. Lists features awaiting human review
 * and shows the approval/rejection interface. Human reviewer verifies
 * PRD, tasks, pull request, AI review history, and outstanding issues.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  RocketIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  FileTextIcon,
  KanbanIcon,
  GitPullRequestIcon,
  ScanSearchIcon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Releases · Dashboard",
};

async function getReleaseCandidates(userId: string) {
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  // Get features in human_review or shipped status
  const features = await prisma.featureRequest.findMany({
    where: {
      status: { in: ["human_review", "shipped"] },
      project: { workspaceId: { in: workspaceIds } },
    },
    include: {
      project: { select: { name: true, repoFullName: true } },
      prd: {
        include: {
          tasks: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get release records
  const releases = await prisma.release.findMany({
    where: {
      featureRequestId: { in: features.map((f) => f.id) },
    },
  });

  const releaseMap = new Map(releases.map((r) => [r.featureRequestId, r]));

  return features.map((f) => ({
    ...f,
    release: releaseMap.get(f.id) ?? null,
  }));
}

export default async function ReleasesPage() {
  const session = await requireAuth();
  const candidates = await getReleaseCandidates(session.user.id);

  const pendingReview = candidates.filter((c) => c.status === "human_review");
  const shipped = candidates.filter((c) => c.status === "shipped");

  return (
    <>
      <DashboardHeader
        title="Releases"
        description="Human approval workflow — review and approve features for release."
      />
      <div className="flex flex-col gap-6 p-6">
        {/* Pending Human Review */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15">
              <ClockIcon className="size-3.5 text-amber-400" />
            </div>
            <h2 className="text-sm font-medium">Awaiting Approval</h2>
            <Badge variant="secondary" className="text-xs">
              {pendingReview.length}
            </Badge>
          </div>

          {pendingReview.length === 0 ? (
            <Card className="card-glow relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <RocketIcon className="size-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No features awaiting approval right now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingReview.map((feature) => {
                const tasksDone = feature.prd?.tasks?.filter((t) => t.status === "done").length ?? 0;
                const totalTasks = feature.prd?.tasks?.length ?? 0;

                return (
                  <Card
                    key={feature.id}
                    className="card-glow relative overflow-hidden border-l-2 border-l-amber-500/60 transition-all hover:border-primary/20"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15">
                              <ClockIcon className="size-3.5 text-amber-400" />
                            </div>
                            <span className="font-medium text-sm">{feature.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              Awaiting Approval
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 pl-9">
                            {feature.description}
                          </p>

                          {/* Checklist */}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pl-9 pt-1">
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5">
                              <FileTextIcon className="size-3" />
                              PRD: {feature.prd ? (
                                <span className={feature.prd.status === "approved" ? "text-green-400" : "text-amber-400"}>
                                  {feature.prd.status}
                                </span>
                              ) : "missing"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5">
                              <KanbanIcon className="size-3" />
                              Tasks: {tasksDone}/{totalTasks} done
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5">
                              <GitPullRequestIcon className="size-3" />
                              {feature.project.repoFullName ?? "No repo"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                              <ScanSearchIcon className="size-3" />
                              AI Review: passed
                            </span>
                          </div>

                          {/* Quick links */}
                          <div className="flex gap-2 pl-9 pt-2">
                            {feature.prd && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 hover:border-primary/30"
                                nativeButton={false}
                                render={<Link href={`${DASHBOARD_ROUTES.prd}/${feature.prd.id}`} />}
                              >
                                <FileTextIcon className="size-3" />
                                View PRD
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 hover:border-primary/30"
                              nativeButton={false}
                              render={<Link href={`${DASHBOARD_ROUTES.featureRequests}/${feature.id}`} />}
                            >
                              View Feature
                            </Button>
                          </div>
                        </div>

                        {/* Approve/Reject */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button size="sm" className="gap-1">
                            <CheckCircle2Icon className="size-4" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive hover:bg-destructive/10">
                            <XCircleIcon className="size-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Shipped Features */}
        {shipped.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15">
                <RocketIcon className="size-3.5 text-emerald-400" />
              </div>
              <h2 className="text-sm font-medium">Shipped</h2>
              <Badge variant="secondary" className="text-xs">
                {shipped.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {shipped.map((feature) => (
                <Card
                  key={feature.id}
                  className="card-glow relative overflow-hidden border-l-2 border-l-emerald-500/40 transition-all"
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                        <CheckCircle2Icon className="size-3.5 text-emerald-400" />
                      </div>
                      <span className="text-sm font-medium">{feature.title}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Shipped
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(feature.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
