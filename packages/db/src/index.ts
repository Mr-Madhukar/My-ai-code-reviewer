/**
 * @shipflow/db — Package Entry Point
 *
 * Re-exports the Prisma client singleton and all repositories.
 */

export { db } from "./client";
export { PrismaClient } from "./client";

// Re-export all repositories
export * from "./repositories/index";
