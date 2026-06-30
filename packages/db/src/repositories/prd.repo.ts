/**
 * PRD Repository
 *
 * Database operations for Product Requirements Documents.
 */

import { db } from "../client";

export const prdRepo = {
  /** Create a PRD linked to a feature request. */
  async create(data: {
    featureRequestId: string;
    problemStatement: string;
    goals: string[];
    nonGoals: string[];
    userStories: Array<{ as: string; iWant: string; soThat: string }>;
    acceptanceCriteria: string[];
    edgeCases: string[];
    successMetrics: string[];
    rawMarkdown?: string;
  }) {
    return db.pRD.create({ data });
  },

  /** Find a PRD by id. */
  async findById(id: string) {
    return db.pRD.findUnique({
      where: { id },
      include: {
        featureRequest: { select: { id: true, title: true, status: true } },
        tasks: { orderBy: { order: "asc" } },
      },
    });
  },

  /** Find PRD by feature request id. */
  async findByFeatureRequestId(featureRequestId: string) {
    return db.pRD.findUnique({
      where: { featureRequestId },
      include: {
        tasks: { orderBy: { order: "asc" } },
      },
    });
  },

  /** Update PRD content. */
  async update(
    id: string,
    data: {
      problemStatement?: string;
      goals?: string[];
      nonGoals?: string[];
      userStories?: Array<{ as: string; iWant: string; soThat: string }>;
      acceptanceCriteria?: string[];
      edgeCases?: string[];
      successMetrics?: string[];
      rawMarkdown?: string;
      status?: string;
    }
  ) {
    return db.pRD.update({ where: { id }, data });
  },

  /** Approve a PRD. */
  async approve(id: string) {
    return db.pRD.update({ where: { id }, data: { status: "approved" } });
  },

  /** Request revision on a PRD. */
  async requestRevision(id: string) {
    return db.pRD.update({ where: { id }, data: { status: "revision_needed" } });
  },

  /** Delete a PRD. */
  async delete(id: string) {
    return db.pRD.delete({ where: { id } });
  },
};
