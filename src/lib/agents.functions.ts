import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "./db";
import { deskPosition, housePosition } from "./simulation.server";

// ── Colors ────────────────────────────────────────────────────────────────────
const COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

// ── Types returned to client (no api_key_enc) ─────────────────────────────────
export interface AgentDTO {
  id: string;
  name: string;
  color: string;
  model: string;
  persona: string;
  traits: string[];
  energy: number;
  boredom: number;
  social: number;
  wallet: number;
  state: string;
  position: [number, number, number];
  targetPosition: [number, number, number];
  deskIndex: number;
  houseIndex: number;
  isTyping: boolean;
  createdAt: number;
}

function rowToDTO(row: Record<string, unknown>): AgentDTO {
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
    position:       [row.position_x as number, row.position_y as number, row.position_z as number],
    targetPosition: [row.target_x as number, row.target_y as number, row.target_z as number],
    deskIndex:      row.desk_index as number,
    houseIndex:     row.house_index as number,
    isTyping:       row.is_typing as boolean,
    createdAt:      new Date(row.created_at as string).getTime(),
  };
}

// ── listAgents ─────────────────────────────────────────────────────────────────
export const listAgents = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await query(
    "SELECT * FROM agents ORDER BY created_at ASC"
  );
  return rows.map(rowToDTO);
});

// ── createAgent ───────────────────────────────────────────────────────────────
const CreateAgentInput = z.object({
  name:    z.string().min(1).max(60),
  model:   z.string().min(1),
  apiKey:  z.string().optional(),
  persona: z.string().min(1).max(1000),
  traits:  z.array(z.string()).max(10),
});

export const createAgent = createServerFn({ method: "POST" })
  .validator((d: unknown) => CreateAgentInput.parse(d))
  .handler(async ({ data }) => {
    // count existing agents to assign desk/house index
    const countRow = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM agents");
    const idx = parseInt(countRow?.count ?? "0", 10);

    const color = COLORS[idx % COLORS.length];
    const pos = deskPosition(idx);

    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO agents
        (name, color, model, api_key_enc, persona, traits,
         energy, boredom, social, wallet,
         position_x, position_y, position_z,
         target_x, target_y, target_z,
         desk_index, house_index)
       VALUES ($1,$2,$3,$4,$5,$6,
               $7,$8,$9,$10,
               $11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        data.name, color, data.model,
        data.apiKey ?? null,          // store plaintext for now (server-only DB)
        data.persona, data.traits,
        80 + Math.random() * 20,
        Math.random() * 30,
        50 + Math.random() * 40,
        100,
        pos[0], pos[1], pos[2],
        pos[0], pos[1], pos[2],
        idx, idx,
      ]
    );
    if (!row) throw new Error("Failed to create agent");
    return rowToDTO(row);
  });

// ── deleteAgent ───────────────────────────────────────────────────────────────
export const deleteAgent = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await query("DELETE FROM agents WHERE id = $1", [data.id]);
    return { ok: true };
  });
