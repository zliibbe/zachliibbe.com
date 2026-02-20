# AGENTS.md — Claude Code Subagent Strategy

This file documents how Claude Code should use specialized subagents when working on this codebase. Following these guidelines keeps the main context window lean, parallelizes safe operations, and routes each task to the right tool.

---

## Agent Types & When to Use Them

### Explore Agent
Use for codebase discovery before editing. Handles multi-round Glob + Grep searches without polluting the main context.

**Use when:**
- Finding all files that use a CSS class, hook, or component before refactoring
- Investigating how a feature works across multiple files (e.g. "how does blog scheduling work?")
- Confirming a pattern exists before following it (e.g. "how do other pages use `useInView`?")
- Searching for existing API routes before creating a new one

**Examples:**
- Before editing any CSS: "explore how `--accentPrimary` is used across the codebase"
- Before adding a new API route: "find all existing `/api/admin/` routes and their auth patterns"
- Before modifying a hook: "explore all components that import `useChatMessages`"

**Skip when:** You already know the exact file path — read it directly with the `Read` tool.

---

### Plan Agent
Use for features that will touch more than 3 files or require architectural decisions.

**Use when:**
- Adding a new page to the admin section
- Designing a new API integration (e.g. new external data source)
- Refactoring a shared component that is used across many pages
- Choosing between implementation approaches

**Examples:**
- "Plan the implementation of an analytics dashboard page"
- "Design how to add pagination to the blog post list"

**Skip when:** The task is a single-file fix, a minor enhancement, or requirements are already fully specified.

---

### Bash Agent
Use for isolated terminal tasks that don't need codebase context.

**Use when:**
- Running git operations (status, log, branch, merge)
- Running `bun run check:fix`, `bun run build`, or `bun run test` and collecting output
- Checking environment or process state

**Skip when:** You need to read file contents or search the codebase — use `Read`/`Grep`/`Glob` directly.

---

### General-Purpose Agent
Use for complex research requiring multiple rounds of search, web fetching, and reasoning.

**Use when:**
- Investigating a third-party API's behavior (e.g. Strava OAuth flow)
- Debugging a production issue that requires cross-referencing logs, code, and docs
- Answering "why is X happening?" questions that span multiple files and external systems

---

## Project-Specific Conventions

### Before Editing CSS
Run an Explore agent to check:
1. What CSS variables are available in `globals.css`
2. Whether the target class already exists in the relevant `.module.css` file
3. Whether the same styling pattern is used elsewhere

Always use CSS custom properties (`var(--accentPrimary)`, `var(--themeColor)`, etc.) — never hard-code colors.

### Before Adding a New API Route
1. Explore `src/app/api/` to find the nearest existing route for reference
2. Check auth pattern: admin routes use `getServerSession(authOptions)`; public routes use no auth
3. Check CSRF pattern: mutation routes (`POST`, `PUT`, `DELETE`) in `/api/blog/` validate `origin` and `referer` headers

### Before Touching Blog Storage
Read `src/lib/blog-storage.ts` first. Dev uses file-based JSON (`src/content/blog-data/`); production uses Vercel KV. Functions like `getAllPosts()`, `updateBlogPost()`, and `processScheduledPublications()` abstract this difference.

### New Features Touching > 3 Files
Always enter Plan Mode (`EnterPlanMode`) first. For admin pages specifically: follow the `container > contentWrapper > content` layout pattern and protect with `getServerSession`.

### Testing
Run `bun run test` (Jest via package.json — not `bun test` which uses the bun native runner). Tests live in `src/__tests__/`. Add tests for new API routes and hooks.

### Linting
Always run `bun run check:fix` after changes. Biome enforces:
- `useButtonType` as an error — all `<button>` elements need explicit `type`
- `noStaticElementInteractions` as an error — non-semantic elements with click handlers need `role` + biome-ignore

---

## Parallelization Guidelines

Run independently when safe:
- Multiple `Read` calls on unrelated files
- `Grep`/`Glob` searches across different directories
- `bun run check` + `git status` (both read-only)

Run sequentially:
- Write a file → then run `bun run check:fix` (linter sees the new file)
- Create API route → then wire up the UI (UI depends on route existing)
- Edit + `git add` + `git commit` (git operations are ordered)
