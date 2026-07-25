---
name: TanStack Start API routes (v1.168)
description: How to create HTTP API endpoints in TanStack Start v1.168 — no createAPIFileRoute; use createFileRoute with server.handlers.
---

# TanStack Start — HTTP API routes

## The rule
In TanStack Start v1.168, pure HTTP API routes (no React component) use `createFileRoute` with a `server.handlers` object, NOT a non-existent `createAPIFileRoute`.

**Why:** `createAPIFileRoute` does not exist in this version. The `server` option on `createFileRoute` (augmented by `@tanstack/react-start`) is the supported pattern. The router plugin auto-discovers files in `src/routes/api/` and adds them to `routeTree.gen.ts`.

**How to apply:**

```ts
// src/routes/api/example.ts
import { createFileRoute } from '@tanstack/react-router'
import { query } from '@/lib/db'

export const Route = createFileRoute('/api/example')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const data = await query('SELECT ...')
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        })
      },
      POST: async ({ request }) => {
        const body = await request.json()
        // ...
        return new Response(JSON.stringify({ ok: true }))
      },
    },
  },
})
```

The handler receives `{ request, params, context, next }`. Return a `Response` or call `next()` to pass through.

Files are placed in `src/routes/api/` (or nested like `src/routes/api/public/thing.ts`). The router plugin handles the rest — no manual route registration needed.
