/**
 * Layout for unauthenticated routes (sign-in).
 *
 * Redirects signed-in users away from auth pages via `requireUnauth`.
 * Immersive split-screen: left branding panel + right sign-in form.
 */

import Link from "next/link";
import {
  ArrowLeftIcon,
  CodeIcon,
  FileTextIcon,
  GitPullRequestIcon,
  KanbanIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { requireUnauth } from "@/lib/auth-session";

/**
 * Auth route group layout — sign-in and related pages.
 *
 * @param children - Auth page content (e.g. sign-in card).
 * @returns Immersive split-screen layout for auth UI.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bounce authenticated users to the dashboard
  await requireUnauth();

  return (
    <div className="flex min-h-svh bg-background">
      {/* ─── Left Branding Panel ─── */}
      <div className="relative hidden w-1/2 flex-col overflow-hidden border-r border-border/20 bg-muted/5 lg:flex">
        {/* Decorative gradient orbs */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/8 blur-3xl animate-pulse-glow" style={{ animationDelay: "4s" }} />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top nav */}
        <div className="relative z-10 p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Back to home
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-12">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
              <RocketIcon className="size-6 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ShipFlow AI</span>
          </div>

          {/* Tagline */}
          <h2 className="mb-4 max-w-md text-center text-3xl font-bold tracking-tight leading-tight">
            From Feature Request{" "}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-violet-500 bg-clip-text text-transparent">
              to Production
            </span>
          </h2>
          <p className="mb-12 max-w-sm text-center text-sm text-muted-foreground leading-relaxed">
            AI generates PRDs, decomposes tasks, reviews code, and gates releases —
            so your team ships faster with fewer bugs.
          </p>

          {/* Floating feature pills */}
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {[
              { icon: FileTextIcon, label: "Auto-Generated PRDs", color: "text-violet-400", delay: "0s" },
              { icon: CodeIcon, label: "AI Code Reviews", color: "text-blue-400", delay: "0.5s" },
              { icon: KanbanIcon, label: "Task Decomposition", color: "text-amber-400", delay: "1s" },
              { icon: ShieldCheckIcon, label: "Release Gates", color: "text-emerald-400", delay: "1.5s" },
              { icon: GitPullRequestIcon, label: "PR Analysis", color: "text-green-400", delay: "2s" },
              { icon: SparklesIcon, label: "Smart Pipeline", color: "text-primary", delay: "2.5s" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="animate-slide-up flex items-center gap-2 rounded-md border border-border/30 bg-background/50 px-3 py-2 text-xs backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-background/70"
                style={{ animationDelay: feature.delay }}
              >
                <feature.icon className={`size-3.5 shrink-0 ${feature.color}`} />
                <span className="text-muted-foreground">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <div className="relative z-10 p-8">
          <p className="text-xs text-muted-foreground/60">
            Trusted by developers shipping production software faster.
          </p>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header (visible only on small screens) */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <RocketIcon className="size-5 text-primary" />
            ShipFlow AI
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-3" />
            Home
          </Link>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
