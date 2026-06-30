# ShipFlow AI — AI-Powered Software Delivery Platform

<p align="center">
  <img src="./public/93506170-1cba-4fd5-b466-a1348ad9bd3a.png" alt="ShipFlow AI — AI-Powered Software Delivery" width="100%" />
</p>

> **From feature request to production in one automated pipeline.**  
> AI generates PRDs, decomposes tasks, reviews code against requirements, and gates releases — so your team ships faster with fewer bugs.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ShipFlow AI                             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Next.js  │  │ tRPC     │  │ Prisma   │  │ PostgreSQL   │   │
│  │ App      │──│ API      │──│ ORM      │──│ Database     │   │
│  │ Router   │  │ Routers  │  │          │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│       │              │                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Shadcn   │  │ BetterAuth│  │ Inngest  │  │ AI SDK +     │   │
│  │ UI       │  │ GitHub   │  │ Workflows│  │ OpenRouter   │   │
│  │          │  │ OAuth    │  │          │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                    │                            │
│                     ┌──────────────┼──────────────┐             │
│                     │              │              │             │
│               ┌─────────┐   ┌─────────┐   ┌─────────┐         │
│               │ Octokit │   │ Pinecone│   │Razorpay │         │
│               │ GitHub  │   │ Vectors │   │ Billing │         │
│               │ App     │   │         │   │         │         │
│               └─────────┘   └─────────┘   └─────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Core Workflow (The ShipFlow Loop)

```
Feature Request → AI Clarification → PRD Generation → Task Decomposition
       ↓                                                       ↓
  Human Review  ← AI Code Review ← Pull Request ← Development
       ↓
     Ship ✅
```

| Phase | What Happens | AI Agent |
|:---:|:---|:---|
| 1 | User submits a feature request | **Clarification Agent** asks follow-up questions to gather missing context |
| 2 | AI generates a structured PRD | **PRD Agent** produces goals, user stories, acceptance criteria, edge cases |
| 3 | PRD is decomposed into tasks | **Task Agent** breaks PRD into atomic engineering tasks on a Kanban board |
| 4 | Developer opens a PR | **Review Agent** checks code against PRD requirements, security, performance |
| 5 | Blocking issues → fix loop | **Re-Review Agent** verifies fixes and checks if previous issues are resolved |
| 6 | All clear → human approval | Human reviewer approves or rejects the release |
| 7 | Ship! | Feature marked as shipped |

## ✨ Features

### AI Agents
- **AI Clarification Agent** — Gathers missing requirements through follow-up questions
- **PRD Generation Agent** — Produces structured PRDs (problem, goals, user stories, acceptance criteria, edge cases)
- **Task Decomposition Agent** — Breaks PRDs into implementable engineering tasks
- **Code Review Agent** — PRD-aware reviews checking compliance, security, performance, edge cases
- **Re-Review Agent** — Verifies fixes and checks if previously-blocking issues are resolved
- **Release Readiness Agent** — Evaluates if a feature is ready for human approval

### GitHub Integration
- GitHub App installation with webhook-driven PR review automation
- Auto-reviews on `opened`, `synchronize`, and `reopened` PR events
- Reviews posted back to GitHub as PR comments via Octokit
- Repository sync for deeper cross-file context (Pinecone vectors)

### SaaS Features
- **Multi-tenant workspaces** with role-based access (Owner/Admin/Member)
- **Free & Pro plans** with Razorpay subscription billing
- **Usage limits** — 5 reviews/month and 3 repos on Free; unlimited on Pro
- **Dark mode** dashboard with JetBrains Mono typography

### Dashboard Pages
| Page | Path | Description |
|:---|:---|:---|
| Landing Page | `/` | Marketing page with features, workflow, pricing |
| Sign In | `/sign-in` | GitHub OAuth sign-in |
| Overview | `/dashboard` | Stats and activity |
| Workspaces | `/dashboard/workspaces` | Multi-tenant workspace management |
| Projects | `/dashboard/projects` | Project list with repo connections |
| Feature Requests | `/dashboard/features` | Create, track, and manage features |
| Feature Detail | `/dashboard/features/[id]` | Clarification chat with AI agent |
| PRD Editor | `/dashboard/prd/[id]` | View/edit AI-generated PRDs |
| Task Board | `/dashboard/tasks` | Kanban board (Todo/In Progress/Review/Done) |
| Repositories | `/dashboard/repos` | Connected GitHub repos |
| Pull Requests | `/dashboard/pull-requests` | PR list grouped by repo |
| PR Detail | `/dashboard/pull-requests/[id]` | AI review markdown viewer |
| Review History | `/dashboard/reviews` | Timeline of all AI reviews with issue breakdown |
| Releases | `/dashboard/releases` | Human approval queue |
| Billing | `/dashboard/billing` | Plan comparison, usage stats |
| Settings | `/dashboard/settings` | Profile and subscription management |
| GitHub App | `/dashboard/github` | Install/disconnect GitHub App |

## 🛠️ Tech Stack

### Frontend

| Tool | Purpose |
|------|---------|
| [Next.js 16](https://nextjs.org/) | React framework (App Router) |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | 55+ accessible UI components |
| [tRPC](https://trpc.io/) | End-to-end type-safe API |
| [TanStack Query](https://tanstack.com/query) | Server state management |
| [Recharts](https://recharts.org/) | Dashboard charts |

### Backend & Data

| Tool | Purpose |
|------|---------|
| [PostgreSQL](https://www.postgresql.org/) | Primary database |
| [Prisma 7](https://www.prisma.io/) | ORM with 14 models |
| [Better Auth](https://www.better-auth.com/) | GitHub OAuth + organization plugin |
| [Inngest](https://www.inngest.com/) | 8 durable background workflow functions |

### AI & Search

| Tool | Purpose |
|------|---------|
| [Vercel AI SDK](https://sdk.vercel.ai/) | LLM integration (`generateText`) |
| [OpenRouter](https://openrouter.ai/) | AI model provider (Gemini 2.5 Flash) |
| [Pinecone](https://www.pinecone.io/) | Vector database for code context |

### GitHub & Payments

| Tool | Purpose |
|------|---------|
| [Octokit](https://github.com/octokit/octokit.js) | GitHub App API |
| [Razorpay](https://razorpay.com/) | Subscription billing (INR) |

## 📁 Project Structure

```
My-ai-code-reviewer/
├── apps/
│   └── web/                          # Next.js 16 App Router
│       ├── app/
│       │   ├── page.tsx              # Marketing landing page
│       │   ├── (auth)/sign-in/       # GitHub OAuth sign-in
│       │   ├── (protected)/dashboard/
│       │   │   ├── page.tsx          # Overview dashboard
│       │   │   ├── workspaces/       # Workspace management
│       │   │   ├── projects/         # Project list
│       │   │   ├── features/         # Feature requests + [id] detail
│       │   │   ├── prd/[id]/         # PRD editor
│       │   │   ├── tasks/            # Kanban task board
│       │   │   ├── repos/            # Connected repositories
│       │   │   ├── pull-requests/    # PR list + [id] detail
│       │   │   ├── reviews/          # Review history timeline
│       │   │   ├── releases/         # Human approval queue
│       │   │   ├── billing/          # Plan & usage management
│       │   │   ├── settings/         # Profile & subscription
│       │   │   └── github/           # GitHub App connection
│       │   └── api/
│       │       ├── trpc/             # tRPC HTTP handler
│       │       ├── inngest/          # Inngest serve endpoint (8 functions)
│       │       └── webhooks/         # GitHub & Razorpay webhooks
│       ├── features/
│       │   ├── workflows/            # Inngest workflow functions
│       │   │   ├── generate-prd.ts
│       │   │   ├── generate-tasks.ts
│       │   │   ├── clarify-feature.ts
│       │   │   ├── re-review-pr.ts
│       │   │   └── release-readiness.ts
│       │   ├── billing/              # Razorpay + usage limits
│       │   ├── dashboard/            # Shell, nav, and dashboard components
│       │   ├── github/               # GitHub App, webhooks, installations
│       │   ├── pull-requests/        # PR components and server functions
│       │   ├── repo-sync/            # Pinecone-based repo indexing
│       │   └── reviews/              # Review pipeline (legacy Inngest + AI)
│       └── components/ui/            # 55 shadcn/ui components
├── packages/
│   ├── api/                          # tRPC router definitions
│   │   └── src/routers/
│   │       ├── workspace.ts          # Workspace CRUD
│   │       ├── project.ts            # Project management
│   │       ├── feature-request.ts    # Feature lifecycle
│   │       ├── prd.ts                # PRD CRUD + approve
│   │       ├── task.ts               # Kanban operations
│   │       ├── review.ts             # Review + issue resolution
│   │       ├── release.ts            # Human approve/reject
│   │       └── billing.ts            # Razorpay subscription
│   ├── auth/                         # BetterAuth configuration
│   ├── db/                           # Prisma schema + repositories
│   │   ├── prisma/schema.prisma      # 14 models, 351 lines
│   │   └── src/repositories/         # 7 repository modules
│   └── inngest/                      # Inngest client + workflow functions
├── turbo.json                        # Turborepo task configuration
├── pnpm-workspace.yaml               # Monorepo workspace definition
└── prisma.config.ts                  # Points to packages/db schema
```

## 📊 Database Schema

14 Prisma models organized into 5 domains:

| Domain | Models | Purpose |
|:---|:---|:---|
| **Auth** | `User`, `Session`, `Account`, `Verification` | BetterAuth with GitHub OAuth |
| **Multi-Tenant** | `Workspace`, `WorkspaceMember` | Organizations with role-based access |
| **Projects** | `Project` | GitHub repo connections per workspace |
| **Feature Lifecycle** | `FeatureRequest`, `ClarificationMessage`, `PRD`, `Task` | Full requirement → task pipeline |
| **Reviews** | `PullRequest`, `Review`, `ReviewIssue`, `Release`, `RepoSync` | AI review, human approval, vector sync |

### Feature Request State Machine

```
new → clarifying → prd_generation → prd_ready → planning → tasks_ready
  → in_development → ai_review → fix_needed ↔ ai_review → human_review → shipped
```

## 🔧 Inngest Workflows

8 registered Inngest functions handle durable background work:

| Function | Event | Purpose |
|:---|:---|:---|
| `clarify-feature-request` | `shipflow/feature.clarify` | AI asks follow-up questions |
| `generate-prd` | `shipflow/prd.generate` | AI generates structured PRD |
| `generate-tasks` | `shipflow/tasks.generate` | AI decomposes PRD into tasks |
| `review-pull-request` (legacy) | `github/pr.received` | Webhook-triggered PR review |
| `review-pull-request` (v2) | `shipflow/pr.review` | PRD-aware AI code review |
| `re-review-pull-request` | `shipflow/pr.re-review` | Fix verification re-review |
| `check-release-readiness` | `shipflow/release.check` | Pre-approval validation |
| `sync-repo-codebase` | `repo/sync.requested` | Full-repo Pinecone indexing |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database
- GitHub OAuth App + GitHub App
- Pinecone index (integrated embeddings)
- OpenRouter API key
- Razorpay account (optional, for Pro subscriptions)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
GITHUB_WEBHOOK_SECRET=...
OPENROUTER_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
INNGEST_DEV=1  # for local dev server
```

### Install & Run

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @shipflow/db db:generate

# Run database migrations
pnpm --filter @shipflow/db db:push

# Start development server
pnpm dev
```

For background jobs locally:
```bash
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with GitHub, and explore the dashboard.

## 📄 License

MIT
