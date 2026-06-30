/**
 * Workspace Router — Unit Tests
 *
 * Tests CRUD operations, input validation, and auth enforcement
 * for workspace management.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUnauthenticatedCaller, createAuthenticatedCaller, TEST_USER } from "./helpers";

// Mock the @shipflow/db module
vi.mock("@shipflow/db", () => ({
  db: {},
  workspaceRepo: {
    create: vi.fn().mockResolvedValue({
      id: "ws_new",
      name: "Test Workspace",
      slug: "test-workspace",
      plan: "free",
      createdAt: new Date(),
    }),
    listByUserId: vi.fn().mockResolvedValue([
      { id: "ws_1", name: "Workspace 1", slug: "workspace-1" },
      { id: "ws_2", name: "Workspace 2", slug: "workspace-2" },
    ]),
    findBySlug: vi.fn().mockResolvedValue({
      id: "ws_1",
      name: "Workspace 1",
      slug: "workspace-1",
    }),
    findById: vi.fn().mockResolvedValue({
      id: "ws_1",
      name: "Workspace 1",
      slug: "workspace-1",
    }),
    update: vi.fn().mockResolvedValue({
      id: "ws_1",
      name: "Updated Workspace",
    }),
    addMember: vi.fn().mockResolvedValue({ userId: "user_2", role: "member" }),
    removeMember: vi.fn().mockResolvedValue(true),
    isMember: vi.fn().mockResolvedValue(true),
    getMemberRole: vi.fn().mockResolvedValue("owner"),
  },
}));

describe("workspaceRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.workspace.create({ name: "Test", slug: "test" })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("creates a workspace for authenticated user", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.workspace.create({
        name: "Test Workspace",
        slug: "test-workspace",
      });
      expect(result).toBeDefined();
      expect(result.id).toBe("ws_new");
      expect(result.name).toBe("Test Workspace");
    });

    it("validates slug format — rejects uppercase", async () => {
      const caller = createAuthenticatedCaller();
      await expect(
        caller.workspace.create({ name: "Test", slug: "UPPERCASE" })
      ).rejects.toThrow();
    });

    it("validates slug format — rejects spaces", async () => {
      const caller = createAuthenticatedCaller();
      await expect(
        caller.workspace.create({ name: "Test", slug: "has spaces" })
      ).rejects.toThrow();
    });

    it("validates name length — rejects too short", async () => {
      const caller = createAuthenticatedCaller();
      await expect(
        caller.workspace.create({ name: "X", slug: "valid-slug" })
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(caller.workspace.list()).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("returns workspaces for authenticated user", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.workspace.list();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Workspace 1");
    });
  });

  describe("getBySlug", () => {
    it("returns workspace by slug", async () => {
      const caller = createAuthenticatedCaller();
      const result = await caller.workspace.getBySlug({ slug: "workspace-1" });
      expect(result).toBeDefined();
      expect(result?.slug).toBe("workspace-1");
    });
  });
});
