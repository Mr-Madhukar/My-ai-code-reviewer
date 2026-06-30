import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ShipFlow AI — AI-Powered Software Delivery Platform",
  description:
    "From feature request to production in one automated pipeline. AI generates PRDs, decomposes tasks, reviews code against requirements, and gates releases — so your team ships faster with fewer bugs.",
};

/**
 * Root HTML shell wrapping all routes.
 *
 * @param children - Page content from nested layouts and route segments.
 * @returns The `<html>` and `<body>` structure with theme and toasts.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased")}
      // next-themes may set class on <html> before hydration — suppress mismatch warning
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const orgError = console.error;
                  console.error = function(...args) {
                    const isExtensionWarning = args.some(arg => {
                      if (!arg) return false;
                      if (typeof arg === "string") {
                        return (
                          arg.includes("bis_skin_checked") ||
                          arg.includes("data-gr-ext-installed") ||
                          arg.includes("data-new-gr-c-s-check-loaded")
                        );
                      }
                      try {
                        const str = JSON.stringify(arg);
                        return (
                          str.includes("bis_skin_checked") ||
                          str.includes("data-gr-ext-installed") ||
                          str.includes("data-new-gr-c-s-check-loaded")
                        );
                      } catch {
                        return false;
                      }
                    });

                    if (isExtensionWarning) {
                      return;
                    }
                    orgError.apply(console, args);
                  };
                })();
              `,
            }}
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
