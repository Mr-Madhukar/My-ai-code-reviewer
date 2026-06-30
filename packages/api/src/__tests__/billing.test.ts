/**
 * Billing Router — Unit Tests
 *
 * Tests billing endpoints, role-based checks, and workspace-level upgrade/downgrade logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUnauthenticatedCaller, createWorkspaceCaller, TEST_USER } from "./helpers";

// Mock the @shipflow/db module
vi.mock("@shipflow/db", () => ({
  db: {},
  workspaceRepo: {
    isMember: vi.fn().mockResolvedValue(true),
    getMemberRole: vi.fn().mockResolvedValue("owner"),
    findById: vi.fn().mockResolvedValue({
      id: "ws_test_001",
      plan: "free",
      subscriptionStatus: "active",
      subscriptionRenewsAt: null,
      aiReviewCredits: 10,
      repoLimit: 2,
    }),
    updateBilling: vi.fn().mockResolvedValue({
      id: "ws_test_001",
      subscriptionStatus: "cancelled",
    }),
  },
}));

describe("billingRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStatus", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.billing.getStatus({ workspaceId: "ws_test_001" })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("returns billing status for workspace member", async () => {
      const caller = createWorkspaceCaller();
      const status = await caller.billing.getStatus({ workspaceId: "ws_test_001" });
      expect(status).toEqual({
        plan: "free",
        subscriptionStatus: "active",
        subscriptionRenewsAt: null,
        aiReviewCredits: 10,
        repoLimit: 2,
      });
    });
  });

  describe("createCheckout", () => {
    it("rejects non-admin/non-owner members", async () => {
      const { workspaceRepo } = await import("@shipflow/db");
      vi.mocked(workspaceRepo.getMemberRole).mockResolvedValueOnce("member");

      const caller = createWorkspaceCaller();
      await expect(
        caller.billing.createCheckout({ workspaceId: "ws_test_001", planId: "pro" })
      ).rejects.toThrow("Admin access required for this action.");
    });

    it("returns checkout details for owners", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.billing.createCheckout({
        workspaceId: "ws_test_001",
        planId: "pro",
      });
      expect(result).toBeDefined();
      expect(result.planId).toBe("pro");
      expect(result.subscriptionId).toContain("sub_placeholder_ws_test_001");
    });
  });

  describe("cancelSubscription", () => {
    it("rejects non-admin/non-owner members", async () => {
      const { workspaceRepo } = await import("@shipflow/db");
      vi.mocked(workspaceRepo.getMemberRole).mockResolvedValueOnce("member");

      const caller = createWorkspaceCaller();
      await expect(
        caller.billing.cancelSubscription({ workspaceId: "ws_test_001" })
      ).rejects.toThrow("Admin access required for this action.");
    });

    it("cancels subscription for admin", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.billing.cancelSubscription({ workspaceId: "ws_test_001" });
      expect(result).toBeDefined();
      expect(result.subscriptionStatus).toBe("cancelled");
    });
  });
});
