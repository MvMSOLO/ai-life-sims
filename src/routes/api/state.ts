import { createFileRoute } from "@tanstack/react-router";
import { query, queryOne } from "@/lib/db";

export const Route = createFileRoute("/api/state")({
  server: {
    handlers: {
      GET: async () => {
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

        const taxis = (ws?.taxis as unknown[]) ?? [];

        const data = {
          agents: agents.map((row) => ({
            id:             row.id,
            name:           row.name,
            color:          row.color,
            model:          row.model,
            persona:        row.persona,
            traits:         row.traits,
            energy:         row.energy,
            boredom:        row.boredom,
            social:         row.social,
            wallet:         row.wallet,
            state:          row.state,
            position:       [row.position_x, row.position_y, row.position_z],
            targetPosition: [row.target_x, row.target_y, row.target_z],
            deskIndex:      row.desk_index,
            houseIndex:     row.house_index,
            isTyping:       row.is_typing,
            createdAt:      new Date(row.created_at as string).getTime(),
          })),
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
        };

        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
