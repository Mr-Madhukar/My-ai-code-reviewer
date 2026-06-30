/**
 * Workspace Repository
 *
 * Abstracts all database operations for Workspace and WorkspaceMember models.
 * All workspace-scoped queries go through this repository.
 */

import { db } from "../client";

export const workspaceRepo = {
  /** Create a new workspace and add the creator as owner. */
  async create(data: { name: string; slug: string; creatorUserId: string }) {
    return db.workspace.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: {
          create: {
            userId: data.creatorUserId,
            role: "owner",
          },
        },
      },
      include: { members: true },
    });
  },

  /** Find a workspace by its unique slug. */
  async findBySlug(slug: string) {
    return db.workspace.findUnique({
      where: { slug },
      include: { members: { include: { user: true } } },
    });
  },

  /** Find a workspace by id. */
  async findById(id: string) {
    return db.workspace.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });
  },

  /** List all workspaces a user belongs to. */
  async listByUserId(userId: string) {
    return db.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Update workspace details. */
  async update(id: string, data: { name?: string; slug?: string; logo?: string }) {
    return db.workspace.update({ where: { id }, data });
  },

  /** Add a member to a workspace. */
  async addMember(workspaceId: string, userId: string, role: string = "member") {
    return db.workspaceMember.create({
      data: { workspaceId, userId, role },
    });
  },

  /** Remove a member from a workspace. */
  async removeMember(workspaceId: string, userId: string) {
    return db.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
  },

  /** Check if a user is a member of a workspace. */
  async isMember(workspaceId: string, userId: string) {
    const member = await db.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    return !!member;
  },

  /** Get a member's role in a workspace. */
  async getMemberRole(workspaceId: string, userId: string) {
    const member = await db.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    return member?.role ?? null;
  },

  /** Update workspace billing fields. */
  async updateBilling(
    id: string,
    data: {
      plan?: string;
      razorpaySubscriptionId?: string;
      razorpayCustomerId?: string;
      subscriptionStatus?: string;
      subscriptionRenewsAt?: Date;
      aiReviewCredits?: number;
      repoLimit?: number;
    }
  ) {
    return db.workspace.update({ where: { id }, data });
  },

  /** Delete a workspace and cascade all children. */
  async delete(id: string) {
    return db.workspace.delete({ where: { id } });
  },
};
