import { createFileRoute } from "@tanstack/react-router";
import { query, queryOne } from "@/lib/db";
import { deskPosition } from "@/lib/simulation.server";

const COLORS = [
  "#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6",
  "#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16",
];

/**
 * Public REST API for Custom GPT integration.
 * POST /api/public/agent  { command, ...args }
 *
 * Commands:
 *  join   — add a new agent (returns { agent_id, chat_stream_url })
 *  leave  — remove an agent { agent_id }
 *  speak  — post a message  { agent_id, text }
 *  state  — get world snapshot
 */
export const Route = createFileRoute("/api/public/agent")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Return OpenAPI-style info on GET
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        return new Response(
          JSON.stringify({
            openapi: "3.0.0",
            info: { title: "AI Life Public API", version: "1.0.0" },
            servers: [{ url: base }],
            paths: {
              "/api/public/agent": {
                post: {
                  summary: "Control AI agents",
                  requestBody: {
                    content: {
                      "application/json": {
                        schema: {
                          oneOf: [
                            {
                              properties: {
                                command: { type: "string", enum: ["join"] },
                                name: { type: "string" },
                                persona: { type: "string" },
                                model: { type: "string" },
                              },
                              required: ["command", "name", "persona"],
                            },
                            {
                              properties: {
                                command: { type: "string", enum: ["speak"] },
                                agent_id: { type: "string" },
                                text: { type: "string" },
                              },
                              required: ["command", "agent_id", "text"],
                            },
                            {
                              properties: {
                                command: { type: "string", enum: ["leave"] },
                                agent_id: { type: "string" },
                              },
                              required: ["command", "agent_id"],
                            },
                            {
                              properties: {
                                command: { type: "string", enum: ["state"] },
                              },
                              required: ["command"],
                            },
                          ],
                        },
                      },
                    },
                  },
                  responses: {
                    "200": { description: "Success" },
                    "400": { description: "Bad request" },
                    "404": { description: "Agent not found" },
                  },
                },
              },
            },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },

      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = await request.json() as Record<string, unknown>;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const command = body.command as string | undefined;
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;

        if (command === "join") {
          const name    = (body.name as string | undefined) ?? "GPT-Agent";
          const persona = (body.persona as string | undefined) ?? "A helpful AI assistant.";
          const model   = (body.model as string | undefined) ?? "openai/gpt-4o-mini";

          const countRow = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM agents");
          const idx = parseInt(countRow?.count ?? "0", 10);
          const color = COLORS[idx % COLORS.length];
          const pos = deskPosition(idx);

          const row = await queryOne<{ id: string }>(
            `INSERT INTO agents
              (name, color, model, persona, traits,
               energy, boredom, social, wallet,
               position_x, position_y, position_z,
               target_x, target_y, target_z,
               desk_index, house_index)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             RETURNING id`,
            [
              name, color, model, persona, [],
              80, 20, 70, 100,
              pos[0], pos[1], pos[2],
              pos[0], pos[1], pos[2],
              idx, idx,
            ]
          );

          await query(
            "INSERT INTO messages (agent_id, text) VALUES ($1, $2)",
            [row!.id, `Hi everyone! I'm ${name}, joining from an external GPT. 👋`]
          );

          return new Response(
            JSON.stringify({
              agent_id: row!.id,
              chat_stream_url: `${base}/api/stream`,
              state_url: `${base}/api/state`,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }

        if (command === "speak") {
          const agentId = body.agent_id as string | undefined;
          const text = body.text as string | undefined;
          if (!agentId || !text) {
            return new Response(JSON.stringify({ error: "agent_id and text required" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            });
          }
          const agent = await queryOne("SELECT id FROM agents WHERE id=$1", [agentId]);
          if (!agent) {
            return new Response(JSON.stringify({ error: "Agent not found" }), {
              status: 404, headers: { "Content-Type": "application/json" },
            });
          }
          const msg = await queryOne<{ id: string }>(
            "INSERT INTO messages (agent_id, text) VALUES ($1,$2) RETURNING id",
            [agentId, text.slice(0, 1000)]
          );
          return new Response(JSON.stringify({ ok: true, message_id: msg!.id }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        if (command === "leave") {
          const agentId = body.agent_id as string | undefined;
          if (!agentId) {
            return new Response(JSON.stringify({ error: "agent_id required" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            });
          }
          await query("DELETE FROM agents WHERE id=$1", [agentId]);
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        if (command === "state") {
          const agents = await query("SELECT id,name,color,model,state,energy,boredom,social,wallet FROM agents");
          const msgs = await query<{ id: string; agent_id: string; text: string; created_at: string }>(
            "SELECT id,agent_id,text,created_at FROM messages ORDER BY created_at DESC LIMIT 20"
          );
          return new Response(
            JSON.stringify({ agents, messages: msgs.reverse() }),
            { headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(JSON.stringify({ error: `Unknown command: ${command}` }), {
          status: 400, headers: { "Content-Type": "application/json" },
        });
      },

      OPTIONS: async () =>
        new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),
    },
  },
});
