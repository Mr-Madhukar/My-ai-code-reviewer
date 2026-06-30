/**
 * Dark/light theme provider wrapping `next-themes`.
 *
 * Re-exports `NextThemesProvider` with a dev-only console filter that
 * suppresses React 19 warnings about inline script tags injected by
 * next-themes for flash-free theme switching.
 */

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// next-themes injects an inline script to prevent theme flicker.
// React 19 warns about script tags inside components — safe to ignore in dev.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error
  console.error = (...args: unknown[]) => {
    const isExtensionWarning = args.some(arg => {
      if (!arg) return false
      if (typeof arg === "string") {
        return (
          arg.includes("bis_skin_checked") ||
          arg.includes("data-gr-ext-installed") ||
          arg.includes("data-new-gr-c-s-check-loaded")
        )
      }
      try {
        const str = JSON.stringify(arg)
        return (
          str.includes("bis_skin_checked") ||
          str.includes("data-gr-ext-installed") ||
          str.includes("data-new-gr-c-s-check-loaded")
        )
      } catch {
        return false
      }
    })

    if (isExtensionWarning) {
      return
    }

    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return
    }
    originalConsoleError.apply(console, args)
  }
}

/**
 * Theme context provider for class-based dark/light mode.
 *
 * Forwards all `next-themes` props (e.g. `defaultTheme`, `attribute`).
 *
 * @param children - App content that should respond to theme changes.
 * @param props - Remaining props passed to `NextThemesProvider`.
 * @returns The configured theme provider wrapping `{children}`.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
