/**
 * Reviews page (`/dashboard/reviews`).
 *
 * Review history timeline showing all AI reviews across pull requests.
 * Groups reviews by date with severity breakdowns and resolution status.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ScanSearchIcon,
  BotIcon,
  UserIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  LightbulbIcon,
  CheckCircle2Icon,
  GitPullRequestIcon,
  ArrowRightIcon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getUserInstallationId } from "@/features/github/server/installation";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Review History · Dashboard",
};

async function getReviews(installationId: number) {
  return prisma.review.findMany({
    where: {
      pullRequest: { installationId },
    },
    include: {
      pullRequest: {
        select: {
          repoFullName: true,
          prNumber: true,
          title: true,
          id: true,
        },
      },
      issues: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export default async function ReviewsPage() {
  const session = await requireAuth();
  const installationId = await getUserInstallationId(session.user.id);

  if (!installationId) {
    return (
      <>
        <DashboardHeader
          title="Review History"
          description="Timeline of all AI code reviews."
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="card-glow relative max-w-md overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-blue-400 to-violet-500" />
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                <ScanSearchIcon className="size-7 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">GitHub App not connected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connect your GitHub App to see review history.
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
      </>
    );
  }

  const reviews = await getReviews(installationId);

  return (
    <>
      <DashboardHeader
        title="Review History"
        description="Timeline of all AI code reviews across your pull requests."
      />
      <div className="p-6">
        {reviews.length === 0 ? (
          <Card className="card-glow relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                <ScanSearchIcon className="size-7 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No reviews yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI reviews will appear here after pull requests are analyzed.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const blocking = review.issues.filter((i) => i.severity === "blocking");
              const nonBlocking = review.issues.filter((i) => i.severity === "non_blocking");
              const suggestions = review.issues.filter((i) => i.severity === "suggestion");
              const resolvedCount = review.issues.filter((i) => i.resolved).length;

              const borderColor =
                blocking.length > 0
                  ? "border-l-red-500/60"
                  : nonBlocking.length > 0
                    ? "border-l-amber-500/60"
                    : "border-l-green-500/60";

              return (
                <Card
                  key={review.id}
                  className={cn(
                    "card-glow relative overflow-hidden border-l-2 transition-all hover:border-primary/20",
                    borderColor,
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          review.reviewType === "ai"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {review.reviewType === "ai" ? (
                          <BotIcon className="size-4" />
                        ) : (
                          <UserIcon className="size-4" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`${DASHBOARD_ROUTES.pullRequests}/${review.pullRequest.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            PR #{review.pullRequest.prNumber}: {review.pullRequest.title}
                          </Link>
                          <Badge variant="secondary" className="text-xs">
                            {review.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {review.reviewType === "ai" ? "AI Review" : "Human Review"}
                          </Badge>
                        </div>

                        {review.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {review.summary}
                          </p>
                        )}

                        {/* Issue breakdown */}
                        <div className="flex flex-wrap gap-3 text-xs">
                          {blocking.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-red-400">
                              <AlertCircleIcon className="size-3" />
                              {blocking.length} blocking
                            </span>
                          )}
                          {nonBlocking.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-400">
                              <AlertTriangleIcon className="size-3" />
                              {nonBlocking.length} non-blocking
                            </span>
                          )}
                          {suggestions.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-blue-400">
                              <LightbulbIcon className="size-3" />
                              {suggestions.length} suggestions
                            </span>
                          )}
                          {review.issues.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                              <CheckCircle2Icon className="size-3" />
                              {resolvedCount}/{review.issues.length} resolved
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <GitPullRequestIcon className="size-3" />
                            {review.pullRequest.repoFullName}
                          </span>
                          <span>
                            {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
