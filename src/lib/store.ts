import { create } from "zustand";
import type { Agent, ChatMessage, Taxi, Trait } from "./types";

const OFFICE_POS: [number, number, number] = [-25, 0, 0];
const HOUSE_START_X = 25;
const HOUSE_SPACING = 6;

export const WORLD = {
  officeCenter: OFFICE_POS,
  officeDoor: [-20, 0, 0] as [number, number, number],
  taxiPickupOffice: [-18, 0, 4] as [number, number, number],
  taxiPickupHome: [22, 0, 4] as [number, number, number],
  roadY: 0.05,
  roadSpawn: [-40, 0, 4] as [number, number, number],
  roadEnd: [40, 0, 4] as [number, number, number],
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

const COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

interface State {
  agents: Record<string, Agent>;
  messages: ChatMessage[];
  taxis: Record<string, Taxi>;
  selectedAgentId: string | null;
  simSpeed: number;
  paused: boolean;

  addAgent: (input: {
    name: string;
    model: string;
    apiKey?: string;
    persona: string;
    traits: Trait[];
  }) => Agent;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  addMessage: (m: Omit<ChatMessage, "id" | "ts" | "reactions">) => void;
  addReaction: (msgId: string, agentId: string, emoji: string) => void;
  spawnTaxi: (agentId: string) => void;
  updateTaxi: (id: string, patch: Partial<Taxi>) => void;
  removeTaxi: (id: string) => void;
  selectAgent: (id: string | null) => void;
  setSimSpeed: (s: number) => void;
  setPaused: (p: boolean) => void;
}

let agentCounter = 0;
let msgCounter = 0;
let taxiCounter = 0;

export const useSim = create<State>((set, get) => ({
  agents: {},
  messages: [],
  taxis: {},
  selectedAgentId: null,
  simSpeed: 1,
  paused: false,

  addAgent: ({ name, model, apiKey, persona, traits }) => {
    const id = `agent_${++agentCounter}_${Date.now().toString(36)}`;
    const existing = Object.values(get().agents);
    const deskIndex = existing.length;
    const houseIndex = existing.length;
    const pos = deskPosition(deskIndex);
    const color = COLORS[existing.length % COLORS.length];
    const agent: Agent = {
      id,
      name,
      color,
      model,
      apiKey,
      persona,
      traits,
      energy: 80 + Math.random() * 20,
      boredom: Math.random() * 30,
      social: 50 + Math.random() * 40,
      wallet: 100,
      state: "WORKING",
      position: pos,
      targetPosition: pos,
      deskIndex,
      houseIndex,
      affinity: {},
      isTyping: false,
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
  addMessage: (m) => {
    const id = `msg_${++msgCounter}`;
    set((s) => ({
      messages: [
        ...s.messages,
        { ...m, id, ts: Date.now(), reactions: [] },
      ].slice(-200),
    }));
  },
  addReaction: (msgId, agentId, emoji) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId
          ? {
              ...m,
              reactions: m.reactions.some(
                (r) => r.agentId === agentId && r.emoji === emoji
              )
                ? m.reactions
                : [...m.reactions, { agentId, emoji }],
            }
          : m
      ),
    })),
  spawnTaxi: (agentId) => {
    const id = `taxi_${++taxiCounter}`;
    set((s) => ({
      taxis: {
        ...s.taxis,
        [id]: {
          id,
          agentId,
          position: [...WORLD.roadSpawn],
          target: [...WORLD.taxiPickupOffice],
          phase: "TO_PICKUP",
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
}));
