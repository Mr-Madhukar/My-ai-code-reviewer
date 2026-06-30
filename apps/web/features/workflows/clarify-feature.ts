/**
 * AI Clarification Agent — Inngest Workflow
 *
 * Phase 1 of the ShipFlow workflow: gathers missing requirements by
 * asking follow-up questions before PRD generation.
 *
 * The agent:
 * 1. Reads the feature request description and conversation so far
 * 2. Determines if enough context exists to generate a PRD
 * 3. If not, asks targeted clarification questions
 * 4. If sufficient, transitions to PRD generation
 *
 * Per the requirement: "AI Agent must gather missing requirements by
 * asking follow up questions to gather context"
 */

import { inngest } from "@/features/inngest/client";
import { prisma } from "@/lib/db";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const clarifyFeatureRequest = inngest.createFunction(
  {
    id: "clarify-feature-request",
    retries: 2,
    triggers: [{ event: "shipflow/feature.clarify" }],
  },
  async ({ event, step }) => {
    const { featureRequestId } = event.data;

    // Step 1: Fetch feature request with conversation
    const featureRequest = await step.run("fetch-feature-request", async () => {
      const fr = await prisma.featureRequest.findUnique({
        where: { id: featureRequestId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          project: { select: { name: true, description: true } },
        },
      });
      if (!fr) throw new Error(`Feature request ${featureRequestId} not found`);
      return fr;
    });

    // Step 2: Transition to clarifying state (if new)
    await step.run("transition-to-clarifying", async () => {
      const currentStatus = featureRequest.status;
      if (currentStatus === "new") {
        await prisma.featureRequest.update({
          where: { id: featureRequestId },
          data: { status: "clarifying" },
        });
      }
    });

    // Step 3: Generate AI clarification response
    const aiResponse = await step.run("ai-clarify", async () => {
      const conversationContext = featureRequest.messages
        .map((m) => `${m.role === "user" ? "User" : "AI Agent"}: ${m.content}`)
        .join("\n");

      const prompt = `You are a senior product manager helping to clarify a feature request. Your job is to gather enough context to generate a comprehensive PRD (Product Requirements Document).

## Project Context
**Project:** ${featureRequest.project?.name ?? "Unknown"}
**Project Description:** ${featureRequest.project?.description ?? "N/A"}

## Feature Request
**Title:** ${featureRequest.title}
**Description:** ${featureRequest.description}
**Priority:** ${featureRequest.priority}
**Source:** ${featureRequest.source}

${conversationContext ? `## Previous Conversation\n${conversationContext}` : ""}

## Instructions
Analyze the feature request and conversation. You must respond with valid JSON:

{
  "hasEnoughContext": true | false,
  "message": "Your response message to the user",
  "reasoning": "Brief internal reasoning about what information is missing or sufficient"
}

If hasEnoughContext is FALSE:
- Ask 2-4 specific, targeted questions to fill gaps
- Focus on: target users, expected behavior, edge cases, success criteria, technical constraints
- Be conversational and helpful, not robotic
- If the feature might already exist in the product, suggest that and ask for confirmation

If hasEnoughContext is TRUE:
- Confirm understanding with a brief summary
- Suggest proceeding to PRD generation
- Mention any assumptions you're making

Important: Not every request requires it to be built. If the feature already exists or doesn't make sense, educate the user about alternatives.`;

      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash"),
        prompt,
        maxOutputTokens: 2000,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to extract JSON from AI response");

      return JSON.parse(jsonMatch[0]) as {
        hasEnoughContext: boolean;
        message: string;
        reasoning: string;
      };
    });

    // Step 4: Save the AI response as a clarification message
    await step.run("save-ai-message", async () => {
      await prisma.clarificationMessage.create({
        data: {
          featureRequestId,
          role: "assistant",
          content: aiResponse.message,
        },
      });
    });

    // Step 5: If enough context, auto-transition to PRD generation
    if (aiResponse.hasEnoughContext) {
      await step.run("trigger-prd-generation", async () => {
        // The user can review and approve, or the system can auto-trigger
        // For now, we keep it in clarifying and let the user click "Generate PRD"
        await prisma.featureRequest.update({
          where: { id: featureRequestId },
          data: { status: "clarifying" }, // stays in clarifying until user triggers PRD
        });
      });
    }

    return {
      featureRequestId,
      hasEnoughContext: aiResponse.hasEnoughContext,
      message: aiResponse.message,
    };
  }
) as any;
