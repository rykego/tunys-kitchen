# 🚀 Website Setup Guide
## Claude Code + Next.js + Supabase + Vercel + Tailwind CSS

---

## Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 18+ | `node -v` |
| npm / yarn / pnpm | latest | `npm -v` |
| Git | any | `git --version` |
| Supabase CLI | latest | `supabase --version` |
| Vercel CLI | latest | `vercel --version` |

---

## Step 1 — Install Claude Code

```bash
# Install globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

On first run, Claude Code will prompt you to log in to your Anthropic account and authorize the CLI.

> **Tip:** If you hit a permissions error on macOS/Linux, prefix with `sudo`.

---

## Step 2 — Scaffold the Next.js Project

```bash
# Create a new Next.js app with TypeScript, Tailwind, ESLint, and the App Router
npx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd my-app
```

This generates the following structure:

```
my-app/
├── src/
│   └── app/
│       ├── globals.css       ← Tailwind imports
│       ├── layout.tsx
│       └── page.tsx
├── public/
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

---

## Step 3 — Add the .gitignore

Copy the provided `.gitignore` to the project root:

```bash
cp /path/to/provided/.gitignore my-app/.gitignore
```

---

## Step 4 — Initialise Git & First Commit

```bash
git init
git add .
git commit -m "chore: initial Next.js scaffold"
```

---

## Step 5 — Set Up Supabase

### 5a. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project**
2. Note your **Project URL** and **anon/public API key**

### 5b. Install the Supabase CLI and JS client

```bash
# CLI (used for local dev & migrations)
npm install -g supabase

# JS client for your app
npm install @supabase/supabase-js
```

### 5c. Initialise local Supabase (optional but recommended)

```bash
supabase init          # creates supabase/ directory
supabase start         # spins up local Postgres + Studio
```

### 5d. Create the Supabase client helper

```bash
mkdir -p src/lib
```

`src/lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 5e. Add environment variables

`.env.local` (never committed — already in .gitignore)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

---

## Step 6 — Create a CLAUDE.md File

Claude Code reads `CLAUDE.md` at the project root to understand your stack and coding rules. Create it:

`CLAUDE.md`
```md
# Project Rules for Claude Code

## Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Database: Supabase (Postgres)
- Deployment: Vercel

## Directory Structure
- src/app/          → Pages & layouts (App Router)
- src/components/   → Reusable UI components
- src/lib/          → Helpers & third-party clients (e.g. supabase.ts)
- src/hooks/        → Custom React hooks
- src/types/        → Shared TypeScript types

## Rules
- Always use TypeScript; never use `any`
- Prefer Server Components; use `"use client"` only when necessary
- All Supabase calls go through src/lib/supabase.ts
- Use Tailwind utility classes — no inline styles
- Co-locate tests next to the files they test
```

---

## Step 7 — Start Claude Code

```bash
# From the project root
claude
```

### Useful prompts to get started quickly:

```
Create a homepage with a hero section and navbar using Tailwind CSS

Add Supabase auth with email/password sign-up and sign-in pages

Create a /dashboard route that fetches and displays data from a Supabase table called "posts"

Add a REST API route at /api/posts that reads from Supabase
```

---

## Step 8 — Deploy to Vercel

### 8a. Install Vercel CLI

```bash
npm install -g vercel
```

### 8b. Link & deploy

```bash
vercel        # follow prompts on first run
```

For subsequent deployments:
```bash
vercel --prod
```

### 8c. Add environment variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 8d. Connect Git for automatic deployments (recommended)

1. Push your repo to GitHub / GitLab / Bitbucket
2. In Vercel Dashboard → **Add New Project** → import the repo
3. Vercel auto-deploys on every push to `main`

---

## Step 9 — Recommended Project Structure (after scaffolding)

```
my-app/
├── .gitignore
├── CLAUDE.md                    ← Claude Code rules
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                   ← secrets (gitignored)
├── supabase/                    ← local Supabase config & migrations
│   └── migrations/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── dashboard/
    │   │   └── page.tsx
    │   └── api/
    │       └── posts/
    │           └── route.ts
    ├── components/
    │   ├── Navbar.tsx
    │   └── Hero.tsx
    ├── hooks/
    │   └── usePosts.ts
    ├── lib/
    │   └── supabase.ts
    └── types/
        └── index.ts
```

---

## Quick-Reference Command Cheatsheet

| Action | Command |
|--------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Run Claude Code | `claude` |
| Start local Supabase | `supabase start` |
| Apply DB migrations | `supabase db push` |
| Deploy to Vercel | `vercel --prod` |
| Check Vercel logs | `vercel logs` |

---

## Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code/overview)
