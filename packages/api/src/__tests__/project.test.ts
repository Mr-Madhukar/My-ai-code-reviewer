/**
 * Project Router — Unit Tests
 *
 * Tests CRUD operations for projects, active workspace checking,
 * and repo connection/disconnection admin gates.
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
  projectRepo: {
    create: vi.fn().mockResolvedValue({
      id: "proj_new",
      workspaceId: "ws_test_001",
      name: "New Project",
      description: "My project desc",
    }),
    listByWorkspace: vi.fn().mockResolvedValue([
      { id: "proj_1", name: "Project 1" },
      { id: "proj_2", name: "Project 2" },
    ]),
    findById: vi.fn().mockResolvedValue({
      id: "proj_1",
      workspaceId: "ws_test_001",
      name: "Project 1",
    }),
    update: vi.fn().mockResolvedValue({
      id: "proj_1",
      name: "Updated Name",
    }),
    connectRepo: vi.fn().mockResolvedValue({
      id: "proj_1",
      repoFullName: "owner/repo",
      githubInstallationId: 12345,
    }),
    disconnectRepo: vi.fn().mockResolvedValue({
      id: "proj_1",
      repoFullName: null,
      githubInstallationId: null,
    }),
    delete: vi.fn().mockResolvedValue({
      id: "proj_1",
    }),
  },
}));

describe("projectRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.project.create({ workspaceId: "ws_test_001", name: "Test" })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("creates project for workspace member", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.project.create({
        workspaceId: "ws_test_001",
        name: "New Project",
        description: "My project desc",
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("proj_new");
      expect(result.name).toBe("New Project");
    });
  });

  describe("list", () => {
    it("lists projects in workspace", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.project.list({ workspaceId: "ws_test_001" });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("proj_1");
    });
  });

  describe("getById", () => {
    it("returns project details", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.project.getById({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe("proj_1");
    });
  });

  describe("update", () => {
    it("updates project parameters", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.project.update({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
        name: "Updated Name",
      });
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Name");
    });
  });

  describe("connectRepo", () => {
    it("rejects non-admin workspace users", async () => {
      const { workspaceRepo } = await import("@shipflow/db");
      vi.mocked(workspaceRepo.getMemberRole).mockResolvedValueOnce("member");

      const caller = createWorkspaceCaller();
      await expect(
        caller.project.connectRepo({
          workspaceId: "ws_test_001",
          projectId: "proj_1",
          repoFullName: "owner/repo",
          installationId: 12345,
        })
      ).rejects.toThrow("Admin access required for this action.");
    });

    it("connects repo for workspace admin", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.project.connectRepo({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
        repoFullName: "owner/repo",
        installationId: 12345,
      });
      expect(result.repoFullName).toBe("owner/repo");
      expect(result.githubInstallationId).toBe(12345);
    });
  });

  describe("disconnectRepo", () => {
    it("disconnects repo for admin", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.project.disconnectRepo({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
      });
      expect(result.repoFullName).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes project for admin", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.project.delete({
        workspaceId: "ws_test_001",
        projectId: "proj_1",
      });
      expect(result.id).toBe("proj_1");
    });
  });
});
