/**
 * @module lib/actions/features
 * @description Server Actions for feature request pipeline and PRD approvals.
 */

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { inngest } from "@/features/inngest/client";
import { getServerSession } from "@/lib/auth-session";

/**
 * Triggers the AI Clarification Agent workflow for a feature request.
 */
export async function triggerFeatureClarification(featureRequestId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Update status to clarifying
  await prisma.featureRequest.update({
    where: { id: featureRequestId },
    data: { status: "clarifying" },
  });

  // Trigger Inngest clarification agent
  await inngest.send({
    name: "shipflow/feature.clarify",
    data: { featureRequestId },
  });

  revalidatePath(`/dashboard/features/${featureRequestId}`);
  revalidatePath("/dashboard/features");
}

/**
 * Sends a clarification message from the user to the AI agent and triggers the agent's turn.
 */
export async function sendClarificationMessageAction(featureRequestId: string, content: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Create message from user
  await prisma.clarificationMessage.create({
    data: {
      featureRequestId,
      role: "user",
      content,
    },
  });

  // Trigger Inngest clarification agent to respond
  await inngest.send({
    name: "shipflow/feature.clarify",
    data: { featureRequestId },
  });

  revalidatePath(`/dashboard/features/${featureRequestId}`);
}

/**
 * Triggers the PRD generation workflow.
 */
export async function triggerPrdGeneration(featureRequestId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Update status to prd_generation
  await prisma.featureRequest.update({
    where: { id: featureRequestId },
    data: { status: "prd_generation" },
  });

  // Trigger Inngest PRD generator
  await inngest.send({
    name: "shipflow/prd.generate",
    data: { featureRequestId },
  });

  revalidatePath(`/dashboard/features/${featureRequestId}`);
  revalidatePath("/dashboard/features");
}

/**
 * Approves a PRD draft, shifting the state to planning and triggering task generation.
 */
export async function approvePrdAction(prdId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const prd = await prisma.pRD.findUnique({
    where: { id: prdId },
    include: { featureRequest: true },
  });

  if (!prd) {
    throw new Error("PRD not found");
  }

  // Update PRD status to approved
  await prisma.pRD.update({
    where: { id: prdId },
    data: { status: "approved" },
  });

  // Update feature request status to planning
  if (prd.featureRequest) {
    await prisma.featureRequest.update({
      where: { id: prd.featureRequest.id },
      data: { status: "planning" },
    });
  }

  revalidatePath(`/dashboard/prd/${prdId}`);
  if (prd.featureRequest) {
    revalidatePath(`/dashboard/features/${prd.featureRequest.id}`);
  }
}

/**
 * Rejects a PRD draft and marks it as revision needed.
 */
export async function requestPrdRevisionAction(prdId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const prd = await prisma.pRD.findUnique({
    where: { id: prdId },
    include: { featureRequest: true },
  });

  if (!prd) {
    throw new Error("PRD not found");
  }

  // Update PRD status to revision_needed
  await prisma.pRD.update({
    where: { id: prdId },
    data: { status: "revision_needed" },
  });

  // Update feature request status to fix_needed
  if (prd.featureRequest) {
    await prisma.featureRequest.update({
      where: { id: prd.featureRequest.id },
      data: { status: "fix_needed" },
    });
  }

  revalidatePath(`/dashboard/prd/${prdId}`);
  if (prd.featureRequest) {
    revalidatePath(`/dashboard/features/${prd.featureRequest.id}`);
  }
}

/**
 * Triggers task decomposition from an approved PRD.
 */
export async function triggerTaskGenerationAction(prdId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Trigger Inngest task decomposition
  await inngest.send({
    name: "shipflow/tasks.generate",
    data: { prdId },
  });

  revalidatePath(`/dashboard/prd/${prdId}`);
  revalidatePath("/dashboard/tasks");
}

/**
 * Creates a new feature request inside a project.
 */
export async function createFeatureRequestAction(data: {
  projectId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
}) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const feature = await prisma.featureRequest.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: "new",
      source: "manual",
    },
  });

  revalidatePath("/dashboard/features");
  return feature;
}
