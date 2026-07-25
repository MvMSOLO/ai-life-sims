export type AgentState =
  | "WORKING"
  | "IDLE"
  | "COMMUTING_HOME"
  | "IN_TAXI_HOME"
  | "RELAXING"
  | "SLEEPING"
  | "COMMUTING_WORK"
  | "IN_TAXI_WORK"
  | "CHATTING";

export type Trait = "impatient" | "friendly" | "quiet" | "energetic" | "sarcastic";

export interface Agent {
  id: string;
  name: string;
  color: string;
  model: string;
  apiKey?: string;
  persona: string;
  traits: Trait[];
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
  // affinity map
  affinity: Record<string, number>;
  isTyping: boolean;
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
  phase: "TO_PICKUP" | "TO_HOUSE" | "TO_OFFICE" | "DONE";
}
