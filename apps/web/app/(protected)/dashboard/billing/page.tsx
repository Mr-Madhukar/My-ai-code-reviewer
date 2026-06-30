/**
 * Billing page (`/dashboard/billing`).
 *
 * Standalone subscription management page showing current plan, usage,
 * plan comparison, and upgrade/downgrade actions.
 */

import type { Metadata } from "next";
import {
  CreditCardIcon,
  CheckIcon,
  ZapIcon,
  SparklesIcon,
  BarChart3Icon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { PLAN_DETAILS } from "@/features/settings/lib/plan-details";
import { getUserSubscription } from "@/features/settings/server/subscription";
import { requireAuth } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { CancelSubscriptionButton } from "@/features/billing/components/cancel-subscription-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Billing · Dashboard",
};

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "For individual developers getting started",
    features: [
      "5 AI reviews per month",
      "3 connected repositories",
      "Public repositories only",
      "Community support",
      "Basic review categories",
    ],
    icon: ZapIcon,
    highlighted: false,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "₹99",
    period: "/month",
    description: "For teams shipping production software",
    features: [
      "Unlimited AI reviews",
      "Unlimited connected repositories",
      "Public & private repositories",
      "Priority support",
      "PRD-aware reviews",
      "Re-review loop",
      "Advanced issue categorization",
      "Release readiness checks",
    ],
    icon: SparklesIcon,
    highlighted: true,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
];

export default async function BillingPage() {
  const session = await requireAuth();
  
  let subscription;
  let currentPlan: "free" | "pro" = "free";
  let planDetails = PLAN_DETAILS.free;
  let errorMsg: string | null = null;

  try {
    subscription = await getUserSubscription(session.user.id);
    currentPlan = subscription.plan;
    planDetails = PLAN_DETAILS[currentPlan];
  } catch (error) {
    console.error("[BillingPage] Error loading user subscription:", error);
    errorMsg = error instanceof Error ? error.message : "Failed to load subscription details.";
    subscription = {
      plan: "free" as const,
      status: "active" as const,
      renewsAt: null,
      usage: {
        reviewsUsed: 0,
        reposConnected: 0,
      }
    };
  }

  return (
    <>
      <DashboardHeader
        title="Billing"
        description="Manage your subscription plan and track usage."
      />
      {errorMsg && (
        <div className="mx-6 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive-foreground">
          <p className="font-semibold">Unable to load live billing details</p>
          <p className="text-xs opacity-80 mt-1">{errorMsg}</p>
        </div>
      )}
      <div className="flex flex-col gap-6 p-6">
        {/* Current Plan & Usage */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-glow relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{planDetails.label}</span>
                <Badge variant={currentPlan === "pro" ? "default" : "secondary"}>
                  {currentPlan === "pro" ? "Active" : "Free Tier"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                AI Reviews Used
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {subscription.usage?.reviewsUsed ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {currentPlan === "pro" ? "∞" : "5"}
                </span>
              </div>
              {currentPlan !== "pro" && (
                <Progress
                  value={Math.min(((subscription.usage?.reviewsUsed ?? 0) / 5) * 100, 100)}
                  className="h-2"
                />
              )}
            </CardContent>
          </Card>

          <Card className="card-glow relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Connected Repos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {subscription.usage?.reposConnected ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {currentPlan === "pro" ? "∞" : "3"}
                </span>
              </div>
              {currentPlan !== "pro" && (
                <Progress
                  value={Math.min(((subscription.usage?.reposConnected ?? 0) / 3) * 100, 100)}
                  className="h-2"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Plan Comparison */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
            <BarChart3Icon className="size-3.5 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-medium">Compare Plans</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const isCurrent = plan.id === currentPlan;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "card-glow relative overflow-hidden transition-all",
                  plan.highlighted && "border-primary/40",
                  isCurrent && "ring-2 ring-primary/20",
                )}
              >
                {/* Top accent */}
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-[2px]",
                    plan.highlighted
                      ? "bg-gradient-to-r from-primary via-blue-400 to-violet-500"
                      : "bg-gradient-to-r from-transparent via-border/60 to-transparent",
                  )}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${plan.iconBg}`}>
                        <PlanIcon className={`size-4 ${plan.iconColor}`} />
                      </div>
                      {plan.name}
                    </CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                          <CheckIcon className="size-3 text-emerald-400" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && plan.id === "pro" && (
                    <div className="w-full">
                      <UpgradeButton />
                    </div>
                  )}
                  {!isCurrent && plan.id === "free" && (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      Downgrade to Free
                    </Button>
                  )}
                  {isCurrent && plan.id === "pro" && (
                    <div className="w-full">
                      <CancelSubscriptionButton />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Method */}
        <Card className="card-glow relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
                <CreditCardIcon className="size-3.5 text-muted-foreground" />
              </div>
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPlan === "pro" ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-xs font-mono">
                    VISA
                  </div>
                  <div>
                    <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">
                      Expires 12/2027
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="hover:border-primary/30">
                  Update
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment method on file. Add one when upgrading to Pro.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
