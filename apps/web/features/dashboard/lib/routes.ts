/**
 * Central route definitions and navigation config for the dashboard.
 *
 * Using a single source of truth for paths prevents typos and makes it easy
 * to rename routes — update here and every link/nav item follows automatically.
 */

/** All dashboard page URLs. The `as const` makes values literal types for type safety. */
export const DASHBOARD_ROUTES = {
  overview: "/dashboard",
  workspaces: "/dashboard/workspaces",
  projects: "/dashboard/projects",
  featureRequests: "/dashboard/features",
  prd: "/dashboard/prd",
  tasks: "/dashboard/tasks",
  repos: "/dashboard/repos",
  pullRequests: "/dashboard/pull-requests",
  reviews: "/dashboard/reviews",
  releases: "/dashboard/releases",
  billing: "/dashboard/billing",
  github: "/dashboard/github",
  settings: "/dashboard/settings",
} as const;

/** Union of every valid dashboard path string. */
export type DashboardRoute =
  (typeof DASHBOARD_ROUTES)[keyof typeof DASHBOARD_ROUTES];

/**
 * Sidebar navigation items — title, href, and icon key.
 * Icons are resolved in `dashboard-nav.tsx` via the `NAV_ICONS` map.
 */
export const DASHBOARD_NAV_ITEMS = [
  {
    title: "Overview",
    href: DASHBOARD_ROUTES.overview,
    icon: "layout-dashboard" as const,
  },
  {
    title: "Projects",
    href: DASHBOARD_ROUTES.projects,
    icon: "folder-kanban" as const,
  },
  {
    title: "Features",
    href: DASHBOARD_ROUTES.featureRequests,
    icon: "lightbulb" as const,
  },
  {
    title: "Task Board",
    href: DASHBOARD_ROUTES.tasks,
    icon: "kanban" as const,
  },
  {
    title: "Repositories",
    href: DASHBOARD_ROUTES.repos,
    icon: "folder-git-2" as const,
  },
  {
    title: "Pull Requests",
    href: DASHBOARD_ROUTES.pullRequests,
    icon: "git-pull-request" as const,
  },
  {
    title: "Reviews",
    href: DASHBOARD_ROUTES.reviews,
    icon: "scan-search" as const,
  },
  {
    title: "Releases",
    href: DASHBOARD_ROUTES.releases,
    icon: "rocket" as const,
  },
  {
    title: "GitHub App",
    href: DASHBOARD_ROUTES.github,
    icon: "github" as const,
  },
  {
    title: "Billing",
    href: DASHBOARD_ROUTES.billing,
    icon: "credit-card" as const,
  },
  {
    title: "Settings",
    href: DASHBOARD_ROUTES.settings,
    icon: "settings" as const,
  },
] as const;
