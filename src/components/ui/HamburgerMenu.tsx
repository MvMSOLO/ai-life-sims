import { useEffect, useState } from "react";
import { useSim } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"none" | "chat" | "agents" | "cmd">("none");
  const [cmdInput, setCmdInput] = useState("");
  const navigate = useNavigate();

  const agents = useSim(useShallow((s) => Object.values(s.agents)));
  const messages = useSim(useShallow((s) => s.messages));
  const select = useSim((s) => s.selectAgent);

  useEffect(() => {
    if (cmdInput.trim().toLowerCase() === "cmd") {
      setCmdInput("");
      setOpen(false);
      navigate({ to: "/cmd" });
    }
  }, [cmdInput, navigate]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-black/70 text-white shadow-lg backdrop-blur hover:bg-black/90"
        aria-label="Menu"
      >
        <div className="flex flex-col gap-1">
          <span className="h-0.5 w-5 bg-white" />
          <span className="h-0.5 w-5 bg-white" />
          <span className="h-0.5 w-5 bg-white" />
        </div>
      </button>

      {open && (
        <div className="fixed right-4 top-16 z-50 w-56 rounded-lg bg-black/85 p-2 text-white shadow-xl backdrop-blur">
          <button
            className="w-full rounded px-3 py-2 text-left text-sm hover:bg-white/10"
            onClick={() => setPanel(panel === "chat" ? "none" : "chat")}
          >
            💬 Chat ({messages.length})
          </button>
          <button
            className="w-full rounded px-3 py-2 text-left text-sm hover:bg-white/10"
            onClick={() => setPanel(panel === "agents" ? "none" : "agents")}
          >
            👥 Agents ({agents.length})
          </button>
          <button
            className="w-full rounded px-3 py-2 text-left text-sm hover:bg-white/10"
            onClick={() => setPanel(panel === "cmd" ? "none" : "cmd")}
          >
            ⌨️ Input
          </button>
        </div>
      )}

      {/* CMD input */}
      {panel === "cmd" && (
        <div className="fixed right-4 top-64 z-50 w-64 rounded-lg bg-black/85 p-3 text-white shadow-xl backdrop-blur">
          <div className="mb-1 text-xs opacity-70">Type a command…</div>
          <input
            autoFocus
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            className="w-full rounded bg-white/10 px-2 py-1.5 text-sm outline-none placeholder:text-white/40"
            placeholder="try: cmd"
          />
        </div>
      )}

      {/* Chat panel */}
      {panel === "chat" && (
        <div className="fixed right-4 top-64 z-40 flex h-[60vh] w-80 flex-col rounded-lg bg-black/85 text-white shadow-xl backdrop-blur">
          <div className="border-b border-white/10 px-3 py-2 text-sm font-semibold">
            Global Chat
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-xs">
            {messages.slice(-40).map((m) => {
              const a = agents.find((x) => x.id === m.agentId);
              return (
                <div key={m.id}>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-semibold"
                      style={{ color: a?.color ?? "#fff" }}
                    >
                      {a?.name ?? "Unknown"}
                    </span>
                    <span className="text-[10px] opacity-50">
                      {new Date(m.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="opacity-90">{m.text}</div>
                  {m.reactions.length > 0 && (
                    <div className="mt-0.5 flex gap-1">
                      {m.reactions.map((r, i) => (
                        <span
                          key={i}
                          className="rounded bg-white/10 px-1 text-[10px]"
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="opacity-50">No messages yet…</div>
            )}
          </div>
        </div>
      )}

      {/* Agents panel */}
      {panel === "agents" && (
        <div className="fixed right-4 top-64 z-40 flex h-[60vh] w-80 flex-col rounded-lg bg-black/85 text-white shadow-xl backdrop-blur">
          <div className="border-b border-white/10 px-3 py-2 text-sm font-semibold">
            Agents
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-2 text-xs">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => select(a.id)}
                className="w-full rounded bg-white/5 p-2 text-left hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: a.color }}>
                    {a.name}
                  </span>
                  <span className="text-[10px] opacity-60">{a.state}</span>
                </div>
                <div className="mt-1 flex gap-2 text-[10px] opacity-80">
                  <span>⚡{Math.round(a.energy)}</span>
                  <span>😐{Math.round(a.boredom)}</span>
                  <span>💬{Math.round(a.social)}</span>
                  <span>💰${Math.round(a.wallet)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
