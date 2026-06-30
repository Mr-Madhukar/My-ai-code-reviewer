/**
 * Pull Request Repository
 *
 * Database operations for tracked pull requests and their reviews.
 */

import { db } from "../client";

export const pullRequestRepo = {
  /** Create or update a pull request record (upsert on repoFullName + prNumber). */
  async upsert(data: {
    projectId: string;
    installationId: number;
    repoFullName: string;
    prNumber: number;
    title: string;
    authorLogin?: string;
    headSha: string;
    baseBranch: string;
  }) {
    return db.pullRequest.upsert({
      where: {
        repoFullName_prNumber: {
          repoFullName: data.repoFullName,
          prNumber: data.prNumber,
        },
      },
      create: data,
      update: {
        title: data.title,
        headSha: data.headSha,
        authorLogin: data.authorLogin,
      },
    });
  },

  /** Find a PR by id. */
  async findById(id: string) {
    return db.pullRequest.findUnique({
      where: { id },
      include: {
        reviews: {
          include: { issues: true },
          orderBy: { createdAt: "desc" },
        },
        project: { select: { id: true, name: true, workspaceId: true } },
      },
    });
  },

  /** Find a PR by repo + number. */
  async findByRepoAndNumber(repoFullName: string, prNumber: number) {
    return db.pullRequest.findUnique({
      where: { repoFullName_prNumber: { repoFullName, prNumber } },
      include: {
        reviews: {
          include: { issues: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  /** List PRs for a project. */
  async listByProject(projectId: string) {
    return db.pullRequest.findMany({
      where: { projectId },
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Update PR status. */
  async updateStatus(id: string, status: string) {
    return db.pullRequest.update({ where: { id }, data: { status } });
  },
};
