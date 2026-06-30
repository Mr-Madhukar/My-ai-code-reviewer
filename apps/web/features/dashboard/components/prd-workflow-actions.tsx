"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircleIcon, XCircleIcon, KanbanIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approvePrdAction, requestPrdRevisionAction, triggerTaskGenerationAction } from "@/lib/actions/features";

type PrdWorkflowActionsProps = {
  prdId: string;
  type: "editor-header" | "generate-tasks-cta";
};

export function PrdWorkflowActions({ prdId, type }: PrdWorkflowActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      try {
        await approvePrdAction(prdId);
        toast.success("PRD approved successfully.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to approve PRD");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await requestPrdRevisionAction(prdId);
        toast.success("Revision requested from AI.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to request revision");
      }
    });
  }

  function handleGenerateTasks() {
    startTransition(async () => {
      try {
        await triggerTaskGenerationAction(prdId);
        toast.success("Decomposing PRD into engineering tasks...");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate tasks");
      }
    });
  }

  if (type === "editor-header") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleReject}>
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <XCircleIcon className="size-4" />
          )}
          Request Revision
        </Button>
        <Button size="sm" disabled={isPending} onClick={handleApprove}>
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckCircleIcon className="size-4" />
          )}
          Approve PRD
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" disabled={isPending} onClick={handleGenerateTasks} className="gap-1.5">
      {isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <KanbanIcon className="size-4" />
      )}
      Generate Tasks
    </Button>
  );
}
