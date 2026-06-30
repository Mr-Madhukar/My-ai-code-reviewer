/**
 * Prisma ORM configuration (Prisma 6+ config file format).
 *
 * Points to the canonical schema in packages/db/prisma/ which contains all
 * ShipFlow models (Auth, Workspaces, Projects, Features, PRDs, Tasks,
 * Pull Requests, Reviews, Releases, RepoSync).
 *
 * The root prisma/schema.prisma is a legacy file and should NOT be used
 * for migrations — always use the packages/db schema.
 */

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "packages/db/prisma/schema.prisma",
  migrations: {
    path: "packages/db/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
