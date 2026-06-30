/**
 * Task Router — Unit Tests
 *
 * Tests Kanban board tasks, column transitions, status grouping, and CRUD.
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
  taskRepo: {
    listByPrd: vi.fn().mockResolvedValue([
      { id: "task_1", title: "Task 1", status: "todo" },
      { id: "task_2", title: "Task 2", status: "in_progress" },
    ]),
    listByPrdGrouped: vi.fn().mockResolvedValue({
      todo: [{ id: "task_1", title: "Task 1" }],
      in_progress: [{ id: "task_2", title: "Task 2" }],
      review: [],
      done: [],
    }),
    findById: vi.fn().mockResolvedValue({
      id: "task_1",
      title: "Task 1",
      status: "todo",
    }),
    create: vi.fn().mockResolvedValue({
      id: "task_new",
      title: "New Task",
      status: "todo",
    }),
    updateStatus: vi.fn().mockResolvedValue({
      id: "task_1",
      status: "in_progress",
    }),
    update: vi.fn().mockResolvedValue({
      id: "task_1",
      title: "Updated Task Title",
    }),
    reorder: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue({
      id: "task_1",
    }),
  },
}));

describe("taskRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listByPrd", () => {
    it("rejects unauthenticated calls", async () => {
      const caller = createUnauthenticatedCaller();
      await expect(
        caller.task.listByPrd({ workspaceId: "ws_test_001", prdId: "prd_1" })
      ).rejects.toThrow("You must be signed in to access this resource.");
    });

    it("returns task list for PRD", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.listByPrd({
        workspaceId: "ws_test_001",
        prdId: "prd_1",
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("task_1");
    });
  });

  describe("kanban", () => {
    it("returns grouped tasks for Kanban board", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.kanban({
        workspaceId: "ws_test_001",
        prdId: "prd_1",
      });
      expect(result.todo).toHaveLength(1);
      expect(result.in_progress).toHaveLength(1);
      expect(result.review).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("returns task details", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.getById({
        workspaceId: "ws_test_001",
        id: "task_1",
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe("task_1");
    });
  });

  describe("create", () => {
    it("creates a new engineering task", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.create({
        workspaceId: "ws_test_001",
        prdId: "prd_1",
        title: "New Task",
        description: "Task description",
      });
      expect(result.id).toBe("task_new");
      expect(result.title).toBe("New Task");
    });
  });

  describe("move", () => {
    it("updates task status column", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.move({
        workspaceId: "ws_test_001",
        id: "task_1",
        status: "in_progress",
      });
      expect(result.status).toBe("in_progress");
    });
  });

  describe("update", () => {
    it("updates task details", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.update({
        workspaceId: "ws_test_001",
        id: "task_1",
        title: "Updated Task Title",
      });
      expect(result.title).toBe("Updated Task Title");
    });
  });

  describe("reorder", () => {
    it("saves column ordering changes", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.reorder({
        workspaceId: "ws_test_001",
        taskOrders: [
          { id: "task_1", order: 1 },
          { id: "task_2", order: 2 },
        ],
      });
      expect(result).toBe(true);
    });
  });

  describe("delete", () => {
    it("deletes a task", async () => {
      const caller = createWorkspaceCaller();
      const result = await caller.task.delete({
        workspaceId: "ws_test_001",
        id: "task_1",
      });
      expect(result.id).toBe("task_1");
    });
  });
});
