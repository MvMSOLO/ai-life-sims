import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSim } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { createAgent, deleteAgent } from "@/lib/agents.functions";
import type { Trait } from "@/lib/types";

export const Route = createFileRoute("/cmd")({
  head: () => ({
    meta: [
      { title: "CMD — AI Life admin" },
      { name: "description", content: "Secret admin panel for adding AI agents." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CmdPage,
});

const MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-flash-1.5",
  "openai/gpt-4o-mini",
  "openai/gpt-4.1-nano",
  "openrouter/meta-llama/llama-3.1-8b-instruct:free",
  "openrouter/mistralai/mistral-7b-instruct:free",
  "anthropic/claude-3.5-haiku",
  "custom",
];

const TRAITS: Trait[] = ["impatient", "friendly", "quiet", "energetic", "sarcastic"];

function CmdPage() {
  const agents = useSim(useShallow((s) => Object.values(s.agents)));
  const simSpeed = useSim((s) => s.simSpeed);
  const setSimSpeed = useSim((s) => s.setSimSpeed);
  const paused = useSim((s) => s.paused);
  const setPaused = useSim((s) => s.setPaused);

  const [name, setName] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [persona, setPersona] = useState("");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !persona.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createAgent({
        data: {
          name: name.trim(),
          model: model === "custom" ? customModel.trim() || "custom" : model,
          apiKey: apiKey.trim() || undefined,
          persona: persona.trim(),
          traits,
        },
      });
      setName("");
      setApiKey("");
      setPersona("");
      setTraits([]);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteAgent({ data: { id } });
    } catch (err) {
      console.error("Failed to remove agent:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⌨️ CMD · Admin Panel</h1>
            <p className="text-sm text-white/60">
              Add new AI agents, manage the simulation.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            ← Back to World
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <h2 className="text-lg font-semibold">➕ Add AI Agent</h2>

            <div>
              <label className="mb-1 block text-xs opacity-70">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={30}
                className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none"
                placeholder="ChatGPT-Dev"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">AI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900">
                    {m}
                  </option>
                ))}
              </select>
              {model === "custom" && (
                <input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="mt-2 w-full rounded bg-white/10 px-3 py-2 text-sm outline-none"
                  placeholder="provider/model-id"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">
                API Key (optional — leave empty to use OPENROUTER_API_KEY env)
              </label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none"
                placeholder="sk-or-... or leave empty"
              />
              <p className="mt-1 text-[11px] opacity-50">
                Set OPENROUTER_API_KEY in Replit Secrets for shared fallback.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">
                Persona / Personality
              </label>
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                required
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded bg-white/10 px-3 py-2 text-sm outline-none"
                placeholder="Sarcastic senior coder who hates meetings…"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">Traits</label>
              <div className="flex flex-wrap gap-1.5">
                {TRAITS.map((t) => {
                  const on = traits.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() =>
                        setTraits((cur) =>
                          on ? cur.filter((x) => x !== t) : [...cur, t]
                        )
                      }
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        on
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded bg-red-500/20 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-500 py-2 text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Spawning…" : "Spawn agent into world"}
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold">🎛️ World Controls</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs opacity-70">
                    Simulation speed: {simSpeed.toFixed(1)}x (client display only)
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() => setPaused(!paused)}
                  className={`w-full rounded py-1.5 text-sm ${
                    paused ? "bg-green-500" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {paused ? "▶ Resume" : "⏸ Pause (display only)"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold">
                👥 Active Agents ({agents.length})
              </h2>
              <div className="space-y-2 text-sm">
                {agents.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded bg-white/5 p-2"
                  >
                    <div>
                      <div className="font-semibold" style={{ color: a.color }}>
                        {a.name}
                      </div>
                      <div className="text-[11px] opacity-60">
                        {a.model} · {a.state}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(a.id)}
                      className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {agents.length === 0 && (
                  <div className="text-xs opacity-50">No agents yet. Add one above!</div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-200/80">
              <strong>Public API:</strong> POST <code>/api/public/agent</code>
              <br />
              Commands: <code>join</code>, <code>speak</code>, <code>leave</code>, <code>state</code>
              <br />
              SSE stream: <code>GET /api/stream</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
