/**
 * PRD Editor page (`/dashboard/prd/[id]`).
 *
 * View and edit the AI-generated Product Requirements Document.
 * Shows structured PRD sections (problem statement, goals, non-goals,
 * user stories, acceptance criteria, edge cases, success metrics).
 * Allows approval to move to the planning phase.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  FileTextIcon,
  ListChecksIcon,
  TargetIcon,
  UserIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  XCircleIcon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { PrdWorkflowActions } from "@/features/dashboard/components/prd-workflow-actions";

export const metadata: Metadata = {
  title: "PRD Editor · Dashboard",
};

async function getPrd(id: string) {
  return prisma.pRD.findUnique({
    where: { id },
    include: {
      featureRequest: {
        select: { id: true, title: true, status: true, projectId: true },
      },
      tasks: { orderBy: { order: "asc" } },
    },
  });
}

export default async function PrdEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuth();
  const prd = await getPrd(id);

  if (!prd) {
    notFound();
  }

  const goals = prd.goals as string[];
  const nonGoals = prd.nonGoals as string[];
  const userStories = prd.userStories as Array<{ as: string; iWant: string; soThat: string }>;
  const acceptanceCriteria = prd.acceptanceCriteria as string[];
  const edgeCases = prd.edgeCases as string[];
  const successMetrics = prd.successMetrics as string[];

  return (
    <>
      <DashboardHeader
        title="PRD Editor"
        description={prd.featureRequest?.title ?? "Product Requirements Document"}
      />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link href={prd.featureRequest ? `${DASHBOARD_ROUTES.featureRequests}/${prd.featureRequest.id}` : DASHBOARD_ROUTES.featureRequests} />
            }
          >
            <ArrowLeftIcon />
            Back to feature
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {prd.status}
            </Badge>
            {prd.status === "draft" && (
              <PrdWorkflowActions prdId={prd.id} type="editor-header" />
            )}
          </div>
        </div>

        {/* Problem Statement */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileTextIcon className="size-4 text-muted-foreground" />
              Problem Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{prd.problemStatement}</p>
          </CardContent>
        </Card>

        {/* Goals & Non-Goals side by side */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TargetIcon className="size-4 text-green-500" />
                Goals ({goals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="size-4 mt-0.5 text-green-500 shrink-0" />
                    {goal}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <XCircleIcon className="size-4 text-red-400" />
                Non-Goals ({nonGoals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {nonGoals.map((ng, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <XCircleIcon className="size-4 mt-0.5 text-red-400 shrink-0" />
                    {ng}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* User Stories */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserIcon className="size-4 text-muted-foreground" />
              User Stories ({userStories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStories.map((story, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <span className="font-medium">As</span>{" "}
                  <span className="text-primary">{story.as}</span>,{" "}
                  <span className="font-medium">I want</span>{" "}
                  <span className="text-primary">{story.iWant}</span>,{" "}
                  <span className="font-medium">so that</span>{" "}
                  <span className="text-primary">{story.soThat}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acceptance Criteria */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListChecksIcon className="size-4 text-muted-foreground" />
              Acceptance Criteria ({acceptanceCriteria.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {acceptanceCriteria.map((criterion, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  {criterion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Edge Cases */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangleIcon className="size-4 text-yellow-500" />
              Edge Cases ({edgeCases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {edgeCases.map((edge, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangleIcon className="size-4 mt-0.5 text-yellow-500 shrink-0" />
                  {edge}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3Icon className="size-4 text-muted-foreground" />
              Success Metrics ({successMetrics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {successMetrics.map((metric, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <BarChart3Icon className="size-4 mt-0.5 text-blue-500 shrink-0" />
                  {metric}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Generate Tasks CTA */}
        {prd.status === "approved" && prd.tasks.length === 0 && (
          <Card className="rounded-none border-primary/20">
            <CardContent className="flex items-center justify-between py-4">
              <p className="text-sm text-muted-foreground">
                PRD approved. Ready to generate engineering tasks.
              </p>
              <PrdWorkflowActions prdId={prd.id} type="generate-tasks-cta" />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
