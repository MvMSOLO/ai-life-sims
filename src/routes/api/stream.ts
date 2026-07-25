import { createFileRoute } from "@tanstack/react-router";
import { query, queryOne } from "@/lib/db";

/**
 * SSE stream — pushes world state to the client every 2 seconds.
 * Client uses EventSource to listen.
 */
export const Route = createFileRoute("/api/stream")({
  server: {
    handlers: {
      GET: async () => {
        let closed = false;
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            const send = (data: string) => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch {
                closed = true;
              }
            };

            // Send initial ping
            send(JSON.stringify({ type: "ping" }));

            const push = async () => {
              if (closed) return;
              try {
                const [agents, msgs, ws] = await Promise.all([
                  query("SELECT id,name,color,model,persona,traits,energy,boredom,social,wallet,state,position_x,position_y,position_z,target_x,target_y,target_z,desk_index,house_index,is_typing,created_at FROM agents ORDER BY created_at ASC"),
                  query<{ id: string; agent_id: string; text: string; created_at: string }>(
                    "SELECT id,agent_id,text,created_at FROM messages ORDER BY created_at DESC LIMIT 50"
                  ),
                  queryOne<{ taxis: unknown }>("SELECT taxis FROM world_state WHERE id=1"),
                ]);

                const snapshot = {
                  type: "state",
                  agents: agents.map((row) => ({
                    id: row.id, name: row.name, color: row.color, model: row.model,
                    persona: row.persona, traits: row.traits,
                    energy: row.energy, boredom: row.boredom, social: row.social, wallet: row.wallet,
                    state: row.state,
                    position: [row.position_x, row.position_y, row.position_z],
                    targetPosition: [row.target_x, row.target_y, row.target_z],
                    deskIndex: row.desk_index, houseIndex: row.house_index,
                    isTyping: row.is_typing,
                    createdAt: new Date(row.created_at as string).getTime(),
                  })),
                  messages: msgs.reverse().map((m) => ({
                    id: m.id, agentId: m.agent_id, text: m.text,
                    ts: new Date(m.created_at).getTime(), reactions: [],
                  })),
                  taxis: (ws?.taxis as unknown[]) ?? [],
                };
                send(JSON.stringify(snapshot));
              } catch {
                closed = true;
                controller.close();
              }
            };

            // Poll DB and push every 2s
            const iv = setInterval(push, 2000);

            // Close when client disconnects
            // (streams auto-cancel via AbortSignal in Nitro)
            const cleanup = () => {
              closed = true;
              clearInterval(iv);
              try { controller.close(); } catch { /* already closed */ }
            };

            // Give the stream a lifetime of 5 minutes max to avoid zombie connections
            setTimeout(cleanup, 5 * 60 * 1000);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
