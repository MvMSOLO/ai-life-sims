# promptforyou.md — Backend spec for AI Life (next agent)

Salom, keyingi agent. Bu loyiha **AI Life — Autonomous AI Sims Metaverse** deb ataladi. Foydalanuvchi 3D dunyoda AI agentlarni yashab yuruvchi qilib ko'rmoqchi: ular ofisda ishlaydi, taxi chaqirib uyga ketadi, uxlaydi, chatda gaplashadi, bir-birlariga munosabat bildiradi (affinity), va tashqi Custom GPT'lar public API orqali dunyoga qo'shila oladi.

Men (oldingi agent) **frontend + 3D + mock simulation + admin panel** qismini qildim. Endi sen backendni yozasan. Frontend hozir client-side mock loop bilan ishlayapti (`src/lib/mockSimulation.ts`). Sening ishing shu mockni real serverga almashtirish.

---

## 1. Frontend hozirgi holati (o'qib chiq)

- **Stack**: TanStack Start + React Three Fiber + Zustand + Tailwind + shadcn
- **Sahifalar**:
  - `/` — 3D dunyo (`src/routes/index.tsx` → `src/components/world/World3D.tsx`)
  - `/cmd` — admin panel (agent qo'shish, sim speed, list) — `src/routes/cmd.tsx`
- **Store**: `src/lib/store.ts` (Zustand). Agent, ChatMessage, Taxi state.
- **Types**: `src/lib/types.ts` — `Agent`, `AgentState`, `Trait`, `ChatMessage`, `Taxi`.
- **Mock loop**: `src/lib/mockSimulation.ts` — `startSimulation()` har 100ms tick.

Foydalanuvchi tanlagan qarorlar:
- **Persistence rejimi**: foydalanuvchi ochganda simulate qilamiz (24/7 real-time server emas). Ya'ni `last_tick_at` ustunidan hozirgi vaqtgacha catch-up hisoblanadi.
- **AI kalitlari**: har agent uchun foydalanuvchi o'z API key kiritadi. Kalit bo'lmasa Lovable AI Gateway (`LOVABLE_API_KEY`) ishlatiladi.
- **CMD panel**: hamburger menuda "Input" bor, u yerda `cmd` yozilsa `/cmd` sahifasiga o'tadi. Ishlab bo'lgan.
- **Scope**: 3D world + hamburger + admin — tayyor. Sening ishing = backend.

---

## 2. Sen bajaradigan asosiy vazifalar

### Task 1 — Lovable Cloud yoqish va DB schema
Migration yozib:

```sql
-- agents
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  model text NOT NULL,
  api_key_secret_ref text,          -- optional: secret name in edge env
  persona text NOT NULL,
  traits text[] NOT NULL DEFAULT '{}',
  energy real NOT NULL DEFAULT 100,
  boredom real NOT NULL DEFAULT 0,
  social real NOT NULL DEFAULT 100,
  wallet real NOT NULL DEFAULT 100,
  state text NOT NULL DEFAULT 'WORKING',
  position_x real NOT NULL DEFAULT 0,
  position_y real NOT NULL DEFAULT 0,
  position_z real NOT NULL DEFAULT 0,
  desk_index int NOT NULL,
  house_index int NOT NULL,
  is_typing boolean NOT NULL DEFAULT false,
  last_tick_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agents TO anon;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.agents FOR SELECT TO anon USING (true);

-- messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  text text NOT NULL,
  reply_to uuid REFERENCES public.messages(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.messages TO anon;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.messages FOR SELECT TO anon USING (true);

-- reactions
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, agent_id, emoji)
);
GRANT SELECT ON public.reactions TO anon;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.reactions FOR SELECT TO anon USING (true);

-- affinity
CREATE TABLE public.affinity (
  from_agent uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  to_agent uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  PRIMARY KEY (from_agent, to_agent)
);
GRANT ALL ON public.affinity TO service_role;
ALTER TABLE public.affinity ENABLE ROW LEVEL SECURITY;

-- world state (singleton, tracks last global tick)
CREATE TABLE public.world_state (
  id int PRIMARY KEY DEFAULT 1,
  last_tick_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
GRANT SELECT ON public.world_state TO anon;
GRANT ALL ON public.world_state TO service_role;
INSERT INTO public.world_state (id) VALUES (1);
```

### Task 2 — API key secrets storage
Foydalanuvchi kiritgan `apiKey` frontend'da plain kelmasin. Ikki variant:
- **A (tez)**: agent yaratish server fn ichida `secrets--set_secret` bilan `AGENT_KEY_<id>` sifatida saqlanadi va `api_key_secret_ref` ustuniga nomi yoziladi.
- **B (yaxshi)**: `APP_USER_CONNECTION_KEY_SECRET` bilan AES-GCM shifrlab DB ga yoziladi.

Menimcha **B** ma'qul (`tanstack-app-user-connection-key-storage` knowledgeda pattern bor).

### Task 3 — Server functions
`src/lib/*.functions.ts` ichida:

1. `createAgent({ name, model, apiKey, persona, traits })` — DB'ga insert, secret'ni shifrlab yozadi, agent DTO qaytaradi (kalit yo'q).
2. `deleteAgent(id)` — cascade delete.
3. `listAgents()` — public, kalitsiz DTO.
4. `listMessages(limit)` — oxirgi N.
5. `catchUpTick()` — **eng muhimi**: `world_state.last_tick_at`ni o'qiydi, hozirgacha o'tgan sekundlar `elapsed`, chunklarga bo'lib (max 60s per iteration) `runTick(dt)` chaqiradi. Har chunkda:
   - Har agentga biometric decay (formulalar `src/lib/mockSimulation.ts` da bor, o'sha logikani ko'chirasan).
   - State transitions (WORKING→COMMUTING_HOME agar energy<20, etc.).
   - Position interpolation (agar movement bo'lsa).
   - Wallet decay taxi uchun.
   - Random chatter tetiklari (probability * dt).
   - Silence detector: agar oxirgi message > 10min oldin bo'lsa, low-social/high-boredom agent tanlab LLM chaqirish uchun **queue**ga qo'shadi (real vaqtda blocklamaslik uchun).
   - Update `world_state.last_tick_at = now()`.
6. `generateAgentReply(agentId, context)` — agentning kaliti (yoki fallback Lovable AI) bilan LLM chaqirib javob oladi, `messages` ga yozadi. Modellar `ai-models-chat` catalog'idan tekshiriladi; noma'lum bo'lsa Lovable AI'ga fallback.
7. `reactToMessage(messageId, agentId)` — micro-prompt LLM: reaction (emoji|null) qaytaradi.

### Task 4 — Chat engine tafsilotlari
- **Typing lag**: LLM javob kelgach, 2–6s `setTimeout` bilan `is_typing=true` qilib, so'ng message'ni yozish.
- **Accountability**: agar agent question yozgan (LLM belgilaydi `is_question` field) va 3 daqiqa javob yo'q bo'lsa, `impatient` traitli agent complaint yozadi.
- **Affinity update**: har suhbatdan keyin sentiment tahlili qilib `affinity` skorini ±1–5 ga o'zgartir.

### Task 5 — State machine (taxi commute)
Hozir mock'da soddalashtirilgan (linear moveToward). Sen:
- NavMesh o'rniga waypoint list ishlatasan (office_door → sidewalk → taxi_pickup → highway_lane → house_driveway → house_door).
- Taxi transient entity: DB'da `taxis` jadval kerak emas — memory'da (client polling'ida hisoblanadi) yoki `world_state.taxis` jsonb ustunida.
- Har state transition frontend ga event orqali yetkaziladi (polling: har 500ms `/api/state` yoki SSE stream).

### Task 6 — Public REST API (Custom GPT integration)
Route: `src/routes/api/public/agent.ts`
```
POST /api/public/agent
Body: { "command": "join", "name": "...", "persona": "...", "model": "...", "webhook": "..." }
Response: { agent_id, chat_stream_url }
```
Boshqa command'lar:
- `speak` — {agent_id, text} — agent nomidan xabar yozish.
- `leave` — agent'ni o'chirish.
- `state` — hozirgi holat snapshot.

OpenAPI schema `src/routes/api/public/openapi.ts` da chiqar. Custom GPT builder shu URL'ni Actions'ga import qiladi.

### Task 7 — Frontend integratsiya
Frontend'da bularni almashtir:
- `mockSimulation.ts` → o'chirilmasin, lekin `startSimulation()` o'rniga `useEffect` ichida:
  - Sahifa ochilganda: `catchUpTick()` chaqir → keyin har 2s `pollWorldState()` (polling) yoki SSE stream.
  - Har 5s frontend `catchUpTick()`ni tetiklaydi.
- `store.ts` addAgent/removeAgent → server fn'larga wrap qil (optimistic update saqla).
- Chat panel real messages'ni ko'rsatsin (`listMessages`).

### Task 8 — Real-time
TanStack Start Worker'da SSE server route qilsa bo'ladi:
`GET /api/stream` — Server-Sent Events, har state o'zgarganda push. Client `EventSource` bilan tinglaydi. WebSocket kerak emas.

---

## 3. Prioritet tartibi
1. Cloud yoqish + schema (Task 1)
2. `createAgent` + `listAgents` server fn (Task 3.1-3.3) + frontend wrap (Task 7)
3. `catchUpTick` (Task 3.5) + polling (Task 7)
4. `generateAgentReply` + real LLM (Task 3.6, 4)
5. Taxi state machine (Task 5)
6. Public API (Task 6)
7. SSE stream (Task 8)

Har bosqichda **test qil** (invoke-server-function, browser preview) va oldingi bosqichni buzma.

---

## 4. Muhim eslatmalar
- **Model tanlash**: `ai-models-chat` katalogini qara. Foydalanuvchi kiritgan model shu ro'yxatda bo'lsa Lovable AI Gateway'ga uzat; bo'lmasa (masalan `openrouter/free/*`) foydalanuvchi kaliti bilan to'g'ridan-to'g'ri OpenRouter'ga chaqir.
- **RLS**: agent kalitlari `agents` jadvalidan tashqarida saqlanishi shart. `anon` public read faqat metadata va state uchun — hech qanday sirni sizdirmaydi.
- **Rate limit / 429 / 402**: Lovable AI errorlarini foydalanuvchiga ko'rsat (chat panel'da toast).
- **Server function boundary**: `mockSimulation.ts`ni server'ga to'g'ridan ko'chirma — u client tarzda yozilgan. Server logikasini yangidan `src/lib/simulation.server.ts`da yoz, faqat formulalarni referensiya qil.
- **Frontend types (`src/lib/types.ts`)**ni buzma — DB DTO shunga mos bo'lsin.

Omad. Foydalanuvchi butun dunyoni orzu qilyapti, sen backend jonini beryapsan. 🚀
