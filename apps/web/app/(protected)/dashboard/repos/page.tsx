/**
 * Repositories page (`/dashboard/repos`).
 *
 * Lists GitHub repos available to the installed app. Shows a connect prompt
 * when the GitHub App is not installed; otherwise renders the infinite-scroll
 * `ReposList` client component.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { FolderGit2Icon, ArrowRightIcon } from "lucide-react";

import { GithubIcon } from "@/features/dashboard/components/icons/github-icon";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ReposList } from "@/features/dashboard/components/repos-list";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getInstallationStatus } from "@/features/github/server/installation";
import { requireAuth } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Repositories · Dashboard",
};

/**
 * Empty state when GitHub App is not connected.
 *
 * @returns Centered message with link to GitHub App settings.
 */
function ReposNotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="card-glow relative max-w-md overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-blue-400 to-violet-500" />
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <GithubIcon className="size-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">GitHub App not connected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Install the GitHub App first to see your repositories.
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
 * Repositories list page with GitHub connection guard.
 *
 * @returns Header plus either connect prompt or interactive repo table.
 */
export default async function DashboardReposPage() {
  const session = await requireAuth();
  const installation = await getInstallationStatus(session.user.id);

  const header = (
    <DashboardHeader
      title="Repositories"
      description="All public and private repositories available to the GitHub App."
    />
  );

  if (!installation.connected) {
    return (
      <>
        {header}
        <ReposNotConnected />
      </>
    );
  }

  return (
    <>
      {header}
      <ReposList />
    </>
  );
}
