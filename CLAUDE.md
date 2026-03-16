# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Insidr Community Hub — a Web3 community contributor management platform with forums, quests, leaderboards, and gamification. Built with Next.js 16 (App Router), React 19, TypeScript, and PostgreSQL (Neon).

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Production build
bun run lint         # ESLint
bun run db:push      # Push Drizzle schema to database
bun run db:generate  # Generate Drizzle migrations
bun run db:studio    # Open Drizzle Studio
```

No test framework is configured.

## Architecture

### Data Flow

Client components → `apiRequest()` or React Query → Next.js API routes (`/app/api/`) → Storage layer (`/lib/storage.ts`) → Drizzle ORM → PostgreSQL (Neon)

### Key Files

- **`/shared/schema.ts`** — Drizzle ORM table definitions + Zod validators for all entities (users, forum, quests, activities)
- **`/lib/storage.ts`** — Data access layer implementing `IStorage` interface; all database queries go through here
- **`/lib/db.ts`** — Database connection pool (Neon PostgreSQL)
- **`/lib/auth-context.tsx`** — Client-side auth context (`useAuth()` hook)
- **`/lib/session.ts`** — iron-session config (cookie-based, 24h expiry)
- **`/lib/rbac.ts`** — Role-based access control (admin, contributor, ambassador)
- **`/lib/queryClient.ts`** — React Query config + `apiRequest()` helper (infinite stale time, credentials included)
- **`/middleware.ts`** — Route protection; `/dashboard` and `/` require auth

### Routing

App Router with file-based routing. API routes under `/app/api/`. Dynamic routes: `/forum/[categoryId]/[topicId]`, `/contributors/[id]`.

### Styling

Tailwind CSS + shadcn/ui (Radix-based components in `/components/ui/`). Dark mode via next-themes class strategy. Animations with framer-motion and tailwindcss-animate.

### Auth

iron-session with bcryptjs password hashing. Session cookie: `community-hub-session`. API routes validate session and use Zod for request parsing.

### Path Alias

`@/*` maps to project root (e.g., `@/lib/db`, `@/components/ui/button`).

## Environment Variables

Required: `DATABASE_URL` (or `NEON_DATABASE_URL`), `SESSION_SECRET` (has dev fallback).

Optional Supabase keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`.

## Conventions

- All database tables use UUIDs as primary keys
- API routes return JSON with standard HTTP status codes (400/401/403/409/500)
- Client components use `"use client"` directive; server components are the default
- Forms use react-hook-form with Zod resolvers
- React Query handles client-side caching with mutation invalidation
- shadcn/ui components are configured via `components.json` and live in `/components/ui/`
- Next.js config transpiles `@dicebear` packages for ESM compatibility
