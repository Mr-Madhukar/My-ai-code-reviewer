/**
 * PRD Router — Unit Tests
 *
 * Tests retrieval, editor updates, and approval/revision workflows on PRDs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUnauthenticatedCaller, createWorkspaceCaller } from "./helpers";

// Mock the @shipflow/db module
vi.mock("@shipflow/db", () => ({
  db: {},
  workspaceRepo: {
    isMember: vi.fn().mockResolvedValue(true),
    getMemberRole: vi.fn().mockResolvedValue("owner"),
  },
  prdRepo: {
    findById: vi.fn().mockResolvedValue({
      id: "prd_1",
      featureRequestId: "fr_1",
      problemStatement: "Old Statement",
      goals: ["Goal 1"],
      nonGoals: [],
      userStories: [],
      acceptanceCriteria: [],
      edgeCases: [],
      successMetrics: [],
    }),
    findByFeatureRequestId: vi.fn().mockResolvedValue({
      id: "prd_1",
      featureRequestId: "fr_1",
    }),
    update: vi.fn().mockResolvedValue({
      id: "prd_1",
      problemStatement: "New Problem Statement",
    }),
    approve: vi.fn().mockResolvedValue({
      id: "prd_1",
      status: "approved",
    }),
    requestRevision: vi.fn().mockResolvedValue({
      id: "prd_1",
      status: "revision_requested",
    }),
  },
}));

describe("prdRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getById", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.prd.getById({ workspaceId: "ws_test_001", id: "prd_1" })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("returns PRD details", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.prd.getById({
        workspaceId: "ws_test_001",
        id: "prd_1",
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe("prd_1");
    });
  });

  describe("getByFeatureRequest", () => {
    it("returns PRD for feature request", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.prd.getByFeatureRequest({
        workspaceId: "ws_test_001",
        featureRequestId: "fr_1",
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe("prd_1");
    });
  });

  describe("update", () => {
    it("saves edits from editor", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.prd.update({
        workspaceId: "ws_test_001",
        id: "prd_1",
        problemStatement: "New Problem Statement",
        goals: ["Goal A", "Goal B"],
      });
      expect(result).toBeDefined();
      expect(result.problemStatement).toBe("New Problem Statement");
    });
  });

  describe("approve", () => {
    it("approves PRD successfully", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.prd.approve({
        workspaceId: "ws_test_001",
        id: "prd_1",
      });
      expect(result.status).toBe("approved");
    });
  });

  describe("requestRevision", () => {
    it("requests revision on PRD", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.prd.requestRevision({
        workspaceId: "ws_test_001",
        id: "prd_1",
      });
      expect(result.status).toBe("revision_requested");
    });
  });
});
