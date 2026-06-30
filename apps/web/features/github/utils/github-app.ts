/**
 * GitHub App singleton and install URL helper.
 *
 * A GitHub App is different from a personal access token — it is installed
 * per-account (user or org) and gets short-lived installation tokens via Octokit.
 * We create one shared `App` instance and reuse it across server code.
 *
 * @module features/github/utils/github-app
 */

import { App } from "octokit";

/** Cached Octokit `App` instance so we do not re-parse the private key on every request. */
let githubApp: App | null = null;

/**
 * Cleans the private key string from common environment variable malformation
 * (e.g. escaped newlines, trailing slashes, bad double-quoting).
 */
function sanitizePrivateKey(key: string): string {
  if (!key) return "";
  // Strip outer quotes and whitespace
  let cleanKey = key.trim().replace(/^['"]|['"]$/g, "").trim();
  // Convert escaped newlines
  cleanKey = cleanKey.replace(/\\n/g, "\n");
  // Remove trailing slashes and leftover quotes
  cleanKey = cleanKey.replace(/\\+$/, "").trim().replace(/['"]$/, "").trim();
  return cleanKey;
}

/**
 * Returns the shared GitHub App client used for API calls and webhook verification.
 *
 * The App is configured with:
 * - `appId` and `privateKey` — used to mint JWTs for GitHub's REST API
 * - `webhooks.secret` — used later to verify that webhook payloads really came from GitHub
 *
 * @returns A singleton Octokit `App` instance.
 */
export function getGithubApp(): App {
  if (!githubApp) {
    const rawKey = process.env.GITHUB_APP_PRIVATE_KEY!;
    githubApp = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: sanitizePrivateKey(rawKey),
      webhooks: { secret: process.env.GITHUB_WEBHOOK_SECRET! },
    });
  }

  return githubApp;
}

/**
 * Builds the URL where a user starts installing our GitHub App on their account.
 *
 * GitHub sends the `state` query param back to our callback so we know which
 * logged-in user completed the install flow.
 *
 * @param userId - The app's user id; stored in `state` and read on the OAuth callback.
 * @returns Full HTTPS URL to GitHub's "install this app" page.
 */
export function getGithubInstallUrl(userId: string) {
  const appName = process.env.GITHUB_APP_NAME!;
  const url = new URL(`https://github.com/apps/${appName}/installations/new`);
  // `state` round-trips through GitHub so we can link the installation to this user.
  url.searchParams.set("state", userId);
  return url.toString();
}
