/**
 * Workspaces page (`/dashboard/workspaces`).
 *
 * Lets users create, switch, and manage workspaces (multi-tenant orgs).
 * Each workspace is a billing and access boundary.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  BuildingIcon,
  PlusIcon,
  UsersIcon,
  FolderKanbanIcon,
  CrownIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Workspaces · Dashboard",
};

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  owner: { label: "Owner", icon: CrownIcon },
  admin: { label: "Admin", icon: ShieldIcon },
  member: { label: "Member", icon: UserIcon },
};

async function getWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { name: true, email: true, image: true } } } },
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function WorkspacesPage() {
  const session = await requireAuth();
  const workspaces = await getWorkspaces(session.user.id);

  return (
    <>
      <DashboardHeader
        title="Workspaces"
        description="Manage your workspaces — each one is a separate team and billing boundary."
      />
      <div className="p-6">
        {workspaces.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <BuildingIcon className="size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                No workspaces yet. Create one to start managing projects.
              </p>
              <Button>
                <PlusIcon className="size-4" />
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => {
              const currentMember = ws.members.find(
                (m) => m.userId === session.user.id
              );
              const roleConfig = ROLE_CONFIG[currentMember?.role ?? "member"];
              const RoleIcon = roleConfig.icon;

              return (
                <Card key={ws.id} className="rounded-none hover:border-foreground/20 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <BuildingIcon className="size-4 text-muted-foreground" />
                      {ws.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">/{ws.slug}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <RoleIcon className="size-3" />
                        {roleConfig.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ws.plan}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UsersIcon className="size-3" />
                        {ws.members.length} members
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FolderKanbanIcon className="size-3" />
                        {ws._count.projects} projects
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Created {formatDistanceToNow(ws.createdAt, { addSuffix: true })}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      nativeButton={false}
                      render={
                        <Link href={`${DASHBOARD_ROUTES.projects}?workspaceId=${ws.id}`} />
                      }
                    >
                      View Projects
                    </Button>
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
