/**
 * Inngest Client
 *
 * Shared Inngest client used by all background workflow functions.
 * Event types are defined here for type-safe event emission.
 */

import { Inngest } from "inngest";

/** All Inngest event types used in the ShipFlow platform. */
type ShipFlowEvents = {
  /** Trigger AI clarification for a feature request. */
  "shipflow/feature.clarify": {
    data: { featureRequestId: string };
  };
  /** Trigger PRD generation from feature request + clarification. */
  "shipflow/prd.generate": {
    data: { featureRequestId: string };
  };
  /** Trigger task generation from a PRD. */
  "shipflow/tasks.generate": {
    data: { prdId: string };
  };
  /** Trigger AI code review for a pull request. */
  "shipflow/pr.review": {
    data: {
      pullRequestId: string;
      featureRequestId?: string;
    };
  };
  /** Trigger re-review after fix. */
  "shipflow/pr.re-review": {
    data: {
      pullRequestId: string;
      previousReviewId: string;
    };
  };
  /** Trigger full repo sync to vector store. */
  "shipflow/repo.sync": {
    data: {
      projectId: string;
      repoFullName: string;
      installationId: number;
      branch: string;
    };
  };
  /** Check release readiness for a feature. */
  "shipflow/release.check": {
    data: { featureRequestId: string };
  };
};

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new Map(Object.entries({} as ShipFlowEvents)),
});
