import { prisma } from "@/lib/db";

/**
 * Finds the user's active workspace from their latest session, or falls back to
 * the first workspace they are a member of.
 */
export async function getActiveWorkspaceForUser(userId: string) {
  // 1. Find the user's active session to see if there is an active workspace set
  const activeSession = await prisma.session.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, activeOrganizationId: true },
  });

  if (activeSession?.activeOrganizationId) {
    const ws = await prisma.workspace.findUnique({
      where: { id: activeSession.activeOrganizationId },
    });
    if (ws) return ws;
  }

  // 2. Fallback: Find the first workspace the user is a member of
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
  });

  if (membership?.workspace) {
    // If they have a workspace but it's not set active in the session, set it now
    if (activeSession && !activeSession.activeOrganizationId) {
      await prisma.session.update({
        where: { id: activeSession.id },
        data: { activeOrganizationId: membership.workspace.id },
      });
    }
    return membership.workspace;
  }

  // 3. Auto-provision fallback: Create a default workspace for the user if they don't have one
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const name = user?.name ? `${user.name}'s Workspace` : "My Workspace";
  const baseSlug = user?.name 
    ? user.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") 
    : "my-workspace";
  const slug = `${baseSlug.substring(0, 20)}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    const ws = await prisma.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId,
            role: "owner"
          }
        }
      }
    });

    // Update active session so it is active immediately
    if (activeSession) {
      await prisma.session.update({
        where: { id: activeSession.id },
        data: { activeOrganizationId: ws.id }
      });
    }

    return ws;
  } catch (error) {
    console.error("Failed to auto-create workspace:", error);
    return null;
  }
}
