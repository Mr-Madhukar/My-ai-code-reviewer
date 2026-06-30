/**
 * BetterAuth Server Configuration
 *
 * Configures authentication with GitHub OAuth and the organization plugin
 * for multi-tenant workspace support. Uses Prisma as the database adapter.
 */

import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@shipflow/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),

  // Email & password disabled — GitHub OAuth only
  emailAndPassword: { enabled: false },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  plugins: [
    // Multi-tenant organization support (maps to Workspace)
    organization({
      // Allow users to create organizations
      allowUserToCreateOrganization: true,
    }),
  ],

  session: {
    // Sessions last 30 days
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24, // refresh session every 24h
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ],
});

export type Auth = typeof auth;
