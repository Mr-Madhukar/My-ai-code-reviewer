/**
 * Feature Request Router — Unit Tests
 *
 * Tests CRUD, status transition, and AI-chat user messages on Feature Requests.
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
  featureRequestRepo: {
    create: vi.fn().mockResolvedValue({
      id: "fr_new",
      projectId: "proj_1",
      title: "New Feature",
      description: "Feature description of good length",
      source: "manual",
      priority: "medium",
      status: "draft",
    }),
    listByProject: vi.fn().mockResolvedValue([
      { id: "fr_1", title: "Feature 1", status: "draft" },
      { id: "fr_2", title: "Feature 2", status: "clarifying" },
    ]),
    findById: vi.fn().mockResolvedValue({
      id: "fr_1",
      title: "Feature 1",
      description: "Feature description of good length",
      status: "draft",
    }),
    addMessage: vi.fn().mockResolvedValue({
      id: "msg_1",
      featureRequestId: "fr_1",
      role: "user",
      content: "Hello",
    }),
    transitionStatus: vi.fn().mockResolvedValue({
      id: "fr_1",
      status: "clarifying",
    }),
    update: vi.fn().mockResolvedValue({
      id: "fr_1",
      title: "Updated Title",
    }),
    delete: vi.fn().mockResolvedValue({
      id: "fr_1",
    }),
  },
}));

describe("featureRequestRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.featureRequest.create({
          workspaceId: "ws_test_001",
          projectId: "proj_1",
          title: "New Feature",
          description: "Feature description of good length",
        })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("creates feature request successfully", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.featureRequest.create({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
        title: "New Feature",
        description: "Feature description of good length",
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("fr_new");
      expect(result.title).toBe("New Feature");
    });

    it("enforces title length validation", async () => {
      const caller = createWorkspaceCaller();
      await expect(
        caller.featureRequest.create({
          workspaceId: "ws_test_001",
          projectId: "proj_1",
          title: "Hi",
          description: "Feature description of good length",
        })
      ).rejects.toThrow();
    });

    it("enforces description length validation", async () => {
      const caller = createWorkspaceCaller();
      await expect(
        caller.featureRequest.create({
          workspaceId: "ws_test_001",
          projectId: "proj_1",
          title: "New Feature",
          description: "Short",
        })
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("returns feature requests for project", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.featureRequest.list({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("fr_1");
    });
  });

  describe("getById", () => {
    it("returns feature request detail", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.featureRequest.getById({
        workspaceId: "ws_test_001",
        id: "fr_1",
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe("fr_1");
    });
  });

  describe("sendMessage", () => {
    it("appends user message to feature request", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.featureRequest.sendMessage({
        workspaceId: "ws_test_001",
        featureRequestId: "fr_1",
        content: "Clarified requirements",
      });
      expect(result).toBeDefined();
      expect(result.role).toBe("user");
    });
  });

  describe("transitionStatus", () => {
    it("transitions feature request state", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.featureRequest.transitionStatus({
        workspaceId: "ws_test_001",
        id: "fr_1",
        status: "clarifying",
      });
      expect(result.status).toBe("clarifying");
    });
  });

  describe("update", () => {
    it("updates feature details", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.featureRequest.update({
        workspaceId: "ws_test_001",
        id: "fr_1",
        title: "Updated Title",
      });
      expect(result.title).toBe("Updated Title");
    });
  });

  describe("delete", () => {
    it("deletes feature request", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.featureRequest.delete({
        workspaceId: "ws_test_001",
        id: "fr_1",
      });
      expect(result.id).toBe("fr_1");
    });
  });
});
