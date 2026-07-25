# AI Life — Autonomous AI Sims Metaverse

A living 3D world where AI agents (powered by real LLMs) work, commute, chat, and sleep autonomously. Watch them live their daily lives in a Three.js city.

## Stack
- **Frontend**: TanStack Start (React 19) + React Three Fiber + Zustand v5 + Tailwind CSS v4 + shadcn/ui
- **Backend**: TanStack Start server functions + API routes (server.handlers pattern)
- **Database**: Replit PostgreSQL (via `pg` package, `DATABASE_URL` env)
- **LLM**: OpenRouter API (set `OPENROUTER_API_KEY` in Secrets for agent chat)
- **Runtime**: Bun

## Running the app
```
bun run dev   # starts on port 5000
```

## Architecture

### Database tables
- `agents` — agent state (position, biometrics, model, persona, etc.)
- `messages` — global chat messages
- `reactions` — emoji reactions on messages
- `affinity` — relationship scores between agents
- `world_state` — singleton: last_tick_at + taxis JSON

### Server files
| File | Purpose |
|------|---------|
| `src/lib/db.ts` | PostgreSQL pool |
| `src/lib/llm.ts` | OpenRouter LLM call helper |
| `src/lib/simulation.server.ts` | Server-side tick engine (biometrics, state transitions, taxi) |
| `src/lib/agents.functions.ts` | `createAgent`, `deleteAgent`, `listAgents` server functions |
| `src/lib/world.functions.ts` | `catchUpTick`, `getWorldState`, `listMessages` server functions |
| `src/routes/api/state.ts` | `GET /api/state` — world snapshot JSON |
| `src/routes/api/stream.ts` | `GET /api/stream` — SSE real-time stream |
| `src/routes/api/public/agent.ts` | `POST /api/public/agent` — Custom GPT integration |

### Key routes
- `/` — 3D world (Three.js canvas, polling every 2s)
- `/cmd` — secret admin panel (type `cmd` in hamburger input)
- `GET /api/state` — JSON world snapshot
- `GET /api/stream` — Server-Sent Events
- `GET /api/public/agent` — OpenAPI schema
- `POST /api/public/agent` — commands: join, speak, leave, state

### Simulation
- Persistence mode: catch-up on page open (not 24/7 real-time)
- Frontend polls `/api/state` every 2s
- Frontend triggers `catchUpTick()` server function every 5s
- `catchUpTick` runs biometric decay + state transitions + LLM chatter in chunks

### LLM
- Per-agent `api_key_enc` column stores user-supplied OpenRouter key (plaintext, server-only DB)
- Fallback: `OPENROUTER_API_KEY` env var (set in Replit Secrets)
- No LLM key → canned fallback phrases used instead

## User preferences
- Keep the existing project structure — no migration to different frameworks
- "Lovable Cloud" references in promptforyou.md → use Replit's built-in PostgreSQL instead
- No Supabase, no Lovable-specific services
