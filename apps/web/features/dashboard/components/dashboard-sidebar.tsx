/**
 * Left sidebar shell for the authenticated dashboard.
 *
 * Composes the ShipFlow AI logo/header, main navigation (`DashboardNav`), and
 * the user account button in the footer. Uses the shadcn sidebar primitives
 * with icon-collapsible mode for a compact layout on smaller screens.
 */

import Link from "next/link";
import { RocketIcon } from "lucide-react";

import type { UserMenuUser } from "@/components/user/user-menu";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { SidebarUserButton } from "@/features/dashboard/components/sidebar-user-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type DashboardSidebarProps = {
  user: UserMenuUser;
  plan?: string;
};

/**
 * Full dashboard sidebar with ShipFlow AI branding, nav links, and user menu.
 *
 * @param user - Signed-in user shown in the footer dropdown.
 * @param plan - Subscription label passed through to the user menu.
 * @returns The collapsible sidebar column for the dashboard layout.
 */
export function DashboardSidebar({ user, plan = "Free" }: DashboardSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="ShipFlow AI"
              render={
                <Link href={DASHBOARD_ROUTES.overview}>
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 ring-1 ring-primary/25">
                    <RocketIcon className="size-4 text-primary" />
                  </span>
                  {/* Hidden when sidebar is collapsed to icon-only mode */}
                  <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-bold tracking-tight">ShipFlow AI</span>
                    <span className="truncate text-xs text-muted-foreground">
                      AI Delivery Pipeline
                    </span>
                  </span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNav />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarUserButton user={user} plan={plan} />
      </SidebarFooter>
      {/* Invisible drag handle for resizing the sidebar on desktop */}
      <SidebarRail />
    </Sidebar>
  );
}
