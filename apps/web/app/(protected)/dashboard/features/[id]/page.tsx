/**
 * Feature Request Detail page (`/dashboard/features/[id]`).
 *
 * Core Phase 1 UI: Shows the feature request with its clarification
 * conversation, PRD status, and action buttons to trigger AI workflows.
 * This is where the clarification chat between user and AI agent happens.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeftIcon,
  BotIcon,
  FileTextIcon,
  KanbanIcon,
  LightbulbIcon,
  MessageSquareIcon,
  RocketIcon,
  UserIcon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { FeatureWorkflowActions } from "@/features/dashboard/components/feature-workflow-actions";
import { ClarificationChat } from "@/features/dashboard/components/clarification-chat";

export const metadata: Metadata = {
  title: "Feature Request · Dashboard",
};

async function getFeatureRequest(id: string) {
  return prisma.featureRequest.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      prd: {
        include: {
          tasks: { orderBy: { order: "asc" } },
        },
      },
      project: { select: { name: true, workspaceId: true } },
    },
  });
}

export default async function FeatureRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuth();
  const feature = await getFeatureRequest(id);

  if (!feature) {
    notFound();
  }

  const tasksDone = feature.prd?.tasks?.filter((t) => t.status === "done").length ?? 0;
  const totalTasks = feature.prd?.tasks?.length ?? 0;

  return (
    <>
      <DashboardHeader
        title={feature.title}
        description={feature.project.name}
      />
      <div className="flex flex-col gap-4 p-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={DASHBOARD_ROUTES.featureRequests} />}
          >
            <ArrowLeftIcon />
            Back to features
          </Button>
        </div>

        {/* Status & Metadata */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LightbulbIcon className="size-4 text-muted-foreground" />
              Feature Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{feature.status.replace(/_/g, " ")}</Badge>
              <Badge variant="outline">{feature.priority}</Badge>
              <Badge variant="outline">{feature.source}</Badge>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {feature.description}
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Created {formatDistanceToNow(feature.createdAt, { addSuffix: true })}</span>
              <span>Updated {formatDistanceToNow(feature.updatedAt, { addSuffix: true })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Actions */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <RocketIcon className="size-4 text-muted-foreground" />
              Workflow Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(feature.status === "new" || feature.status === "clarifying") && (
              <FeatureWorkflowActions featureId={feature.id} status={feature.status} />
            )}
            {feature.status === "prd_ready" && feature.prd && (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={`${DASHBOARD_ROUTES.prd}/${feature.prd.id}`} />}
              >
                <FileTextIcon className="size-4" />
                View & Approve PRD
              </Button>
            )}
            {feature.status === "tasks_ready" && (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={DASHBOARD_ROUTES.tasks} />}
              >
                <KanbanIcon className="size-4" />
                View Task Board
              </Button>
            )}
            {feature.status === "human_review" && (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={`${DASHBOARD_ROUTES.releases}/${feature.id}`} />}
              >
                <RocketIcon className="size-4" />
                Review & Approve Release
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PRD Summary */}
        {feature.prd && (
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileTextIcon className="size-4 text-muted-foreground" />
                  Product Requirements Document
                </span>
                <Badge variant="secondary" className="text-xs">
                  {feature.prd.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Problem Statement</h4>
                <p className="text-sm">{feature.prd.problemStatement}</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{(feature.prd.goals as string[]).length} goals</span>
                <span>{(feature.prd.acceptanceCriteria as string[]).length} criteria</span>
                <span>{(feature.prd.edgeCases as string[]).length} edge cases</span>
                <span>{tasksDone}/{totalTasks} tasks done</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={`${DASHBOARD_ROUTES.prd}/${feature.prd.id}`} />}
              >
                Open Full PRD
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Clarification Conversation */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquareIcon className="size-4 text-muted-foreground" />
              Clarification Conversation
              <Badge variant="outline" className="text-xs ml-auto">
                {feature.messages.length} messages
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feature.messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No clarification conversation yet. Click &quot;Ask AI for Clarification&quot;
                  to start gathering requirements.
                </p>
                <Separator />
                <ClarificationChat featureId={feature.id} status={feature.status} />
              </div>
            ) : (
              <div className="space-y-4">
                {feature.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "assistant"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {msg.role === "assistant" ? (
                        <BotIcon className="size-4" />
                      ) : (
                        <UserIcon className="size-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium">
                        {msg.role === "assistant" ? "AI Agent" : "You"}
                        <span className="text-muted-foreground font-normal ml-2">
                          {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                <Separator />
                <ClarificationChat featureId={feature.id} status={feature.status} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
