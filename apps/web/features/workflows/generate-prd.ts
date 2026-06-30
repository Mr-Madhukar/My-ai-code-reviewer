/**
 * PRD Generation — Inngest Workflow
 *
 * Generates a structured PRD from feature request + clarification conversation.
 * Uses AI SDK with OpenRouter to produce structured JSON with:
 * - Problem statement, Goals, Non-goals
 * - User stories, Acceptance criteria
 * - Edge cases, Success metrics
 */

import { inngest } from "@/features/inngest/client";
import { prisma } from "@/lib/db";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const generatePrd = inngest.createFunction(
  {
    id: "generate-prd",
    retries: 2,
    triggers: [{ event: "shipflow/prd.generate" }],
  },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;

    // Step 1: Fetch feature request with conversation
    const featureRequest = await step.run("fetch-feature-request", async () => {
      const fr = await prisma.featureRequest.findUnique({
        where: { id: featureRequestId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!fr) throw new Error(`Feature request ${featureRequestId} not found`);
      return fr;
    });

    // Step 2: Transition to prd_generation state
    await step.run("transition-to-generating", async () => {
      await prisma.featureRequest.update({
        where: { id: featureRequestId },
        data: { status: "prd_generation" },
      });
    });

    // Step 3: Generate PRD via AI
    const prdData = await step.run("ai-generate-prd", async () => {
      const conversationContext = featureRequest.messages
        .map((m) => `${m.role === "user" ? "User" : "AI Agent"}: ${m.content}`)
        .join("\n");

      const prompt = `You are a senior product manager. Generate a structured Product Requirements Document (PRD) based on the following feature request and any clarification conversation.

## Feature Request
**Title:** ${featureRequest.title}
**Description:** ${featureRequest.description}
**Priority:** ${featureRequest.priority}

${conversationContext ? `## Clarification Conversation\n${conversationContext}` : ""}

## Instructions
Generate a comprehensive PRD with the following sections. Return your response as valid JSON with this exact structure:

{
  "problemStatement": "Clear description of the problem being solved",
  "goals": ["Goal 1", "Goal 2", ...],
  "nonGoals": ["Non-goal 1", "Non-goal 2", ...],
  "userStories": [
    { "as": "a [role]", "iWant": "to [action]", "soThat": "[benefit]" }
  ],
  "acceptanceCriteria": ["Criterion 1", "Criterion 2", ...],
  "edgeCases": ["Edge case 1", "Edge case 2", ...],
  "successMetrics": ["Metric 1", "Metric 2", ...]
}

Be thorough, specific, and actionable. Think about edge cases carefully.`;

      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash"),
        prompt,
        maxOutputTokens: 4000,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to extract JSON from AI response");

      return JSON.parse(jsonMatch[0]) as {
        problemStatement: string;
        goals: string[];
        nonGoals: string[];
        userStories: Array<{ as: string; iWant: string; soThat: string }>;
        acceptanceCriteria: string[];
        edgeCases: string[];
        successMetrics: string[];
      };
    });

    // Step 4: Save PRD to database
    const prd = await step.run("save-prd", async () => {
      return prisma.pRD.create({
        data: {
          featureRequestId,
          problemStatement: prdData.problemStatement,
          goals: prdData.goals,
          nonGoals: prdData.nonGoals,
          userStories: prdData.userStories,
          acceptanceCriteria: prdData.acceptanceCriteria,
          edgeCases: prdData.edgeCases,
          successMetrics: prdData.successMetrics,
        },
      });
    });

    // Step 5: Transition to prd_ready
    await step.run("transition-to-prd-ready", async () => {
      await prisma.featureRequest.update({
        where: { id: featureRequestId },
        data: { status: "prd_ready" },
      });
    });

    return { prdId: prd.id, status: "prd_ready" };
  }
) as any;
