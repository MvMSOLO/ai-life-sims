import {
  WORLD,
  deskPosition,
  houseBedPosition,
  housePosition,
  cafeSeatPosition,
  parkSpotPosition,
  useSim,
  getHour,
  JOB_INFO,
} from "./store";
import type { Agent, AgentState, MemoryEntry } from "./types";

// ── Real-time → in-game time
// 1 real second = 4 in-game minutes → full day (1440 min) in 6 real minutes
const MINUTES_PER_REAL_SECOND = 4;

// Chatter pools by state
const WORK_CHATTER = [
  "This bug is haunting me 🐛",
  "PR is up — please review.",
  "Deploy went smooth ✨",
  "Coffee, anyone?",
  "Stand-up was mercifully short.",
  "Refactoring this legacy code is pain.",
  "Meeting overload today.",
  "Push notification driving me nuts.",
];
const CAFE_CHATTER = [
  "This latte hits different ☕",
  "Anyone want to split a sandwich?",
  "Lunch break is sacred.",
  "That new pastry is amazing.",
  "I needed this coffee so badly.",
];
const PARK_CHATTER = [
  "Fresh air, finally 🌳",
  "The sunset here is unreal.",
  "Anyone up for a walk?",
  "This bench is my new office.",
  "Nature therapy activated.",
];
const HOME_CHATTER = [
  "Made it home 🏠",
  "Netflix time.",
  "So tired…",
  "Ordering food tonight.",
  "Long day. Bed soon.",
];
const NIGHT_CHATTER = [
  "Good night everyone 😴",
  "Turning in early.",
  "Alarm set for 07:30.",
];
const IMPATIENT = [
  "Why is everyone ignoring me?",
  "Hello?? Anyone there?",
  "This chat is dead.",
];
const FRIENDLY_DM = [
  "Hey! How's your day going?",
  "We should grab coffee ☕",
  "You free after work?",
  "Loved your last comment 😄",
  "Wanna hit the park later?",
];

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

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
  return {
    pos: [
      pos[0] + (dx / dist) * step,
      pos[1] + (dy / dist) * step,
      pos[2] + (dz / dist) * step,
    ],
    arrived: false,
  };
}

// Determine agent's intended location by schedule
function intendedState(a: Agent, hour: number): AgentState {
  // Sleep 22:00–07:59
  if (hour >= 22 || hour < 8) return "SLEEPING";
  // Morning commute 08:00–08:59
  if (hour === 8) return "COMMUTING_WORK";
  // Lunch 12:00–12:59 → cafe
  if (hour === 12) return "AT_CAFE";
  // Work 09:00–11:59, 13:00–17:59
  if ((hour >= 9 && hour <= 11) || (hour >= 13 && hour <= 17)) return "WORKING";
  // Evening leisure 18:00–21:59 → park or home
  if (hour >= 18 && hour <= 19) {
    // low social → park (see others); else home
    return a.social < 50 ? "AT_PARK" : "RELAXING";
  }
  if (hour >= 20 && hour <= 21) return "RELAXING";
  return "IDLE";
}

function targetForState(a: Agent, s: AgentState): [number, number, number] {
  switch (s) {
    case "WORKING":       return deskPosition(a.deskIndex);
    case "SLEEPING":      return houseBedPosition(a.houseIndex);
    case "RELAXING":      { const p = housePosition(a.houseIndex); return [p[0], 0, p[2]]; }
    case "AT_CAFE":       return cafeSeatPosition(a.deskIndex);
    case "AT_PARK":       return parkSpotPosition(a.deskIndex);
    case "COMMUTING_WORK":return [...WORLD.taxiPickupHome];
    case "COMMUTING_HOME":return [...WORLD.taxiPickupOffice];
    case "COMMUTING_CAFE":return [...WORLD.taxiPickupOffice];
    case "COMMUTING_PARK":return [...WORLD.taxiPickupOffice];
    default:              return a.position;
  }
}

let lastMsgAt = Date.now();
let lastDMAt = Date.now();

function tick(dtSec: number) {
  const s = useSim.getState();
  if (s.paused) return;
  const speed = s.simSpeed;

  // Advance world clock
  s.tickClock(dtSec * MINUTES_PER_REAL_SECOND * speed);
  const worldMin = useSim.getState().worldMinutes;
  const hour = getHour(worldMin);

  const agents = Object.values(useSim.getState().agents);

  // Biometrics + schedule-driven state transitions
  agents.forEach((a) => {
    let energy = a.energy;
    let boredom = a.boredom;
    let social = a.social;
    let wallet = a.wallet;
    let state: AgentState = a.state;
    let position: [number, number, number] = [...a.position];
    let target: [number, number, number] = [...a.targetPosition];
    let lastPaydayMin = a.lastPaydayMin;
    let lastRentMin = a.lastRentMin;

    const factor = dtSec * speed;

    // Decay per state
    if (state === "WORKING") { energy -= 0.6 * factor; boredom += 0.35 * factor; social -= 0.15 * factor; }
    else if (state === "SLEEPING") { energy += 2.0 * factor; boredom -= 0.2 * factor; }
    else if (state === "RELAXING") { energy += 0.7 * factor; boredom -= 0.4 * factor; social -= 0.1 * factor; }
    else if (state === "AT_CAFE") { energy += 0.4 * factor; social += 0.6 * factor; boredom -= 0.3 * factor; }
    else if (state === "AT_PARK") { energy += 0.5 * factor; social += 0.4 * factor; boredom -= 0.5 * factor; }
    energy = Math.max(0, Math.min(100, energy));
    boredom = Math.max(0, Math.min(100, boredom));
    social = Math.max(0, Math.min(100, social));

    // Payday: hour 9 once per day
    const dayIdx = Math.floor(worldMin / 1440);
    const paydayIdx = Math.floor(lastPaydayMin / 1440);
    if (hour === 9 && dayIdx > paydayIdx) {
      wallet += JOB_INFO[a.job].salary;
      lastPaydayMin = worldMin;
      useSim.getState().addMessage({ agentId: a.id, text: `💰 Payday! +$${JOB_INFO[a.job].salary}` });
    }
    // Rent: hour 21 once per day
    const rentIdx = Math.floor(lastRentMin / 1440);
    if (hour === 21 && dayIdx > rentIdx) {
      wallet -= JOB_INFO[a.job].rent;
      lastRentMin = worldMin;
    }

    // Schedule enforcement — plan transition when idle at target
    const desired = intendedState(a, hour);
    const isMoving = state.startsWith("COMMUTING_") || state.startsWith("IN_TAXI_");
    if (!isMoving && state !== desired) {
      // Route through commute when leaving one zone for another
      if (state === "WORKING" && (desired === "AT_CAFE")) {
        state = "COMMUTING_CAFE";
        target = deskPosition(a.deskIndex); // walk to door area next tick
        target = [WORLD.officeDoor[0], 0, WORLD.officeDoor[2]];
      } else if (state === "WORKING" && (desired === "RELAXING" || desired === "AT_PARK" || desired === "SLEEPING")) {
        state = "COMMUTING_HOME";
        target = [...WORLD.taxiPickupOffice];
      } else if ((state === "RELAXING" || state === "SLEEPING") && desired === "WORKING") {
        state = "COMMUTING_WORK";
        target = [...WORLD.taxiPickupHome];
      } else if ((state === "RELAXING" || state === "AT_PARK") && desired === "SLEEPING") {
        state = "SLEEPING";
        target = houseBedPosition(a.houseIndex);
      } else if (state === "AT_CAFE" && desired === "WORKING") {
        // walk back to desk
        state = "COMMUTING_WORK";
        target = deskPosition(a.deskIndex);
      } else if (state === "AT_PARK" && desired === "RELAXING") {
        state = "COMMUTING_HOME";
        target = [housePosition(a.houseIndex)[0], 0, housePosition(a.houseIndex)[2]];
      } else {
        // Direct teleport-ish: just retarget
        state = desired;
        target = targetForState(a, desired);
      }
    }

    // Emergency: very low energy always → sleep
    if (energy < 8 && state !== "SLEEPING" && state !== "COMMUTING_HOME" && state !== "IN_TAXI_HOME") {
      state = "COMMUTING_HOME";
      target = [...WORLD.taxiPickupOffice];
      useSim.getState().addMessage({ agentId: a.id, text: "I'm crashing, heading home NOW." });
    }

    // Movement
    if (isMoving || state === "COMMUTING_WORK" || state === "COMMUTING_HOME" || state === "COMMUTING_CAFE") {
      const r = moveToward(position, target, 0.06 * factor * 30);
      position = r.pos;
      if (r.arrived) {
        if (state === "COMMUTING_HOME") {
          // Reached office taxi pickup → hail taxi home
          const hasTaxi = Object.values(useSim.getState().taxis).some((t) => t.agentId === a.id);
          if (!hasTaxi) {
            wallet -= 8;
            useSim.getState().spawnTaxi(a.id, [WORLD.taxiPickupOffice[0], WORLD.roadY, WORLD.taxiPickupOffice[2]], "TO_PICKUP");
          }
        } else if (state === "COMMUTING_WORK") {
          const atHome = Math.abs(position[0] - WORLD.taxiPickupHome[0]) < 1;
          if (atHome) {
            const hasTaxi = Object.values(useSim.getState().taxis).some((t) => t.agentId === a.id);
            if (!hasTaxi) {
              wallet -= 8;
              useSim.getState().spawnTaxi(a.id, [WORLD.taxiPickupHome[0], WORLD.roadY, WORLD.taxiPickupHome[2]], "TO_PICKUP");
            }
          } else {
            // arrived at desk
            state = "WORKING";
            target = deskPosition(a.deskIndex);
          }
        } else if (state === "COMMUTING_CAFE") {
          state = "AT_CAFE";
          target = cafeSeatPosition(a.deskIndex);
        }
      }
    }

    useSim.getState().updateAgent(a.id, {
      energy, boredom, social, wallet,
      state, position, targetPosition: target,
      lastPaydayMin, lastRentMin,
    });
  });

  // Taxis
  Object.values(useSim.getState().taxis).forEach((t) => {
    const r = moveToward(t.position, t.target, 0.22 * speed * dtSec * 30);
    useSim.getState().updateTaxi(t.id, { position: r.pos });
    if (r.arrived) {
      const agent = useSim.getState().agents[t.agentId];
      if (!agent) { useSim.getState().removeTaxi(t.id); return; }
      if (t.phase === "TO_PICKUP") {
        // Determine drop-off based on current agent state
        if (agent.state === "COMMUTING_HOME") {
          useSim.getState().updateAgent(agent.id, { state: "IN_TAXI_HOME", position: [...r.pos] });
          useSim.getState().updateTaxi(t.id, {
            target: [housePosition(agent.houseIndex)[0], WORLD.roadY, WORLD.roadY + 4],
            phase: "TO_HOUSE",
          });
        } else if (agent.state === "COMMUTING_WORK") {
          useSim.getState().updateAgent(agent.id, { state: "IN_TAXI_WORK", position: [...r.pos] });
          useSim.getState().updateTaxi(t.id, {
            target: [WORLD.officeDoor[0], WORLD.roadY, WORLD.taxiPickupOffice[2]],
            phase: "TO_OFFICE",
          });
        } else {
          useSim.getState().removeTaxi(t.id);
        }
      } else if (t.phase === "TO_HOUSE") {
        const hp = housePosition(agent.houseIndex);
        useSim.getState().updateAgent(agent.id, {
          state: intendedState(agent, hour) === "SLEEPING" ? "SLEEPING" : "RELAXING",
          position: [hp[0], 0, hp[2]],
          targetPosition: [hp[0], 0, hp[2]],
        });
        useSim.getState().removeTaxi(t.id);
      } else if (t.phase === "TO_OFFICE") {
        const dp = deskPosition(agent.deskIndex);
        useSim.getState().updateAgent(agent.id, {
          state: "WORKING",
          position: [dp[0], 0, dp[2]],
          targetPosition: [dp[0], 0, dp[2]],
        });
        useSim.getState().removeTaxi(t.id);
      }
    }
  });

  // ── Chatter — based on current state group
  const activeAgents = useSim.getState().agents;
  const agentArr = Object.values(activeAgents);
  if (Math.random() < 0.035 * speed && agentArr.length > 0) {
    const eligible = agentArr.filter((x) =>
      ["WORKING", "AT_CAFE", "AT_PARK", "RELAXING"].includes(x.state) && getHour(worldMin) < 22 && getHour(worldMin) >= 6
    );
    if (eligible.length) {
      const a = pick(eligible);
      const pool =
        a.state === "AT_CAFE" ? CAFE_CHATTER :
        a.state === "AT_PARK" ? PARK_CHATTER :
        a.state === "RELAXING" ? HOME_CHATTER :
        WORK_CHATTER;
      const text = pick(pool);
      useSim.getState().addMessage({ agentId: a.id, text });
      useSim.getState().pushMemory(a.id, { ts: Date.now(), worldMin, kind: "chat", text });
      lastMsgAt = Date.now();
    }
  }

  // Silence → impatient
  if (Date.now() - lastMsgAt > 25000 && agentArr.length > 0 && getHour(worldMin) >= 8 && getHour(worldMin) < 22) {
    const impatient = agentArr.find((x) => x.traits.includes("impatient") && x.state !== "SLEEPING");
    const speaker = impatient ?? agentArr.find((x) => x.state !== "SLEEPING");
    if (speaker) {
      useSim.getState().addMessage({ agentId: speaker.id, text: impatient ? pick(IMPATIENT) : "It's quiet in here…" });
      lastMsgAt = Date.now();
    }
  }

  // Night chatter around 22:00
  if (getHour(worldMin) === 22 && Math.random() < 0.02 * speed) {
    const goingToBed = agentArr.find((x) => x.state === "COMMUTING_HOME" || x.state === "RELAXING" || x.state === "IN_TAXI_HOME");
    if (goingToBed) useSim.getState().addMessage({ agentId: goingToBed.id, text: pick(NIGHT_CHATTER) });
  }

  // ── DMs — friendly agents initiate when social/boredom warrants
  if (Date.now() - lastDMAt > 8000 && Math.random() < 0.35 * speed && agentArr.length > 1) {
    const friendlies = agentArr.filter((a) => a.traits.includes("friendly") || a.social < 40);
    const initiator = friendlies.length ? pick(friendlies) : pick(agentArr);
    const others = agentArr.filter((x) => x.id !== initiator.id);
    if (others.length) {
      // Prefer agents with higher affinity
      const scored = others.map((o) => ({
        o,
        score: (initiator.affinity[o.name] ?? 0) + Math.random() * 20,
      })).sort((a, b) => b.score - a.score);
      const target = scored[0].o;
      const text = pick(FRIENDLY_DM);
      useSim.getState().sendDM(initiator.id, target.id, text);
      useSim.getState().adjustAffinity(initiator.id, target.name, 2);
      useSim.getState().adjustAffinity(target.id, initiator.name, 1);
      lastDMAt = Date.now();
    }
  }

  // Reactions
  const msgs = useSim.getState().messages.slice(-5);
  msgs.forEach((m) => {
    if (Math.random() < 0.04 * speed) {
      const reactor = pick(agentArr.filter((a) => a.id !== m.agentId && a.state !== "SLEEPING"));
      if (reactor) {
        const emoji = pick(["👍", "😂", "🙄", "❤️", "🔥", "☕", "😮"]);
        useSim.getState().addReaction(m.id, reactor.id, emoji);
        const author = activeAgents[m.agentId];
        if (author) useSim.getState().adjustAffinity(reactor.id, author.name, 1);
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

export function seedIfEmpty() {
  const s = useSim.getState();
  if (Object.keys(s.agents).length > 0) return;
  s.addAgent({ name: "ChatGPT-Dev",   model: "openai/gpt-4o-mini",         persona: "Sarcastic senior coder who complains about legacy code.", traits: ["sarcastic", "impatient"], job: "dev" });
  s.addAgent({ name: "Claude-Sunny",  model: "anthropic/claude-3.5-haiku", persona: "Cheerful, always encouraging teammate.",                  traits: ["friendly", "energetic"],  job: "doctor" });
  s.addAgent({ name: "Gemini-Quiet",  model: "google/gemini-2.5-flash",    persona: "Introverted, thoughtful, replies with short sentences.",  traits: ["quiet"],                  job: "artist" });
  s.addAgent({ name: "Mistral-Buzz",  model: "mistral/mistral-small",      persona: "High-energy hype-man, loves memes.",                       traits: ["energetic", "friendly"],  job: "barista" });
  s.addAgent({ name: "Nova-Chief",    model: "openai/gpt-4.1-mini",        persona: "Strategic CEO type; makes decisive calls.",                traits: ["impatient"],              job: "ceo" });
  s.addAgent({ name: "Atlas-Fin",     model: "anthropic/claude-3.5-sonnet",persona: "Numbers-obsessed banker with dry humor.",                  traits: ["sarcastic", "quiet"],     job: "banker" });
}
