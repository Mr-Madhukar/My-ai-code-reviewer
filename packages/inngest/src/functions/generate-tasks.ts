/**
 * Task Generation — Inngest Function
 *
 * Decomposes an approved PRD into atomic engineering tasks.
 * Uses AI to break down requirements into implementable work items.
 */

import { inngest } from "../client";
import { prdRepo, taskRepo, featureRequestRepo } from "@shipflow/db";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const generateTasks = inngest.createFunction(
  {
    id: "generate-tasks",
    retries: 2,
  },
  { event: "shipflow/tasks.generate" },
  async ({ event, step }) => {
    const { prdId } = event.data;

    // Step 1: Fetch the PRD
    const prd = await step.run("fetch-prd", async () => {
      const p = await prdRepo.findById(prdId);
      if (!p) throw new Error(`PRD ${prdId} not found`);
      return p;
    });

    // Step 2: Transition feature to planning state
    await step.run("transition-to-planning", async () => {
      await featureRequestRepo.transitionStatus(
        prd.featureRequest!.id,
        "planning"
      );
    });

    // Step 3: Generate tasks via AI
    const tasksData = await step.run("ai-generate-tasks", async () => {
      const prompt = `You are a senior engineering lead. Break down the following PRD into atomic engineering tasks.

## Problem Statement
${prd.problemStatement}

## Goals
${(prd.goals as string[]).map((g) => `- ${g}`).join("\n")}

## User Stories
${(prd.userStories as Array<{ as: string; iWant: string; soThat: string }>)
  .map((s) => `- As ${s.as}, I want ${s.iWant}, so that ${s.soThat}`)
  .join("\n")}

## Acceptance Criteria
${(prd.acceptanceCriteria as string[]).map((c) => `- ${c}`).join("\n")}

## Edge Cases
${(prd.edgeCases as string[]).map((e) => `- ${e}`).join("\n")}

## Instructions
Break this PRD into specific, implementable engineering tasks. Each task should be:
- Small enough for one developer to complete in 1-3 days
- Clear and unambiguous
- Testable

Return valid JSON array:
[
  {
    "title": "Short task title",
    "description": "Detailed description of what needs to be built",
    "priority": "high" | "medium" | "low"
  }
]

Order tasks by dependency — foundational tasks first, feature tasks next, polish tasks last.`;

      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash"),
        prompt,
        maxTokens: 4000,
      });

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Failed to extract JSON array from AI response");

      return JSON.parse(jsonMatch[0]) as Array<{
        title: string;
        description: string;
        priority?: string;
      }>;
    });

    // Step 4: Save tasks to database
    const tasks = await step.run("save-tasks", async () => {
      return taskRepo.createMany(prdId, tasksData);
    });

    // Step 5: Transition to tasks_ready
    await step.run("transition-to-tasks-ready", async () => {
      await featureRequestRepo.transitionStatus(
        prd.featureRequest!.id,
        "tasks_ready"
      );
    });

    return { taskCount: tasks.length, status: "tasks_ready" };
  }
);
