import { createServerFn } from "@tanstack/react-start";
import { query, queryOne } from "./db";
import { runCatchUp } from "./simulation.server";
import type { AgentDTO } from "./agents.functions";

// ── listMessages ──────────────────────────────────────────────────────────────
export interface MessageDTO {
  id: string;
  agentId: string;
  text: string;
  ts: number;
  replyTo: string | null;
  reactions: { agentId: string; emoji: string }[];
}

export const listMessages = createServerFn({ method: "GET" })
  .validator((d: unknown) => {
    const limit = typeof d === "number" ? d : 100;
    return { limit };
  })
  .handler(async ({ data }) => {
    const { limit } = data;
    const msgs = await query<{
      id: string; agent_id: string; text: string; created_at: string; reply_to: string | null;
    }>(
      "SELECT id, agent_id, text, created_at, reply_to FROM messages ORDER BY created_at DESC LIMIT $1",
      [limit]
    );

    const msgIds = msgs.map((m) => m.id);
    let reactions: { message_id: string; agent_id: string; emoji: string }[] = [];
    if (msgIds.length > 0) {
      reactions = await query<{ message_id: string; agent_id: string; emoji: string }>(
        `SELECT message_id, agent_id, emoji FROM reactions WHERE message_id = ANY($1::uuid[])`,
        [msgIds]
      );
    }

    return msgs.reverse().map((m) => ({
      id:      m.id,
      agentId: m.agent_id,
      text:    m.text,
      ts:      new Date(m.created_at).getTime(),
      replyTo: m.reply_to ?? null,
      reactions: reactions
        .filter((r) => r.message_id === m.id)
        .map((r) => ({ agentId: r.agent_id, emoji: r.emoji })),
    })) as MessageDTO[];
  });

// ── catchUpTick ───────────────────────────────────────────────────────────────
export const catchUpTick = createServerFn({ method: "POST" }).handler(async () => {
  await runCatchUp();
  return { ok: true };
});

// ── worldState — returns agents + recent messages + taxis ─────────────────────
export interface WorldStateDTO {
  agents: AgentDTO[];
  messages: MessageDTO[];
  taxis: {
    id: string;
    agentId: string;
    position: [number, number, number];
    target: [number, number, number];
    phase: string;
  }[];
}

function agentRowToDTO(row: Record<string, unknown>) {
  return {
    id:             row.id as string,
    name:           row.name as string,
    color:          row.color as string,
    model:          row.model as string,
    persona:        row.persona as string,
    traits:         row.traits as string[],
    energy:         row.energy as number,
    boredom:        row.boredom as number,
    social:         row.social as number,
    wallet:         row.wallet as number,
    state:          row.state as string,
    position:       [row.position_x as number, row.position_y as number, row.position_z as number] as [number, number, number],
    targetPosition: [row.target_x as number, row.target_y as number, row.target_z as number] as [number, number, number],
    deskIndex:      row.desk_index as number,
    houseIndex:     row.house_index as number,
    isTyping:       row.is_typing as boolean,
    createdAt:      new Date(row.created_at as string).getTime(),
  } satisfies AgentDTO;
}

export const getWorldState = createServerFn({ method: "GET" }).handler(async () => {
  const [agents, msgs, ws] = await Promise.all([
    query("SELECT * FROM agents ORDER BY created_at ASC"),
    query<{ id: string; agent_id: string; text: string; created_at: string; reply_to: string | null }>(
      "SELECT id, agent_id, text, created_at, reply_to FROM messages ORDER BY created_at DESC LIMIT 100"
    ),
    queryOne<{ taxis: unknown }>("SELECT taxis FROM world_state WHERE id=1"),
  ]);

  const msgIds = msgs.map((m) => m.id);
  let reactions: { message_id: string; agent_id: string; emoji: string }[] = [];
  if (msgIds.length > 0) {
    reactions = await query<{ message_id: string; agent_id: string; emoji: string }>(
      "SELECT message_id, agent_id, emoji FROM reactions WHERE message_id = ANY($1::uuid[])",
      [msgIds]
    );
  }

  const taxis = (ws?.taxis as { id: string; agentId: string; position: [number, number, number]; target: [number, number, number]; phase: string }[]) ?? [];

  return {
    agents: agents.map(agentRowToDTO),
    messages: msgs.reverse().map((m) => ({
      id:      m.id,
      agentId: m.agent_id,
      text:    m.text,
      ts:      new Date(m.created_at).getTime(),
      replyTo: m.reply_to ?? null,
      reactions: reactions
        .filter((r) => r.message_id === m.id)
        .map((r) => ({ agentId: r.agent_id, emoji: r.emoji })),
    })),
    taxis,
  } as WorldStateDTO;
});
