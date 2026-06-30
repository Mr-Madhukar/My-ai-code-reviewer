/**
 * OAuth callback after installing the GitHub App.
 *
 * GitHub redirects here with `?installation_id=` after the user completes
 * installation. We persist the installation ID on the user record, then
 * send them to the GitHub App settings page in the dashboard.
 */

import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { saveInstallation } from "@/features/github/server/installation";
import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";

/**
 * Builds the sign-in redirect URL so users return here after authenticating.
 *
 * If `installation_id` is present, we preserve it in the callback URL so
 * installation can be saved immediately after sign-in.
 *
 * @param installationId - GitHub installation ID from query string, or null.
 * @returns Path to use as `callbackUrl` on the sign-in page.
 */
function buildSignInCallbackUrl(installationId: string | null): string {
  if (installationId) {
    return `/api/github/callback?installation_id=${installationId}`;
  }

  return DASHBOARD_ROUTES.github;
}

/**
 * Handles the GET redirect from GitHub after app installation.
 *
 * @param request - Incoming request with `installation_id` query param.
 * @returns Redirect to sign-in (if unauthenticated) or dashboard GitHub page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const installationId = searchParams.get("installation_id");
  let session;

  try {
    session = await getServerSession();
  } catch (authError) {
    console.error("[GitHub Callback] Auth session retrieval failed:", authError);
    return new Response("Authentication failed", { status: 500 });
  }

  // Must be signed in to associate the installation with a user account
  if (!session) {
    const callbackUrl = buildSignInCallbackUrl(installationId);
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (installationId) {
    try {
      await saveInstallation(session.user.id, Number(installationId));
    } catch (saveError) {
      console.error(
        `[GitHub Callback] Failed to save installation ${installationId} for user ${session.user.id}:`,
        saveError
      );
      // Return a descriptive error page or text instead of crashing with a generic 500
      return new Response(
        `Failed to save GitHub App installation. Error: ${saveError instanceof Error ? saveError.message : String(saveError)}`,
        { status: 500 }
      );
    }
  }

  redirect(DASHBOARD_ROUTES.github);
}
