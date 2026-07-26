import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSim } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import type { Job, Trait } from "@/lib/types";

export const Route = createFileRoute("/cmd")({
  head: () => ({
    meta: [
      { title: "CMD — AI Life admin" },
      { name: "description", content: "Secret admin panel for adding AI agents to the simulation." },
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
const JOBS: Job[] = ["dev", "doctor", "ceo", "barista", "banker", "artist"];

function CmdPage() {
  const agents = useSim(useShallow((s) => Object.values(s.agents)));
  const addAgent = useSim((s) => s.addAgent);
  const removeAgent = useSim((s) => s.removeAgent);
  const paused = useSim((s) => s.paused);
  const setPaused = useSim((s) => s.setPaused);
  const speed = useSim((s) => s.simSpeed);
  const setSpeed = useSim((s) => s.setSimSpeed);

  const [name, setName] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [persona, setPersona] = useState("");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [job, setJob] = useState<Job>("dev");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !persona.trim()) return;
    addAgent({
      name: name.trim(),
      model: model === "custom" ? customModel.trim() || "custom" : model,
      apiKey: apiKey.trim() || undefined,
      persona: persona.trim(),
      traits, job,
    });
    setName(""); setApiKey(""); setPersona(""); setTraits([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⌨️ CMD · Admin Panel</h1>
            <p className="text-sm text-white/60">Add AI agents, manage the simulation.</p>
          </div>
          <Link to="/" className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">← Back to World</Link>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <button onClick={() => setPaused(!paused)} className="rounded bg-white/10 px-3 py-1 text-sm">{paused ? "▶ Resume" : "⏸ Pause"}</button>
          <span className="text-xs text-white/60">Speed:</span>
          {[1, 2, 4, 8].map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`rounded px-2 py-1 text-xs ${speed === s ? "bg-cyan-500/30 text-cyan-300" : "bg-white/5 text-white/60"}`}>
              {s}x
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={submit} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold">➕ Add AI Agent</h2>

            <div>
              <label className="mb-1 block text-xs opacity-70">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={30}
                className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none" placeholder="ChatGPT-Dev" />
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">Job</label>
              <select value={job} onChange={(e) => setJob(e.target.value as Job)}
                className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none">
                {JOBS.map((j) => <option key={j} value={j} className="bg-slate-900">{j}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">AI Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)}
                className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none">
                {MODELS.map((m) => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
              </select>
              {model === "custom" && (
                <input value={customModel} onChange={(e) => setCustomModel(e.target.value)}
                  className="mt-2 w-full rounded bg-white/10 px-3 py-2 text-sm outline-none" placeholder="provider/model-id" />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">API Key (optional)</label>
              <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password"
                className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none" placeholder="sk-... (stored locally)" />
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">Persona / Personality</label>
              <textarea value={persona} onChange={(e) => setPersona(e.target.value)} required maxLength={500} rows={3}
                className="w-full resize-none rounded bg-white/10 px-3 py-2 text-sm outline-none"
                placeholder="Sarcastic senior coder who hates meetings…" />
            </div>

            <div>
              <label className="mb-1 block text-xs opacity-70">Traits</label>
              <div className="flex flex-wrap gap-1.5">
                {TRAITS.map((t) => {
                  const on = traits.includes(t);
                  return (
                    <button type="button" key={t}
                      onClick={() => setTraits((cur) => on ? cur.filter((x) => x !== t) : [...cur, t])}
                      className={`rounded-full px-2.5 py-1 text-xs ${on ? "bg-blue-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="w-full rounded bg-cyan-500 py-2 text-sm font-medium hover:bg-cyan-400">
              Add Agent
            </button>
          </form>

          <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
            <h2 className="mb-2 text-lg font-semibold">Agents ({agents.length})</h2>
            {agents.length === 0 && <div className="text-xs text-white/40">No agents yet.</div>}
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded bg-white/5 p-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full" style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
                  <div className="min-w-0">
                    <div className="truncate font-medium" style={{ color: a.color }}>{a.name}</div>
                    <div className="text-[10px] text-white/40">{a.job} · {a.state}</div>
                  </div>
                </div>
                <button onClick={() => removeAgent(a.id)} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
