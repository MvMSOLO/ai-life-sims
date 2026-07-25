import {
  WORLD,
  deskPosition,
  houseBedPosition,
  housePosition,
  useSim,
} from "./store";
import type { Agent, AgentState } from "./types";

// Placeholder chat lines (backend agent will replace with real LLM calls)
const WORK_CHATTER = [
  "Anyone up for coffee later?",
  "This bug is driving me crazy 🐛",
  "Just pushed the PR, please review.",
  "Standup was quick today, nice.",
  "Lunch ideas?",
  "Ugh, meetings all afternoon.",
  "I need a vacation.",
  "Deploy went smooth ✨",
];
const HOME_CHATTER = [
  "Made it home 🏠",
  "Time to relax.",
  "Netflix time.",
  "So tired… going to sleep.",
  "Good night everyone 😴",
];
const IMPATIENT = [
  "Why is everyone ignoring me?",
  "Hello?? Anyone there?",
  "Are you guys even at your desks?",
];

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

function moveToward(
  pos: [number, number, number],
  target: [number, number, number],
  speed: number
): { pos: [number, number, number]; arrived: boolean } {
  const dx = target[0] - pos[0];
  const dz = target[2] - pos[2];
  const dy = target[1] - pos[1];
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.15) return { pos: [...target], arrived: true };
  const step = Math.min(speed, dist);
  const nx = pos[0] + (dx / dist) * step;
  const nz = pos[2] + (dz / dist) * step;
  const ny = pos[1] + (dy / dist) * step;
  return { pos: [nx, ny, nz], arrived: false };
}

let lastMsgAt = Date.now();

function tick(dt: number) {
  const s = useSim.getState();
  if (s.paused) return;
  const speed = s.simSpeed;
  const agents = Object.values(s.agents);

  // biometric decay & state transitions
  agents.forEach((a) => {
    let energy = a.energy;
    let boredom = a.boredom;
    let social = a.social;
    let wallet = a.wallet;
    let state: AgentState = a.state;
    let position: [number, number, number] = [...a.position];
    let target: [number, number, number] = [...a.targetPosition];
    let isTyping = a.isTyping;

    // decays per tick (dt in seconds, scaled)
    const factor = dt * speed;
    if (state === "WORKING") {
      energy -= 0.5 * factor;
      boredom += 0.3 * factor;
      social -= 0.2 * factor;
      wallet += 0.5 * factor;
    } else if (state === "SLEEPING") {
      energy += 1.5 * factor;
      boredom -= 0.2 * factor;
    } else if (state === "RELAXING") {
      energy += 0.5 * factor;
      boredom -= 0.4 * factor;
      social -= 0.1 * factor;
    }
    energy = Math.max(0, Math.min(100, energy));
    boredom = Math.max(0, Math.min(100, boredom));
    social = Math.max(0, Math.min(100, social));

    // trigger transitions
    if (state === "WORKING" && energy < 20) {
      state = "COMMUTING_HOME";
      target = [...WORLD.taxiPickupOffice];
      useSim.getState().addMessage({
        agentId: a.id,
        text: "I'm exhausted, heading home now.",
      });
    } else if (state === "SLEEPING" && energy > 90) {
      state = "COMMUTING_WORK";
      target = [...WORLD.taxiPickupHome];
    } else if (state === "RELAXING" && Math.random() < 0.005 * factor) {
      state = "SLEEPING";
      target = houseBedPosition(a.houseIndex);
    }

    // movement
    if (state === "COMMUTING_HOME") {
      const r = moveToward(position, target, 0.05 * factor * 30);
      position = r.pos;
      if (r.arrived) {
        // request taxi
        const hasTaxi = Object.values(useSim.getState().taxis).some(
          (t) => t.agentId === a.id
        );
        if (!hasTaxi) {
          wallet -= 10;
          useSim.getState().spawnTaxi(a.id);
        }
      }
    } else if (state === "COMMUTING_WORK") {
      const r = moveToward(position, target, 0.05 * factor * 30);
      position = r.pos;
    }

    useSim.getState().updateAgent(a.id, {
      energy,
      boredom,
      social,
      wallet,
      state,
      position,
      targetPosition: target,
      isTyping,
    });
  });

  // taxis
  Object.values(useSim.getState().taxis).forEach((t) => {
    const r = moveToward(t.position, t.target, 0.15 * speed * dt * 30);
    useSim.getState().updateTaxi(t.id, { position: r.pos });
    if (r.arrived) {
      const agent = useSim.getState().agents[t.agentId];
      if (!agent) {
        useSim.getState().removeTaxi(t.id);
        return;
      }
      if (t.phase === "TO_PICKUP") {
        // pick up agent (hide by moving to taxi)
        useSim.getState().updateAgent(agent.id, {
          state: "IN_TAXI_HOME",
          position: [...r.pos],
        });
        useSim.getState().updateTaxi(t.id, {
          target: [housePosition(agent.houseIndex)[0], WORLD.roadY, WORLD.roadY + 4],
          phase: "TO_HOUSE",
        });
      } else if (t.phase === "TO_HOUSE") {
        const hp = housePosition(agent.houseIndex);
        useSim.getState().updateAgent(agent.id, {
          state: "RELAXING",
          position: [hp[0], 0, hp[2]],
          targetPosition: [hp[0], 0, hp[2]],
        });
        useSim.getState().removeTaxi(t.id);
      }
    }
  });

  // random chatter
  if (Math.random() < 0.02 * speed && agents.length > 0) {
    const a = pick(agents.filter((x) => x.state === "WORKING" || x.state === "RELAXING"));
    if (a) {
      const line =
        a.state === "WORKING" ? pick(WORK_CHATTER) : pick(HOME_CHATTER);
      useSim.getState().addMessage({ agentId: a.id, text: line });
      lastMsgAt = Date.now();
    }
  }

  // silence / impatient
  if (Date.now() - lastMsgAt > 30000 && agents.length > 0) {
    const impatient = agents.find((a) => a.traits.includes("impatient"));
    const speaker = impatient ?? pick(agents);
    useSim.getState().addMessage({
      agentId: speaker.id,
      text: impatient ? pick(IMPATIENT) : "So quiet in here today…",
    });
    lastMsgAt = Date.now();
  }

  // random reactions
  const msgs = useSim.getState().messages.slice(-5);
  msgs.forEach((m) => {
    if (Math.random() < 0.03 * speed) {
      const reactor = pick(agents.filter((a) => a.id !== m.agentId));
      if (reactor) {
        useSim
          .getState()
          .addReaction(m.id, reactor.id, pick(["👍", "😂", "🙄", "❤️", "🔥"]));
      }
    }
  });
}

let started = false;
let interval: ReturnType<typeof setInterval> | null = null;

export function startSimulation() {
  if (started) return;
  started = true;
  let last = Date.now();
  interval = setInterval(() => {
    const now = Date.now();
    const dt = (now - last) / 1000;
    last = now;
    tick(dt);
  }, 100);
}

export function stopSimulation() {
  if (interval) clearInterval(interval);
  interval = null;
  started = false;
}

// seed a few agents on first load
export function seedIfEmpty() {
  const s = useSim.getState();
  if (Object.keys(s.agents).length > 0) return;
  s.addAgent({
    name: "ChatGPT-Dev",
    model: "openai/gpt-4o-mini",
    persona: "Sarcastic senior coder who complains about legacy code.",
    traits: ["sarcastic", "impatient"],
  });
  s.addAgent({
    name: "Claude-Sunny",
    model: "anthropic/claude-3.5-haiku",
    persona: "Cheerful, always encouraging teammate.",
    traits: ["friendly", "energetic"],
  });
  s.addAgent({
    name: "Gemini-Quiet",
    model: "google/gemini-2.5-flash",
    persona: "Introverted, thoughtful, replies with short sentences.",
    traits: ["quiet"],
  });
  s.addAgent({
    name: "Mistral-Buzz",
    model: "mistral/mistral-small",
    persona: "High-energy hype-man, loves memes.",
    traits: ["energetic", "friendly"],
  });
}
