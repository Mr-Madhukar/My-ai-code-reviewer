/**
 * Project Repository
 *
 * Abstracts database operations for the Project model.
 * Projects belong to a workspace and optionally connect to a GitHub repository.
 */

import { db } from "../client";

export const projectRepo = {
  /** Create a new project within a workspace. */
  async create(data: {
    workspaceId: string;
    name: string;
    description?: string;
    repoFullName?: string;
    githubInstallationId?: number;
  }) {
    return db.project.create({ data });
  },

  /** Find a project by id. */
  async findById(id: string) {
    return db.project.findUnique({
      where: { id },
      include: {
        workspace: true,
        _count: { select: { featureRequests: true, pullRequests: true } },
      },
    });
  },

  /** List all projects in a workspace. */
  async listByWorkspace(workspaceId: string) {
    return db.project.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { featureRequests: true, pullRequests: true } },
        repoSync: { select: { status: true, syncedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Update a project. */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      repoFullName?: string;
      githubInstallationId?: number;
    }
  ) {
    return db.project.update({ where: { id }, data });
  },

  /** Connect a GitHub repo to a project. */
  async connectRepo(id: string, repoFullName: string, installationId: number) {
    return db.project.update({
      where: { id },
      data: { repoFullName, githubInstallationId: installationId },
    });
  },

  /** Disconnect GitHub repo from a project. */
  async disconnectRepo(id: string) {
    return db.project.update({
      where: { id },
      data: { repoFullName: null, githubInstallationId: null },
    });
  },

  /** Delete a project. */
  async delete(id: string) {
    return db.project.delete({ where: { id } });
  },
};
