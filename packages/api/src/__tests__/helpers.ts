/**
 * Shared test utilities for tRPC router tests.
 *
 * Uses `createCallerFactory` to create test callers that bypass HTTP
 * and call router procedures directly. Provides mock contexts for
 * different auth/workspace states.
 */

import { createCallerFactory, createTRPCContext } from "../trpc";
import { appRouter } from "../root";

const createCaller = createCallerFactory(appRouter);

/** Simulated authenticated user for tests. */
export const TEST_USER = {
  id: "user_test_001",
  name: "Test User",
  email: "test@shipflow.dev",
  image: null,
};

/** Simulated admin user for tests. */
export const TEST_ADMIN = {
  id: "user_admin_001",
  name: "Admin User",
  email: "admin@shipflow.dev",
  image: null,
};

/** A workspace ID that the test user belongs to. */
export const TEST_WORKSPACE_ID = "ws_test_001";

/**
 * Creates a tRPC caller with an unauthenticated context.
 * Used to test that protected routes reject unauthenticated requests.
 */
export function createUnauthenticatedCaller() {
  const ctx = createTRPCContext({ user: null });
  return createCaller(ctx);
}

/**
 * Creates a tRPC caller with an authenticated user context.
 * Does NOT set an active workspace — procedures requiring workspace
 * will need workspaceId in their input.
 */
export function createAuthenticatedCaller(user = TEST_USER) {
  const ctx = createTRPCContext({ user });
  return createCaller(ctx);
}

/**
 * Creates a tRPC caller with full workspace context.
 * The workspace middleware requires both auth + membership verification
 * via the database, so this sets the activeWorkspaceId.
 */
export function createWorkspaceCaller(
  user = TEST_USER,
  workspaceId = TEST_WORKSPACE_ID
) {
  const ctx = createTRPCContext({ user, activeWorkspaceId: workspaceId });
  return createCaller(ctx);
}
