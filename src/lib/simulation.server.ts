'use server'
/**
 * Server-side simulation engine.
 * Mirrors the biometric logic from mockSimulation.ts but runs in Node/Nitro
 * and persists state to PostgreSQL.
 */
import { query, queryOne } from "./db";
import { callLLM } from "./llm";

// ── Constants (mirror of store.ts) ────────────────────────────────────────────
const OFFICE_POS = [-25, 0, 0] as const;
const HOUSE_START_X = 25;
const HOUSE_SPACING = 6;

export function deskPosition(index: number): [number, number, number] {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return [OFFICE_POS[0] - 3 + col * 2, 0, OFFICE_POS[2] - 4 + row * 2.5];
}

export function housePosition(index: number): [number, number, number] {
  return [HOUSE_START_X + index * HOUSE_SPACING, 0, -4];
}

function houseBedPosition(index: number): [number, number, number] {
  const p = housePosition(index);
  return [p[0], 0.5, p[2] - 1];
}

const WORLD = {
  taxiPickupOffice: [-18, 0, 4] as [number, number, number],
  taxiPickupHome:   [22, 0, 4] as [number, number, number],
  roadSpawn:        [-40, 0, 4] as [number, number, number],
  roadY:            0.05,
};

type AgentState =
  | "WORKING" | "IDLE" | "COMMUTING_HOME" | "IN_TAXI_HOME"
  | "RELAXING" | "SLEEPING" | "COMMUTING_WORK" | "IN_TAXI_WORK" | "CHATTING";

interface DbAgent {
  id: string;
  name: string;
  color: string;
  model: string;
  api_key_enc: string | null;
  persona: string;
  traits: string[];
  energy: number;
  boredom: number;
  social: number;
  wallet: number;
  state: AgentState;
  position_x: number; position_y: number; position_z: number;
  target_x: number; target_y: number; target_z: number;
  desk_index: number;
  house_index: number;
  is_typing: boolean;
}

interface TaxiState {
  id: string;
  agentId: string;
  position: [number, number, number];
  target: [number, number, number];
  phase: "TO_PICKUP" | "TO_HOUSE" | "TO_OFFICE" | "DONE";
}

function moveToward(
  pos: [number, number, number],
  target: [number, number, number],
  speed: number
): { pos: [number, number, number]; arrived: boolean } {
  const dx = target[0] - pos[0];
  const dy = target[1] - pos[1];
  const dz = target[2] - pos[2];
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.15) return { pos: [...target] as [number, number, number], arrived: true };
  const step = Math.min(speed, dist);
  return {
    pos: [pos[0] + (dx / dist) * step, pos[1] + (dy / dist) * step, pos[2] + (dz / dist) * step],
    arrived: false,
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FALLBACK_WORK = [
  "Anyone up for coffee later?",
  "This bug is driving me crazy 🐛",
  "Just pushed the PR, please review.",
  "Standup was quick today, nice.",
  "Deploy went smooth ✨",
  "Ugh, meetings all afternoon.",
  "Need a break soon.",
  "Lunch ideas?",
];
const FALLBACK_HOME = [
  "Made it home 🏠", "Time to relax.", "Netflix time.",
  "So tired… going to sleep.", "Good night everyone 😴",
];
const FALLBACK_IMPATIENT = [
  "Why is everyone ignoring me?", "Hello?? Anyone there?",
  "Are you guys even at their desks?",
];

/** Run one tick step (dt seconds) for a single agent in memory. Returns updated fields. */
function simulateAgent(
  a: DbAgent,
  dt: number,
  taxis: TaxiState[]
): Partial<DbAgent> & { chatTrigger?: boolean; chatContext?: string; shouldSpawnTaxi?: boolean } {
  let { energy, boredom, social, wallet, state,
    position_x: px, position_y: py, position_z: pz,
    target_x: tx, target_y: ty, target_z: tz } = a;

  const factor = dt; // already per-second

  // Biometric decay
  if (state === "WORKING") {
    energy  -= 0.5  * factor;
    boredom += 0.3  * factor;
    social  -= 0.2  * factor;
    wallet  += 0.5  * factor;
  } else if (state === "SLEEPING") {
    energy  += 1.5  * factor;
    boredom -= 0.2  * factor;
  } else if (state === "RELAXING") {
    energy  += 0.5  * factor;
    boredom -= 0.4  * factor;
    social  -= 0.1  * factor;
  }
  energy  = Math.max(0, Math.min(100, energy));
  boredom = Math.max(0, Math.min(100, boredom));
  social  = Math.max(0, Math.min(100, social));

  let chatTrigger = false;
  let chatContext = "";
  let shouldSpawnTaxi = false;

  // State transitions
  if (state === "WORKING" && energy < 20) {
    state = "COMMUTING_HOME";
    tx = WORLD.taxiPickupOffice[0];
    ty = WORLD.taxiPickupOffice[1];
    tz = WORLD.taxiPickupOffice[2];
    chatTrigger = true;
    chatContext = "I am exhausted after a long work day and heading home now. Write one short goodbye chat message (≤15 words).";
  } else if (state === "SLEEPING" && energy > 90) {
    state = "COMMUTING_WORK";
    tx = WORLD.taxiPickupHome[0];
    ty = WORLD.taxiPickupHome[1];
    tz = WORLD.taxiPickupHome[2];
  } else if (state === "RELAXING" && Math.random() < 0.005 * factor) {
    state = "SLEEPING";
    const bed = houseBedPosition(a.house_index);
    tx = bed[0]; ty = bed[1]; tz = bed[2];
  } else if (state === "WORKING" && Math.random() < 0.008 * factor) {
    chatTrigger = true;
    chatContext = "I am a developer working at my desk. Write one casual short work chat message (≤15 words, no quotes).";
  } else if (state === "RELAXING" && Math.random() < 0.005 * factor) {
    chatTrigger = true;
    chatContext = "I am relaxing at home after work. Write one casual short home chat message (≤15 words, no quotes).";
  }

  // Movement
  if (state === "COMMUTING_HOME") {
    const r = moveToward([px, py, pz], [tx, ty, tz], 0.05 * factor * 30);
    [px, py, pz] = r.pos;
    if (r.arrived) {
      const hasTaxi = taxis.some((t) => t.agentId === a.id);
      if (!hasTaxi) {
        wallet -= 10;
        shouldSpawnTaxi = true;
      }
    }
  } else if (state === "COMMUTING_WORK") {
    const r = moveToward([px, py, pz], [tx, ty, tz], 0.05 * factor * 30);
    [px, py, pz] = r.pos;
  }

  return {
    energy, boredom, social, wallet, state,
    position_x: px, position_y: py, position_z: pz,
    target_x: tx, target_y: ty, target_z: tz,
    chatTrigger, chatContext, shouldSpawnTaxi,
  };
}

/** Main catch-up function — called from server function / catchUpTick */
export async function runCatchUp(): Promise<void> {
  const ws = await queryOne<{ last_tick_at: string; taxis: TaxiState[] }>(
    "SELECT last_tick_at, taxis FROM world_state WHERE id = 1"
  );
  if (!ws) return;

  const lastTick = new Date(ws.last_tick_at).getTime();
  const now = Date.now();
  const elapsed = (now - lastTick) / 1000; // seconds
  if (elapsed < 0.5) return; // nothing to do

  const agents = await query<DbAgent>(
    "SELECT * FROM agents"
  );
  if (agents.length === 0) {
    // still update the tick time
    await query("UPDATE world_state SET last_tick_at = now() WHERE id = 1");
    return;
  }

  let taxis: TaxiState[] = ws.taxis ?? [];

  // Run in chunks of max 60s to avoid huge jumps
  const CHUNK = 60;
  let remaining = Math.min(elapsed, 3600); // cap at 1h

  const llmQueue: { agentId: string; model: string; apiKey: string | null; persona: string; traits: string[]; chatContext: string }[] = [];

  while (remaining > 0) {
    const dt = Math.min(remaining, CHUNK);
    remaining -= dt;

    for (const a of agents) {
      const patch = simulateAgent(a, dt, taxis);

      // Apply patch back to agent for next chunk
      Object.assign(a, patch);

      if (patch.shouldSpawnTaxi) {
        const taxiId = `taxi_${Date.now()}_${a.id.slice(0, 8)}`;
        taxis.push({
          id: taxiId,
          agentId: a.id,
          position: [...WORLD.roadSpawn],
          target: [...WORLD.taxiPickupOffice],
          phase: "TO_PICKUP",
        });
      }

      if (patch.chatTrigger && patch.chatContext) {
        llmQueue.push({
          agentId: a.id,
          model: a.model,
          apiKey: a.api_key_enc,
          persona: a.persona,
          traits: a.traits,
          chatContext: patch.chatContext,
        });
      }
    }

    // Taxi movement
    const nextTaxis: TaxiState[] = [];
    for (const t of taxis) {
      const agent = agents.find((a) => a.id === t.agentId);
      if (!agent) continue;

      const r = moveToward(t.position, t.target, 0.15 * dt * 30);
      t.position = r.pos;

      if (r.arrived) {
        if (t.phase === "TO_PICKUP") {
          agent.state = "IN_TAXI_HOME";
          agent.position_x = r.pos[0];
          agent.position_y = r.pos[1];
          agent.position_z = r.pos[2];
          const hp = housePosition(agent.house_index);
          t.target = [hp[0], WORLD.roadY, WORLD.roadY + 4];
          t.phase = "TO_HOUSE";
          nextTaxis.push(t);
        } else if (t.phase === "TO_HOUSE") {
          const hp = housePosition(agent.house_index);
          agent.state = "RELAXING";
          agent.position_x = hp[0];
          agent.position_y = 0;
          agent.position_z = hp[2];
          agent.target_x = hp[0];
          agent.target_y = 0;
          agent.target_z = hp[2];
          // taxi is done, don't push
        } else {
          nextTaxis.push(t);
        }
      } else {
        nextTaxis.push(t);
      }
    }
    taxis = nextTaxis;
  }

  // Batch-persist all agent updates
  for (const a of agents) {
    await query(
      `UPDATE agents SET
        energy=$1, boredom=$2, social=$3, wallet=$4, state=$5,
        position_x=$6, position_y=$7, position_z=$8,
        target_x=$9, target_y=$10, target_z=$11,
        last_tick_at=now()
      WHERE id=$12`,
      [
        a.energy, a.boredom, a.social, a.wallet, a.state,
        a.position_x, a.position_y, a.position_z,
        a.target_x, a.target_y, a.target_z,
        a.id,
      ]
    );
  }

  // Save taxi state in world_state
  await query(
    "UPDATE world_state SET last_tick_at=now(), taxis=$1 WHERE id=1",
    [JSON.stringify(taxis)]
  );

  // Fire LLM calls (non-blocking, best-effort) — only first few to avoid storms
  const batch = llmQueue.slice(0, 3);
  await Promise.allSettled(
    batch.map(async (item) => {
      const result = await callLLM(
        item.model,
        [
          {
            role: "system",
            text: `You are ${item.model} playing a character in a virtual AI office world. Your persona: "${item.persona}". Traits: ${item.traits.join(", ")}. Respond in character. Keep messages SHORT (1–2 sentences max).`,
          },
          { role: "user", text: item.chatContext },
        ],
        item.apiKey,
        80
      );
      if (result.text && !result.error) {
        await query(
          "INSERT INTO messages (agent_id, text) VALUES ($1, $2)",
          [item.agentId, result.text.slice(0, 500)]
        );
      } else if (result.error === "no_key") {
        // Fallback to canned line
        const agent = agents.find((a) => a.id === item.agentId);
        const state = agent?.state ?? "WORKING";
        const line =
          state === "RELAXING" || state === "SLEEPING"
            ? pick(FALLBACK_HOME)
            : pick(FALLBACK_WORK);
        await query(
          "INSERT INTO messages (agent_id, text) VALUES ($1, $2)",
          [item.agentId, line]
        );
      }
    })
  );

  // Silence detector — if >10 min quiet and agents exist, pick an impatient one
  const lastMsg = await queryOne<{ created_at: string }>(
    "SELECT created_at FROM messages ORDER BY created_at DESC LIMIT 1"
  );
  const silenceMs = lastMsg
    ? Date.now() - new Date(lastMsg.created_at).getTime()
    : Infinity;

  if (silenceMs > 10 * 60 * 1000 && agents.length > 0) {
    const impatient = agents.find((a) => a.traits.includes("impatient"));
    const speaker = impatient ?? pick(agents);
    const line = impatient ? pick(FALLBACK_IMPATIENT) : "So quiet in here today…";
    await query(
      "INSERT INTO messages (agent_id, text) VALUES ($1, $2)",
      [speaker.id, line]
    );
  }
}
