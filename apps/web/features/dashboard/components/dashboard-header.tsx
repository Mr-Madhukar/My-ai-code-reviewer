/**
 * Top bar shown on every dashboard page.
 *
 * Contains the sidebar toggle (for mobile/collapsed mode), a decorative
 * gradient accent, and the page title + optional description passed by
 * each route's `page.tsx`.
 */

"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

/**
 * Renders the sticky dashboard page header with sidebar trigger and gradient accent.
 *
 * @param title - Primary heading (e.g. "Repositories").
 * @param description - Optional subtitle shown below the title.
 * @param children - Optional action components placed on the right side of the header.
 * @returns A `<header>` element with sidebar toggle and title block.
 */
export function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4">
      <div className="flex items-center gap-2 min-w-0">
        {/* Gradient accent line at the top */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        {/* Opens/closes the sidebar on smaller screens or icon-collapsed mode */}
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      ) : null}
    </header>
  );
}
