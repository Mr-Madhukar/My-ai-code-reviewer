"use client";

/**
 * Dashboard error boundary.
 *
 * Catches unhandled errors in any dashboard page and displays a
 * user-friendly message along with the raw error for debugging.
 * The error is also logged to the server console (via the runtime).
 */

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error details so they appear in Render server logs
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
      <div className="mx-auto max-w-lg rounded-lg border border-red-500/30 bg-red-500/5 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-red-400">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          An unexpected error occurred while loading the dashboard.
        </p>

        {/* Show error message for debugging */}
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Error details
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-muted/30 p-3 text-xs text-red-300">
            {error.message}
            {error.digest ? `\nDigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
        </details>

        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
