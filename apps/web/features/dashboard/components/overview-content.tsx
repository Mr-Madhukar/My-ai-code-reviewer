/**
 * Dashboard Overview page body — stat cards, connect banner, and activity feed.
 *
 * Receives pre-fetched `OverviewData` from the server page and renders
 * four summary cards plus a list of recent AI review activity.
 */

import type { ComponentType } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightIcon,
  FolderGit2Icon,
  GitPullRequestIcon,
  SparklesIcon,
} from "lucide-react";

import { GithubIcon } from "@/features/dashboard/components/icons/github-icon";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { statusBadge } from "@/features/dashboard/lib/status-styles";
import type {
  OverviewActivityItem,
  OverviewData,
  OverviewRepoSummary,
} from "@/features/overview/types/overview";
import { PLAN_DETAILS } from "@/features/settings/lib/plan-details";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Maps activity status values to badge label and color tone. */
const ACTIVITY_STATUS = {
  approved: { label: "Approved", tone: "success" as const },
  changes_requested: { label: "Changes requested", tone: "warning" as const },
  rate_limited: { label: "Rate limited", tone: "danger" as const },
};

/**
 * Builds the subtitle text under the Repositories stat value.
 *
 * @param repos - Repo summary counts, or empty state when total is zero.
 * @returns A short human-readable description string.
 */
function getRepoDescription(repos: OverviewRepoSummary): string {
  if (repos.totalCount === 0) {
    return "No repositories selected for the app";
  }

  if (repos.hasMorePages) {
    return `${repos.totalCount} repositories connected`;
  }

  return `${repos.publicCount} public · ${repos.privateCount} private`;
}

/**
 * Derives display value and description for the GitHub App stat card.
 *
 * @param installation - Connection status from `OverviewData`.
 * @returns Value string, description, and optional success accent.
 */
function getGithubStat(installation: OverviewData["installation"]) {
  if (!installation.connected) {
    return {
      value: "Not connected",
      description: "Install the GitHub App to start",
      accent: undefined,
    };
  }

  const account = installation.accountLogin
    ? `@${installation.accountLogin}`
    : "Installation active";

  return {
    value: "Connected",
    description: account,
    accent: "success" as const,
  };
}

/**
 * Derives display value for the Repositories stat card.
 *
 * @param repos - Repo summary or null when GitHub is not connected.
 * @returns Value, description, and optional info accent.
 */
function getRepositoriesStat(repos: OverviewRepoSummary | null) {
  if (!repos) {
    return {
      value: "—",
      description: "Connect GitHub App first",
      accent: undefined,
    };
  }

  return {
    value: String(repos.totalCount),
    description: getRepoDescription(repos),
    accent: "info" as const,
  };
}

/** Shape of one stat card in the top grid. */
type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accent?: "success" | "info";
  iconBg: string;
  iconColor: string;
};

/**
 * Formats the "Reviews this month" stat for free vs Pro plans.
 *
 * @param overview - Full overview data including usage and plan.
 * @returns Value and description strings for the reviews stat card.
 */
function getReviewsStat(overview: OverviewData) {
  if (overview.reviewsLimit === null) {
    return {
      value: String(overview.reviewsUsed),
      description: "Unlimited reviews on Pro",
    };
  }

  return {
    value: `${overview.reviewsUsed} / ${overview.reviewsLimit}`,
    description: "AI reviews used this month",
  };
}

/**
 * Assembles all four stat cards from overview data.
 *
 * @param overview - Server-loaded overview payload.
 * @returns Array of stat card configs for rendering the grid.
 */
function buildStats(overview: OverviewData): StatCard[] {
  const repoStat = getRepositoriesStat(overview.repos);
  const githubStat = getGithubStat(overview.installation);
  const planLabel = PLAN_DETAILS[overview.plan].label;
  const reviewsStat = getReviewsStat(overview);

  return [
    {
      title: "Repositories",
      value: repoStat.value,
      description: repoStat.description,
      icon: FolderGit2Icon,
      accent: repoStat.accent,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
    },
    {
      title: "Reviews this month",
      value: reviewsStat.value,
      description: reviewsStat.description,
      icon: GitPullRequestIcon,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400",
    },
    {
      title: "GitHub App",
      value: githubStat.value,
      description: githubStat.description,
      icon: GithubIcon,
      accent: githubStat.accent,
      iconBg: githubStat.accent === "success" ? "bg-green-500/15" : "bg-muted",
      iconColor: githubStat.accent === "success" ? "text-green-400" : "text-muted-foreground",
    },
    {
      title: "Current plan",
      value: planLabel,
      description: "Manage in settings",
      icon: SparklesIcon,
      accent: overview.plan === "free" ? undefined : "success",
      iconBg: overview.plan === "free" ? "bg-amber-500/15" : "bg-emerald-500/15",
      iconColor: overview.plan === "free" ? "text-amber-400" : "text-emerald-400",
    },
  ];
}

/**
 * Prominent CTA shown when GitHub App is not connected.
 *
 * @returns A highlighted card linking to the GitHub App settings page.
 */
function ConnectGithubBanner() {
  return (
    <Card className="relative overflow-hidden border-primary/20 card-glow">
      {/* Gradient accent at the top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-blue-400 to-violet-500" />
      <CardHeader className="flex flex-row items-start justify-between gap-4 pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <GithubIcon className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">Connect GitHub to get started</CardTitle>
            <CardDescription>
              Install the GitHub App to list repositories and enable AI reviews on
              pull requests.
            </CardDescription>
          </div>
        </div>
        <Button
          nativeButton={false}
          render={<Link href={DASHBOARD_ROUTES.github} />}
          className="shrink-0 gap-1"
        >
          Connect GitHub
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </CardHeader>
    </Card>
  );
}

/**
 * Renders the recent activity list or an empty-state message.
 *
 * @param items - Recent review activity rows from the server.
 * @returns A vertical list of activity entries with status badges.
 */
function ActivityList({ items }: { items: OverviewActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
          <GitPullRequestIcon className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No reviews yet</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Once AI PR reviews are enabled, summaries will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const config = ACTIVITY_STATUS[item.status];
        const statusColor =
          item.status === "approved"
            ? "border-l-green-500/60"
            : item.status === "changes_requested"
              ? "border-l-amber-500/60"
              : "border-l-red-500/60";

        return (
          <div
            key={item.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/30 border-l-2 bg-muted/5 px-4 py-3 transition-colors hover:bg-muted/15",
              statusColor,
            )}
          >
            <div>
              <p className="text-xs font-medium">
                {item.repoFullName}{" "}
                <span className="text-muted-foreground">{item.prNumber}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.reviewedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <span className={statusBadge(config.tone)}>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

type OverviewContentProps = {
  overview: OverviewData;
};

/**
 * Main Overview page content — stat grid, optional banner, activity card.
 *
 * @param overview - Pre-fetched data from `getOverview()`.
 * @returns The overview page body below `DashboardHeader`.
 */
export function OverviewContent({ overview }: OverviewContentProps) {
  const stats = buildStats(overview);
  const showConnectBanner = !overview.installation.connected;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.title}
            className={cn(
              "card-glow relative overflow-hidden transition-all",
              stat.accent === "success" && "border-green-500/20",
              stat.accent === "info" && "border-blue-500/20",
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Top accent line */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-[1px]",
                stat.accent === "success" && "bg-gradient-to-r from-transparent via-green-500/40 to-transparent",
                stat.accent === "info" && "bg-gradient-to-r from-transparent via-blue-500/40 to-transparent",
                !stat.accent && "bg-gradient-to-r from-transparent via-border/60 to-transparent",
              )}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", stat.iconBg)}>
                <stat.icon className={cn("size-4", stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  stat.accent === "success" && "text-green-700 dark:text-green-400",
                  stat.accent === "info" && "text-blue-700 dark:text-blue-400",
                )}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {showConnectBanner ? <ConnectGithubBanner /> : null}

      {/* Activity feed */}
      <Card className="card-glow relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <SparklesIcon className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Recent activity</CardTitle>
              <CardDescription>
                Latest AI review summaries from your repositories.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityList items={overview.recentActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
