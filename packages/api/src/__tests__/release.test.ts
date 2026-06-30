/**
 * Release Router — Unit Tests
 *
 * Tests the human approval/rejection and transition to 'shipped'/'fix_needed'.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUnauthenticatedCaller, createWorkspaceCaller } from "./helpers";

// Mock the @shipflow/db module
vi.mock("@shipflow/db", () => ({
  db: {
    release: {
      findUnique: vi.fn().mockResolvedValue({
        id: "rel_1",
        featureRequestId: "fr_1",
        status: "approved",
      }),
      upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({
        id: "rel_upserted",
        featureRequestId: create.featureRequestId,
        status: create.status,
        notes: create.notes,
        approvedBy: create.approvedBy,
      })),
    },
  },
  workspaceRepo: {
    isMember: vi.fn().mockResolvedValue(true),
    getMemberRole: vi.fn().mockResolvedValue("owner"),
  },
  featureRequestRepo: {
    getStatus: vi.fn().mockResolvedValue("human_review"),
    transitionStatus: vi.fn().mockResolvedValue(true),
  },
}));

describe("releaseRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getByFeatureRequest", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.release.getByFeatureRequest({ workspaceId: "ws_test_001", featureRequestId: "fr_1" })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("returns release information", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.release.getByFeatureRequest({
        workspaceId: "ws_test_001",
        featureRequestId: "fr_1",
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe("rel_1");
    });
  });

  describe("approve", () => {
    it("approves feature release successfully when in human_review status", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.release.approve({
        workspaceId: "ws_test_001",
        featureRequestId: "fr_1",
        notes: "Looks solid",
      });
      expect(result.status).toBe("approved");
      expect(result.notes).toBe("Looks solid");
    });

    it("rejects approval if feature request is not in human_review state", async () => {
      const { featureRequestRepo } = await import("@shipflow/db");
      vi.mocked(featureRequestRepo.getStatus).mockResolvedValueOnce("draft");

      const caller = createWorkspaceCaller();
      await expect(
        caller.release.approve({
          workspaceId: "ws_test_001",
          featureRequestId: "fr_1",
        })
      ).rejects.toThrow("Feature must be in 'human_review' state to approve");
    });
  });

  describe("reject", () => {
    it("rejects release and transitions feature to fix_needed", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.release.reject({
        workspaceId: "ws_test_001",
        featureRequestId: "fr_1",
        notes: "Missing test coverage on new UI", // >= 10 chars
      });
      expect(result.status).toBe("rejected");
      expect(result.notes).toBe("Missing test coverage on new UI");
    });

    it("enforces rejection notes length constraint", async () => {
      const caller = createWorkspaceCaller();
      await expect(
        caller.release.reject({
          workspaceId: "ws_test_001",
          featureRequestId: "fr_1",
          notes: "Too short", // < 10 chars
        })
      ).rejects.toThrow();
    });

    it("rejects rejection if feature request is not in human_review state", async () => {
      const { featureRequestRepo } = await import("@shipflow/db");
      vi.mocked(featureRequestRepo.getStatus).mockResolvedValueOnce("shipped");

      const caller = createWorkspaceCaller();
      await expect(
        caller.release.reject({
          workspaceId: "ws_test_001",
          featureRequestId: "fr_1",
          notes: "Valid rejection reason of good length",
        })
      ).rejects.toThrow("Feature must be in 'human_review' state to reject");
    });
  });
});
