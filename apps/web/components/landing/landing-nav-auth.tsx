/**
 * Auth-aware navigation for the landing page.
 *
 * Receives the user object from the server-side session check and renders
 * a profile/dashboard/logout dropdown when signed in.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { SIGN_IN_PATH } from "@/lib/auth-routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDisplayName, getInitials } from "@/components/user/user-menu";

type LandingNavAuthUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type LandingNavAuthProps = {
  user: LandingNavAuthUser;
};

/**
 * User avatar dropdown with Dashboard, Settings, and Logout links.
 * Used in the landing page navbar for signed-in users.
 *
 * @param user - User object from the server session.
 */
export function LandingNavAuth({ user }: LandingNavAuthProps) {
  const router = useRouter();
  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(SIGN_IN_PATH);
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 rounded-full px-2 hover:bg-muted/50"
            aria-label="Account menu"
          />
        }
      >
        <Avatar size="sm">
          {user.image ? (
            <AvatarImage src={user.image} alt={displayName} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2 py-2">
              <Avatar size="sm">
                {user.image ? (
                  <AvatarImage src={user.image} alt={displayName} />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-xs font-medium">{displayName}</p>
                {user.email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={<Link href="/dashboard" />}
          >
            <LayoutDashboardIcon />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/dashboard/settings" />}
          >
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
