/**
 * Sign-in page — GitHub OAuth entry point.
 *
 * Reads an optional `callbackUrl` search param so flows like GitHub App
 * installation can return the user to the right place after authentication.
 */

import type { Metadata } from "next";
import {
  RocketIcon,
  ShieldCheckIcon,
  ZapIcon,
  GitBranchIcon,
} from "lucide-react";
import { GithubSignInForm } from "@/components/auth/github-sign-in-form";

export const metadata: Metadata = {
  title: "Sign in · ShipFlow AI",
  description: "Sign in to ShipFlow AI with your GitHub account to start shipping faster.",
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

/**
 * Renders the sign-in card with ShipFlow AI branding and GitHub OAuth button.
 *
 * @param searchParams - Async search params (Next.js 15+) with optional `callbackUrl`.
 * @returns The sign-in page UI inside the auth layout.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="animate-slide-up">
      {/* Logo — desktop hidden (shown in left panel), mobile visible */}
      <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
          <RocketIcon className="size-5 text-primary" />
        </div>
        <span className="text-xl font-bold tracking-tight">ShipFlow AI</span>
      </div>

      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome{" "}
          <span className="bg-gradient-to-r from-primary via-blue-400 to-violet-500 bg-clip-text text-transparent">
            back
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with GitHub to review and manage your code.
        </p>
      </div>

      {/* Sign-in card */}
      <div className="rounded-lg border border-border/60 bg-card/50 p-6 backdrop-blur-sm card-glow">
        {/* GitHub sign-in form */}
        <GithubSignInForm callbackUrl={callbackUrl} />

        {/* Permission note */}
        <p className="mt-4 text-center text-xs text-muted-foreground/80 leading-relaxed">
          We only request the permissions needed to identify your account.
          You can revoke access anytime from GitHub settings.
        </p>
      </div>

      {/* Trust signals */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { icon: ShieldCheckIcon, label: "Secure OAuth", color: "text-emerald-400" },
          { icon: ZapIcon, label: "Instant Setup", color: "text-amber-400" },
          { icon: GitBranchIcon, label: "GitHub Native", color: "text-blue-400" },
        ].map((signal) => (
          <div
            key={signal.label}
            className="flex flex-col items-center gap-1.5 rounded-md border border-border/30 bg-muted/10 px-2 py-3 text-center transition-colors hover:border-border/50"
          >
            <signal.icon className={`size-4 ${signal.color}`} />
            <span className="text-[10px] text-muted-foreground leading-tight">{signal.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
