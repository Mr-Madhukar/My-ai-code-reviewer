/**
 * Review Router — Unit Tests
 *
 * Tests AI code review retrievals, issue resolution status, and PR history.
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
  reviewRepo: {
    listByPullRequest: vi.fn().mockResolvedValue([
      { id: "rev_1", pullRequestId: "pr_1", status: "completed" },
    ]),
    findById: vi.fn().mockResolvedValue({
      id: "rev_1",
      pullRequestId: "pr_1",
      issues: [{ id: "iss_1", content: "Bug", resolved: false }],
    }),
    listByWorkspace: vi.fn().mockResolvedValue([
      { id: "rev_1", workspaceId: "ws_test_001" },
    ]),
    resolveIssue: vi.fn().mockResolvedValue({
      id: "iss_1",
      resolved: true,
    }),
  },
  pullRequestRepo: {
    listByProject: vi.fn().mockResolvedValue([
      { id: "pr_1", title: "Add Auth", status: "open" },
    ]),
    findById: vi.fn().mockResolvedValue({
      id: "pr_1",
      title: "Add Auth",
      reviews: [{ id: "rev_1" }],
    }),
  },
}));

describe("reviewRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listByPullRequest", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.review.listByPullRequest({ workspaceId: "ws_test_001", pullRequestId: "pr_1" })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("returns reviews list for pull request", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.review.listByPullRequest({
        workspaceId: "ws_test_001",
        pullRequestId: "pr_1",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rev_1");
    });
  });

  describe("getById", () => {
    it("returns review details with issues", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.review.getById({
        workspaceId: "ws_test_001",
        id: "rev_1",
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe("rev_1");
      expect(result?.issues).toHaveLength(1);
    });
  });

  describe("history", () => {
    it("returns review history for workspace", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.review.history({
        workspaceId: "ws_test_001",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rev_1");
    });
  });

  describe("resolveIssue", () => {
    it("marks an issue as resolved", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.review.resolveIssue({
        workspaceId: "ws_test_001",
        issueId: "iss_1",
      });
      expect(result.resolved).toBe(true);
    });
  });

  describe("listPullRequests", () => {
    it("lists pull requests for a project", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.review.listPullRequests({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Add Auth");
    });
  });

  describe("getPullRequest", () => {
    it("returns single pull request with reviews", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.review.getPullRequest({
        workspaceId: "ws_test_001",
        id: "pr_1",
      });
      expect(result).toBeDefined();
      expect(result?.title).toBe("Add Auth");
    });
  });
});
