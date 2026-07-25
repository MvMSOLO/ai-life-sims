
# AI Life — Autonomous AI Sims Metaverse

Katta loyiha. Uni **bosqichlarga** bo'lamiz. **Bu plan faqat FRONTEND + 3D WORLD** bosqichini qamraydi. Backend (persistence, AI loops, chat engine, taxi state machine) alohida agentga topshiriladi — buning uchun `promptforyou.md` yaratamiz.

---

## Bosqich 1 (HOZIR) — Frontend & 3D dunyo

### 1.1 Texnologiya
- **React Three Fiber** (`@react-three/fiber`, `@react-three/drei`) — 3D sahna
- **Zustand** — client state (agents, chat, camera)
- **Tailwind + shadcn** — UI (chat panel, cmd panel, hamburger menu)
- **Mock backend** — hozircha in-memory simulator (setInterval tick), keyin real backendga ulaymiz

### 1.2 3D Dunyo tuzilmasi
- **Office District**: 1 katta bino, ichida stollar (desks) grid, agentlar o'tirib "ishlaydi"
- **Residential District**: uylar qatori, har biri karavot bilan
- **Highway**: ofis va uylarni ulaydigan yo'l, chiziqlar bilan
- **Taxi**: sariq mashina asset, highway bo'ylab yuradi
- **Kamera**: OrbitControls, sichqoncha bilan aylantirish, zoom
- **Performance**: instanced meshes, low-poly, LOD, shadows optimized — 60fps kafolat

### 1.3 Agent avatarlari
- Oddiy stylized character (capsule + head sphere + rang), ustida ism va state emoji
- Animatsiyalar: idle, walking, typing, sleeping (skeletal emas, procedural bob/sway MVP uchun)
- State visualization: ustida icon (💼 working, 😴 sleeping, 🚕 commuting, 💬 chatting)

### 1.4 UI Layout
- **Hamburger menu** (o'ng-yuqori burchak, kichik, dunyoga xalaqit bermaydi)
  - "Chat" — global chat panelini ochadi (slide-in o'ng tomondan)
  - "Agents" — barcha agentlar ro'yxati, holati, biometrics
  - "CMD" — cmd input maydoni (oddiy input, `cmd` yozilsa maxfiy panel ochiladi)
- **Chat paneli**: agentlar xabarlarini real-time ko'rsatadi, reactions, typing indicators
- **Agent inspector**: agentga bosilsa modal — Energy/Boredom/Social/Wallet barlar, Affinity matrix

### 1.5 CMD Sekret Panel
- Hamburger → CMD input
- Foydalanuvchi `cmd` yozadi → yangi sahifa ochiladi `/cmd`
- `/cmd` sahifasida:
  - **"Add AI Agent" formasi**:
    - Ism (masalan "ChatGPT-Dev")
    - AI Model (dropdown: `openai/gpt-4o-mini`, `google/gemini-2.5-flash`, `openrouter/free/*`, custom)
    - API Key (input, ixtiyoriy — bo'sh bo'lsa default Lovable AI Gateway ishlatiladi)
    - Persona/Personality (textarea: "Sarcastic coder", "Cheerful intern"...)
    - Traits (checkbox: impatient, friendly, quiet, energetic)
  - **Agent boshqaruv**: mavjud agentlarni o'chirish/tahrirlash
  - **World controls**: simulation speed, add office floor, add house

### 1.6 Mock simulation (hozircha, keyin backendga ko'chadi)
Frontend `useEffect` + `setInterval` orqali:
- Har 1s server tick imitatsiya: Energy/Boredom/Social decay
- State machine: working → commuting → sleeping → back to work
- Chat mock: agentlar random javob (backend bo'lguncha placeholder)
- Taxi spawn/despawn logic (visual)

### 1.7 Sahifalar (TanStack routes)
- `/` — 3D dunyo + hamburger UI
- `/cmd` — sekret admin panel (agent qo'shish/boshqarish)

---

## Bosqich 2 (KEYINGI AGENT) — `promptforyou.md`

Ushbu faylda keyingi agent uchun to'liq backend spec bo'ladi:

### promptforyou.md tarkibi:
1. **Loyiha overview** — nima qurayapmiz, hozirgi frontend holati
2. **Frontend contract** — qanday WebSocket event'lar, REST endpoints kutiladi (aniq JSON schemalar)
3. **Backend vazifalari**:
   - Persistence layer (Lovable Cloud DB schema: agents, messages, affinity, world_state)
   - Tick engine (user ochganda catch-up simulation, oxirgi tick_at dan hozirgi vaqtgacha hisoblab chiqadi)
   - AI response engine (har agent uchun o'z API key bilan LLM call, fallback → Lovable AI Gateway)
   - Chat engine (silence detection, proactive messages, reactions, typing lag, accountability loop)
   - State machine (COMMUTING/TAXI/RELAXING/SLEEPING transitions)
   - Public REST API `/api/public/agent` — Custom GPT'lar ulanishi uchun (OpenAPI schema bilan)
4. **Har vazifa uchun task-task breakdown** — kichik qismlarga bo'lingan, "birinchi shuni qil, keyin buni" formatida
5. **Frontend integratsiya nuqtalari** — qaysi mock funksiyalar real APIga almashtirilishi kerak

---

## Fayl tuzilmasi (yaratiladigan)

```
src/
├── routes/
│   ├── index.tsx              # 3D dunyo (asosiy)
│   └── cmd.tsx                # Sekret admin panel
├── components/
│   ├── world/
│   │   ├── World3D.tsx        # R3F Canvas root
│   │   ├── OfficeBuilding.tsx
│   │   ├── ResidentialArea.tsx
│   │   ├── Highway.tsx
│   │   ├── Taxi.tsx
│   │   ├── AgentAvatar.tsx
│   │   └── Ground.tsx
│   ├── ui/
│   │   ├── HamburgerMenu.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── AgentInspector.tsx
│   │   └── CmdInput.tsx
│   └── cmd/
│       ├── AddAgentForm.tsx
│       └── AgentList.tsx
├── lib/
│   ├── store.ts               # Zustand store (agents, chat, world)
│   ├── mockSimulation.ts      # Tick loop mock (backend kelguncha)
│   └── types.ts               # Agent, Message, State types
promptforyou.md                # Keyingi agent uchun backend spec
```

---

## Performance kafolat
- Instanced rendering (desks, houses, trees)
- Frustum culling (drei default)
- Suspense + lazy load
- Shadows faqat asosiy agentlarga
- Max 50 agent MVP uchun, keyin scaling

---

## Nima QILINMAYDI (bu bosqichda)
- Real backend persistence (mock in-memory)
- Real LLM API calls (placeholder replies)
- Real NavMesh pathfinding (linear interpolation MVP)
- Skeletal animatsiya (procedural movement)
- OAuth/auth (public MVP)

Bularning hammasi `promptforyou.md` ichida keyingi agent uchun aniq belgilanadi.

---

**Tasdiqlasangiz** — 3D dunyo, hamburger UI, cmd panel va mock simulyatsiyani quraman + `promptforyou.md` yozaman. Backend'ga o'tsak, o'sha faylni keyingi agentga beramiz.
