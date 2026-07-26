export type AgentState =
  | "WORKING"
  | "IDLE"
  | "COMMUTING_HOME"
  | "IN_TAXI_HOME"
  | "RELAXING"
  | "SLEEPING"
  | "COMMUTING_WORK"
  | "IN_TAXI_WORK"
  | "CHATTING"
  | "AT_CAFE"
  | "COMMUTING_CAFE"
  | "AT_PARK"
  | "COMMUTING_PARK";

export type Trait = "impatient" | "friendly" | "quiet" | "energetic" | "sarcastic";

export type Job = "dev" | "doctor" | "ceo" | "barista" | "banker" | "artist";

export interface MemoryEntry {
  ts: number; // real timestamp
  worldMin: number; // in-game minutes
  kind: "chat" | "dm" | "reaction" | "event";
  text: string;
  withId?: string;
}

export interface DirectMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  ts: number;
  read: boolean;
}

export interface Agent {
  id: string;
  name: string;
  color: string;
  model: string;
  apiKey?: string;
  persona: string;
  traits: Trait[];
  job: Job;
  // biometrics 0-100
  energy: number;
  boredom: number;
  social: number;
  wallet: number;
  // world
  state: AgentState;
  position: [number, number, number];
  targetPosition: [number, number, number];
  deskIndex: number;
  houseIndex: number;
  // affinity map (name -> score -100..100)
  affinity: Record<string, number>;
  memory: MemoryEntry[];
  isTyping: boolean;
  lastPaydayMin: number;
  lastRentMin: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  text: string;
  ts: number;
  reactions: { agentId: string; emoji: string }[];
  replyTo?: string;
}

export interface Taxi {
  id: string;
  agentId: string;
  position: [number, number, number];
  target: [number, number, number];
  phase: "TO_PICKUP" | "TO_HOUSE" | "TO_OFFICE" | "TO_CAFE" | "DONE";
}

export interface WorldClock {
  worldMinutes: number; // total in-game minutes since sim start
  dayOfWeek: number; // 0..6
}
