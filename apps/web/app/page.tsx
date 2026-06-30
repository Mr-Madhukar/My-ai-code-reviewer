/**
 * Public landing page (`/`).
 *
 * Marketing page for ShipFlow AI with hero section, feature showcase,
 * workflow pipeline visualization, pricing, and call-to-action.
 * Unauthenticated users see this; signed-in users can navigate to /dashboard.
 */

import Link from "next/link";
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircleIcon,
  CodeIcon,
  FileTextIcon,
  GitBranchIcon,
  GitPullRequestIcon,
  KanbanIcon,
  LightbulbIcon,
  RocketIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
  ZapIcon,
} from "lucide-react";

import { LandingNavAuth } from "@/components/landing/landing-nav-auth";
import { getServerSession } from "@/lib/auth-session";

export default async function LandingPage() {
  const session = await getServerSession();
  const user = session?.user ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-sm px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <RocketIcon className="size-5 text-primary" />
          ShipFlow AI
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Features
          </Link>
          <Link
            href="#workflow"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Pricing
          </Link>
          {user ? (
            <LandingNavAuth user={user} />
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign In with GitHub
            </Link>
          )}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
          <SparklesIcon className="size-3" />
          AI-Powered Software Delivery Pipeline
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
          From Feature Request
          <br />
          <span className="bg-gradient-to-r from-primary via-blue-400 to-violet-500 bg-clip-text text-transparent">
            to Production
          </span>
          <br />
          in One Pipeline
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground leading-relaxed sm:text-lg">
          ShipFlow AI generates PRDs, decomposes tasks, reviews code against
          requirements, and gates releases — so your team ships faster with
          fewer bugs.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-in"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started Free
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="#workflow"
            className="inline-flex h-12 items-center justify-center rounded-md border border-border px-8 text-sm font-medium transition-colors hover:bg-muted"
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* ─── Workflow Pipeline ─── */}
      <section id="workflow" className="px-6 py-20 border-t border-border/40">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl mb-4">
            The ShipFlow Core Loop
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-lg mx-auto">
            Every feature follows the same automated pipeline — from idea to
            production with AI at every step.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { icon: LightbulbIcon, label: "Feature\nRequest", color: "text-blue-400" },
              { icon: FileTextIcon, label: "AI-Generated\nPRD", color: "text-violet-400" },
              { icon: KanbanIcon, label: "Task\nBoard", color: "text-amber-400" },
              { icon: CodeIcon, label: "Code &\nAI Review", color: "text-green-400" },
              { icon: RocketIcon, label: "Human Approve\n& Ship", color: "text-emerald-400" },
            ].map((step, i) => (
              <div
                key={i}
                className="group flex flex-col items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-6 text-center transition-all hover:border-primary/30 hover:bg-muted/40"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-muted ${step.color}`}>
                  <step.icon className="size-6" />
                </div>
                <span className="text-xs font-medium whitespace-pre-line leading-tight">
                  {step.label}
                </span>
                {i < 4 && (
                  <ArrowRightIcon className="size-4 text-muted-foreground hidden lg:block absolute translate-x-[100px]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="px-6 py-20 border-t border-border/40 bg-muted/10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl mb-4">
            Everything You Need to Ship Confidently
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-lg mx-auto">
            AI agents handle the grunt work. Your team focuses on building.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BotIcon,
                title: "AI Clarification Agent",
                desc: "The AI asks smart follow-up questions to gather missing requirements before generating a PRD.",
              },
              {
                icon: FileTextIcon,
                title: "Auto-Generated PRDs",
                desc: "Structured Product Requirements Documents with goals, user stories, acceptance criteria, and edge cases.",
              },
              {
                icon: KanbanIcon,
                title: "Task Decomposition",
                desc: "PRDs are automatically broken into implementable engineering tasks on a Kanban board.",
              },
              {
                icon: ScanSearchIcon,
                title: "PRD-Aware Code Reviews",
                desc: "AI reviews every PR against the PRD — checking compliance, security, performance, and edge cases.",
              },
              {
                icon: GitPullRequestIcon,
                title: "Fix Loop & Re-Review",
                desc: "Blocking issues trigger a fix → re-review cycle. No code ships until all issues are resolved.",
              },
              {
                icon: UserCheckIcon,
                title: "Human Approval Gate",
                desc: "Final human sign-off before release. See PRD, tasks, reviews, and issues at a glance.",
              },
              {
                icon: GitBranchIcon,
                title: "GitHub Integration",
                desc: "Installs as a GitHub App. Auto-reviews on PR open/sync. Posts feedback as comments.",
              },
              {
                icon: ShieldCheckIcon,
                title: "Issue Categorization",
                desc: "Every finding is classified: blocking, non-blocking, or suggestion — with file/line references.",
              },
              {
                icon: ZapIcon,
                title: "Inngest Workflows",
                desc: "Durable background jobs with retry logic. Long-running AI tasks never block your requests.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-lg border border-border/40 bg-background p-6 transition-all hover:border-primary/20 hover:shadow-sm"
              >
                <Icon className="size-8 text-primary mb-3" />
                <h3 className="text-sm font-semibold mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="px-6 py-20 border-t border-border/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-12">
            Start free. Upgrade when you need unlimited power.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-lg border border-border/60 p-6">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="text-xs text-muted-foreground mt-1">
                For individual developers
              </p>
              <div className="my-6">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-sm text-muted-foreground"> /month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "5 AI reviews per month",
                  "3 connected repos",
                  "Public repositories",
                  "Community support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="size-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-in"
                className="inline-flex w-full h-10 items-center justify-center rounded-md border border-border text-sm font-medium transition-colors hover:bg-muted"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="rounded-lg border-2 border-primary/40 p-6 relative">
              <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Recommended
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="text-xs text-muted-foreground mt-1">
                For teams shipping production software
              </p>
              <div className="my-6">
                <span className="text-4xl font-bold">₹99</span>
                <span className="text-sm text-muted-foreground"> /month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "Unlimited AI reviews",
                  "Unlimited connected repos",
                  "Public & private repos",
                  "Priority support",
                  "PRD-aware reviews",
                  "Re-review loop",
                  "Release readiness checks",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="size-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-in"
                className="inline-flex w-full h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-20 border-t border-border/40 bg-muted/10 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
          Ready to Ship Faster?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Join developers using ShipFlow AI to automate their entire delivery
          pipeline — from feature request to production.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign In with GitHub
          <ArrowRightIcon className="size-4" />
        </Link>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RocketIcon className="size-4" />
            ShipFlow AI
          </div>
          <p className="text-xs text-muted-foreground">
            Built with Next.js, tRPC, Inngest, and Vercel AI SDK.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
