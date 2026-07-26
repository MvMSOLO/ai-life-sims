import { create } from "zustand";
import type { Agent, ChatMessage, DirectMessage, Job, Taxi, Trait, MemoryEntry } from "./types";

const OFFICE_POS: [number, number, number] = [-25, 0, 0];
const HOUSE_START_X = 25;
const HOUSE_SPACING = 6;

export const WORLD = {
  officeCenter: OFFICE_POS,
  officeDoor: [-20, 0, 0] as [number, number, number],
  taxiPickupOffice: [-18, 0, 4] as [number, number, number],
  taxiPickupHome: [22, 0, 4] as [number, number, number],
  taxiPickupCafe: [8, 0, 4] as [number, number, number],
  cafeCenter: [8, 0, -12] as [number, number, number],
  parkCenter: [-8, 0, -14] as [number, number, number],
  bankCenter: [18, 0, -12] as [number, number, number],
  roadY: 0.05,
  roadSpawn: [-45, 0, 4] as [number, number, number],
  roadEnd: [45, 0, 4] as [number, number, number],
};

export function deskPosition(index: number): [number, number, number] {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return [OFFICE_POS[0] - 3 + col * 2, 0, OFFICE_POS[2] - 4 + row * 2.5];
}

export function housePosition(index: number): [number, number, number] {
  return [HOUSE_START_X + index * HOUSE_SPACING, 0, -4];
}

export function houseBedPosition(index: number): [number, number, number] {
  const p = housePosition(index);
  return [p[0], 0.5, p[2] - 1];
}

export function cafeSeatPosition(index: number): [number, number, number] {
  const [cx, , cz] = WORLD.cafeCenter;
  const cols = 3;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return [cx - 2 + col * 2, 0, cz - 1 + row * 2];
}

export function parkSpotPosition(index: number): [number, number, number] {
  const [cx, , cz] = WORLD.parkCenter;
  const angle = (index * 137.5 * Math.PI) / 180;
  const r = 2 + (index % 3);
  return [cx + Math.cos(angle) * r, 0, cz + Math.sin(angle) * r];
}

const COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

// Job → schedule/economy
export const JOB_INFO: Record<Job, { emoji: string; salary: number; rent: number; label: string }> = {
  dev:     { emoji: "💻", salary: 90,  rent: 30, label: "Developer" },
  doctor:  { emoji: "🩺", salary: 140, rent: 40, label: "Doctor" },
  ceo:     { emoji: "👔", salary: 240, rent: 70, label: "CEO" },
  barista: { emoji: "☕", salary: 45,  rent: 18, label: "Barista" },
  banker:  { emoji: "🏦", salary: 110, rent: 45, label: "Banker" },
  artist:  { emoji: "🎨", salary: 55,  rent: 22, label: "Artist" },
};

interface State {
  agents: Record<string, Agent>;
  messages: ChatMessage[];
  dms: DirectMessage[];
  taxis: Record<string, Taxi>;
  selectedAgentId: string | null;
  simSpeed: number;
  paused: boolean;
  // World clock
  worldMinutes: number; // total minutes elapsed in-game (0 = Monday 08:00)
  startedAt: number;

  addAgent: (input: {
    name: string;
    model: string;
    apiKey?: string;
    persona: string;
    traits: Trait[];
    job?: Job;
  }) => Agent;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  pushMemory: (id: string, entry: MemoryEntry) => void;
  addMessage: (m: Omit<ChatMessage, "id" | "ts" | "reactions">) => void;
  addReaction: (msgId: string, agentId: string, emoji: string) => void;
  sendDM: (fromId: string, toId: string, text: string) => void;
  markDMsRead: (agentId: string, withId: string) => void;
  spawnTaxi: (agentId: string, target: [number, number, number], phase: Taxi["phase"]) => void;
  updateTaxi: (id: string, patch: Partial<Taxi>) => void;
  removeTaxi: (id: string) => void;
  selectAgent: (id: string | null) => void;
  setSimSpeed: (s: number) => void;
  setPaused: (p: boolean) => void;
  tickClock: (dtMinutes: number) => void;
  adjustAffinity: (aId: string, bName: string, delta: number) => void;
}

let agentCounter = 0;
let msgCounter = 0;
let dmCounter = 0;
let taxiCounter = 0;

// Start day at Monday 08:00 = 480 minutes
const START_WORLD_MINUTES = 8 * 60;

export const useSim = create<State>((set, get) => ({
  agents: {},
  messages: [],
  dms: [],
  taxis: {},
  selectedAgentId: null,
  simSpeed: 1,
  paused: false,
  worldMinutes: START_WORLD_MINUTES,
  startedAt: Date.now(),

  addAgent: ({ name, model, apiKey, persona, traits, job }) => {
    const id = `agent_${++agentCounter}_${Date.now().toString(36)}`;
    const existing = Object.values(get().agents);
    const deskIndex = existing.length;
    const houseIndex = existing.length;
    const pos = deskPosition(deskIndex);
    const color = COLORS[existing.length % COLORS.length];
    const jobs: Job[] = ["dev", "doctor", "ceo", "barista", "banker", "artist"];
    const assignedJob: Job = job ?? jobs[existing.length % jobs.length];
    const agent: Agent = {
      id, name, color, model, apiKey, persona, traits,
      job: assignedJob,
      energy:  80 + Math.random() * 20,
      boredom: Math.random() * 25,
      social:  50 + Math.random() * 40,
      wallet:  200,
      state:   "WORKING",
      position: pos,
      targetPosition: pos,
      deskIndex, houseIndex,
      affinity: {},
      memory: [],
      isTyping: false,
      lastPaydayMin: get().worldMinutes,
      lastRentMin: get().worldMinutes,
      createdAt: Date.now(),
    };
    set((s) => ({ agents: { ...s.agents, [id]: agent } }));
    return agent;
  },

  removeAgent: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.agents;
      return { agents: rest };
    }),

  updateAgent: (id, patch) =>
    set((s) => {
      const a = s.agents[id];
      if (!a) return s;
      return { agents: { ...s.agents, [id]: { ...a, ...patch } } };
    }),

  pushMemory: (id, entry) =>
    set((s) => {
      const a = s.agents[id];
      if (!a) return s;
      const memory = [...a.memory, entry].slice(-30);
      return { agents: { ...s.agents, [id]: { ...a, memory } } };
    }),

  addMessage: (m) => {
    const id = `msg_${++msgCounter}`;
    set((s) => ({
      messages: [...s.messages, { ...m, id, ts: Date.now(), reactions: [] }].slice(-200),
    }));
  },

  addReaction: (msgId, agentId, emoji) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId
          ? {
              ...m,
              reactions: m.reactions.some((r) => r.agentId === agentId && r.emoji === emoji)
                ? m.reactions
                : [...m.reactions, { agentId, emoji }],
            }
          : m
      ),
    })),

  sendDM: (fromId, toId, text) => {
    const id = `dm_${++dmCounter}`;
    const ts = Date.now();
    set((s) => ({ dms: [...s.dms, { id, fromId, toId, text, ts, read: false }].slice(-500) }));
    const { pushMemory, agents, worldMinutes } = get();
    const toName = agents[toId]?.name ?? "";
    const fromName = agents[fromId]?.name ?? "";
    pushMemory(fromId, { ts, worldMin: worldMinutes, kind: "dm", text: `→ ${toName}: ${text}`, withId: toId });
    pushMemory(toId,   { ts, worldMin: worldMinutes, kind: "dm", text: `← ${fromName}: ${text}`, withId: fromId });
  },

  markDMsRead: (agentId, withId) =>
    set((s) => ({
      dms: s.dms.map((d) =>
        d.toId === agentId && d.fromId === withId ? { ...d, read: true } : d
      ),
    })),

  spawnTaxi: (agentId, target, phase) => {
    const id = `taxi_${++taxiCounter}`;
    set((s) => ({
      taxis: {
        ...s.taxis,
        [id]: {
          id, agentId,
          position: [...WORLD.roadSpawn],
          target,
          phase,
        },
      },
    }));
  },

  updateTaxi: (id, patch) =>
    set((s) => {
      const t = s.taxis[id];
      if (!t) return s;
      return { taxis: { ...s.taxis, [id]: { ...t, ...patch } } };
    }),

  removeTaxi: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.taxis;
      return { taxis: rest };
    }),

  selectAgent: (id) => set({ selectedAgentId: id }),
  setSimSpeed: (s) => set({ simSpeed: s }),
  setPaused: (p) => set({ paused: p }),
  tickClock: (dt) => set((s) => ({ worldMinutes: s.worldMinutes + dt })),

  adjustAffinity: (aId, bName, delta) =>
    set((s) => {
      const a = s.agents[aId];
      if (!a) return s;
      const cur = a.affinity[bName] ?? 0;
      const next = Math.max(-100, Math.min(100, cur + delta));
      return { agents: { ...s.agents, [aId]: { ...a, affinity: { ...a.affinity, [bName]: next } } } };
    }),
}));

// Clock helpers
export function getHour(worldMinutes: number): number {
  return Math.floor((worldMinutes % 1440) / 60);
}
export function getMinute(worldMinutes: number): number {
  return Math.floor(worldMinutes % 60);
}
export function getDayIndex(worldMinutes: number): number {
  return Math.floor(worldMinutes / 1440);
}
export function formatTime(worldMinutes: number): string {
  const h = getHour(worldMinutes);
  const m = getMinute(worldMinutes);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
export function isNight(worldMinutes: number): boolean {
  const h = getHour(worldMinutes);
  return h < 6 || h >= 20;
}
