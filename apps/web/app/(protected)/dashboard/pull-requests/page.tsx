/**
 * Pull requests list page (`/dashboard/pull-requests`).
 *
 * Groups AI-reviewed PRs by repository. Requires a GitHub App installation;
 * otherwise shows a prompt to connect GitHub first.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { GitPullRequestIcon, ArrowRightIcon } from "lucide-react";

import { GithubIcon } from "@/features/dashboard/components/icons/github-icon";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getUserInstallationId } from "@/features/github/server/installation";
import { PullRequestsList } from "@/features/pull-requests/components/pull-requests-list";
import { getPullRequestsByRepo } from "@/features/pull-requests/server/get-pull-requests";
import { requireAuth } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pull Requests · Dashboard",
};

/**
 * Empty state when GitHub App is not installed.
 *
 * @returns Centered message with link to GitHub App settings.
 */
function PullRequestsNotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="card-glow relative max-w-md overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-blue-400 to-violet-500" />
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <GitPullRequestIcon className="size-7 text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">GitHub App not connected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Install the GitHub App first to see AI-reviewed pull requests.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href={DASHBOARD_ROUTES.github} />}
            className="gap-1"
          >
            Go to GitHub App
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Pull requests index — all PRs grouped by repo for the user's installation.
 *
 * @returns Header plus list or connect prompt.
 */
export default async function DashboardPullRequestsPage() {
  const session = await requireAuth();
  const installationId = await getUserInstallationId(session.user.id);

  const header = (
    <DashboardHeader
      title="Pull Requests"
      description="Every pull request the AI reviewer has picked up, with its review."
    />
  );

  if (!installationId) {
    return (
      <>
        {header}
        <PullRequestsNotConnected />
      </>
    );
  }

  const repos = await getPullRequestsByRepo(installationId);

  return (
    <>
      {header}
      <PullRequestsList repos={repos} />
    </>
  );
}
