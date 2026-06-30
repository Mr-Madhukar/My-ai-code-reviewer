/**
 * Feature Request Repository
 *
 * Handles the full lifecycle of feature requests including
 * status transitions and clarification messages.
 */

import { db } from "../client";

/** Valid state machine transitions for feature request status. */
const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ["clarifying", "prd_generation"],
  clarifying: ["prd_generation", "new"],
  prd_generation: ["prd_ready"],
  prd_ready: ["planning", "prd_generation"],
  planning: ["tasks_ready"],
  tasks_ready: ["in_development", "planning"],
  in_development: ["ai_review"],
  ai_review: ["fix_needed", "human_review"],
  fix_needed: ["ai_review"],
  human_review: ["fix_needed", "shipped"],
  shipped: [],
};

export const featureRequestRepo = {
  /** Create a new feature request. */
  async create(data: {
    projectId: string;
    title: string;
    description: string;
    source?: string;
    priority?: string;
  }) {
    return db.featureRequest.create({ data });
  },

  /** Find a feature request by id with all related data. */
  async findById(id: string) {
    return db.featureRequest.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        prd: { include: { tasks: { orderBy: { order: "asc" } } } },
        project: { include: { workspace: true } },
      },
    });
  },

  /** List feature requests for a project. */
  async listByProject(projectId: string, status?: string) {
    return db.featureRequest.findMany({
      where: { projectId, ...(status ? { status } : {}) },
      include: {
        _count: { select: { messages: true } },
        prd: { select: { id: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  /**
   * Transition the status with state machine validation.
   * Throws if the transition is not valid.
   */
  async transitionStatus(id: string, newStatus: string) {
    const current = await db.featureRequest.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!current) throw new Error(`Feature request ${id} not found`);

    const allowed = VALID_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `Invalid transition: ${current.status} → ${newStatus}. ` +
          `Allowed: ${allowed?.join(", ") ?? "none"}`
      );
    }

    return db.featureRequest.update({
      where: { id },
      data: { status: newStatus },
    });
  },

  /** Get the current status of a feature request. */
  async getStatus(id: string) {
    const result = await db.featureRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    return result?.status ?? null;
  },

  /** Add a clarification message to the conversation. */
  async addMessage(featureRequestId: string, role: "user" | "assistant", content: string) {
    return db.clarificationMessage.create({
      data: { featureRequestId, role, content },
    });
  },

  /** Get all clarification messages for a feature request. */
  async getMessages(featureRequestId: string) {
    return db.clarificationMessage.findMany({
      where: { featureRequestId },
      orderBy: { createdAt: "asc" },
    });
  },

  /** Update a feature request. */
  async update(id: string, data: { title?: string; description?: string; priority?: string }) {
    return db.featureRequest.update({ where: { id }, data });
  },

  /** Delete a feature request. */
  async delete(id: string) {
    return db.featureRequest.delete({ where: { id } });
  },
};
