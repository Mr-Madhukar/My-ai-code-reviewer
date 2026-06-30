"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { BotIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerFeatureClarification, triggerPrdGeneration } from "@/lib/actions/features";

type FeatureWorkflowActionsProps = {
  featureId: string;
  status: string;
};

export function FeatureWorkflowActions({ featureId, status }: FeatureWorkflowActionsProps) {
  const [isPending, startTransition] = useTransition();

  const isClarifying = status === "clarifying";
  const isGeneratingPrd = status === "prd_generation";

  function handleStartClarification() {
    startTransition(async () => {
      try {
        await triggerFeatureClarification(featureId);
        toast.success("AI Clarification started. The agent will ask questions shortly.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start clarification");
      }
    });
  }

  function handleGeneratePrd() {
    startTransition(async () => {
      try {
        await triggerPrdGeneration(featureId);
        toast.success("PRD Generation requested. The AI is writing the PRD...");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate PRD");
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending || isClarifying}
        onClick={handleStartClarification}
        className="gap-1.5"
      >
        {isPending && !isGeneratingPrd ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <BotIcon className="size-4" />
        )}
        {isClarifying ? "Clarification Active" : "Ask AI for Clarification"}
      </Button>

      <Button
        size="sm"
        disabled={isPending}
        onClick={handleGeneratePrd}
        className="gap-1.5"
      >
        {isPending && isGeneratingPrd ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <FileTextIcon className="size-4" />
        )}
        Generate PRD
      </Button>
    </>
  );
}
