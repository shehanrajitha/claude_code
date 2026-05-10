# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Turbopack) at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests (Vitest + jsdom)
npx vitest run src/components/editor/__tests__/file-tree.test.tsx  # Run a single test file
npm run db:reset     # Reset and re-migrate the SQLite database
```

The app runs without an `ANTHROPIC_API_KEY` — it falls back to a `MockLanguageModel` that returns static components.

## Architecture

### Virtual File System

All AI-generated files live entirely in memory — nothing is written to disk. `src/lib/file-system.ts` implements `VirtualFileSystem`, a `Map<string, FileNode>` tree with POSIX-style paths. It exposes text-editor-style operations (`viewFile`, `replaceInFile`, `insertInFile`) used directly by the AI tools.

### AI Generation Pipeline

`src/app/api/chat/route.ts` is the single API endpoint. It:
1. Accepts `messages` + a serialized `files` snapshot from the client
2. Reconstructs a `VirtualFileSystem` from the snapshot
3. Streams Claude via Vercel AI SDK's `streamText` with two tools:
   - **`str_replace_editor`** — create / str_replace / insert / view (built in `src/lib/tools/str-replace.ts`)
   - **`file_manager`** — rename / delete (built in `src/lib/tools/file-manager.ts`)
4. On finish, saves messages + serialized FS to the Prisma `Project` row (authenticated users only)

`src/lib/provider.ts` returns either `anthropic("claude-haiku-4-5")` or `MockLanguageModel` depending on whether `ANTHROPIC_API_KEY` is set.

### Client-Side State

`FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) owns the client-side `VirtualFileSystem` instance and a `refreshTrigger` counter. `handleToolCall` interprets incoming AI tool calls and mutates the FS, incrementing the trigger so `PreviewFrame` and `FileTree` re-render.

`ChatContext` (`src/lib/contexts/chat-context.tsx`) manages the Vercel AI SDK `useChat` hook, forwarding each tool call to `handleToolCall` and uploading the full serialized FS with each message.

### Live Preview

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) re-renders on every `refreshTrigger` change. It calls `createImportMap` from `src/lib/transform/jsx-transformer.ts`, which:
1. Transpiles every `.jsx/.tsx/.ts/.js` file with `@babel/standalone`
2. Creates blob URLs for each transpiled module
3. Builds an ES module import map (handles `@/` aliases, relative paths, and auto-fetches unknown packages from `esm.sh`)
4. Injects it all into an `srcdoc` iframe that renders the entry point (defaults to `/App.jsx`)

Tailwind CSS is loaded via CDN in the preview iframe.

### Auth & Persistence

Auth is JWT-in-httpOnly-cookie using `jose` (`src/lib/auth.ts`). `src/middleware.ts` protects routes. There is no OAuth — users sign up with email + bcrypt password.

Prisma uses SQLite (`prisma/dev.db`). The `Project` model stores `messages` and `data` (serialized VirtualFileSystem) as JSON strings. The Prisma client is generated to `src/generated/prisma` (non-default location configured in `prisma/schema.prisma`).

Anonymous users can generate components; projects are only persisted to the database for authenticated users.

### Testing

Tests use Vitest + jsdom + React Testing Library. Test files are co-located in `__tests__` directories next to their source. The vitest config resolves TypeScript path aliases via `vite-tsconfig-paths`.