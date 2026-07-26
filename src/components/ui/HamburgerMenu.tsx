import { useEffect, useRef, useState } from "react";
import { useSim } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";

const STATE_EMOJI: Record<string, string> = {
  WORKING: "💻", IDLE: "😐", COMMUTING_HOME: "🚶", COMMUTING_WORK: "🚶",
  IN_TAXI_HOME: "🚕", IN_TAXI_WORK: "🚕", RELAXING: "🛋️", SLEEPING: "😴", CHATTING: "💬",
};
const STATE_LABEL: Record<string, string> = {
  WORKING: "Working", IDLE: "Idle", COMMUTING_HOME: "Commuting", COMMUTING_WORK: "Commuting",
  IN_TAXI_HOME: "In Taxi", IN_TAXI_WORK: "In Taxi", RELAXING: "Relaxing",
  SLEEPING: "Sleeping", CHATTING: "Chatting",
};

function StatBar({ val, color, glow }: { val: number; color: string; glow: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.max(0, Math.min(100, val))}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 6px ${glow}`,
        }}
      />
    </div>
  );
}

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"none" | "chat" | "agents" | "cmd">("none");
  const [cmdInput, setCmdInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const agents = useSim(useShallow((s) => Object.values(s.agents)));
  const messages = useSim(useShallow((s) => s.messages));
  const select = useSim((s) => s.selectAgent);

  // Auto-navigate on "cmd"
  useEffect(() => {
    if (cmdInput.trim().toLowerCase() === "cmd") {
      setCmdInput("");
      setOpen(false);
      navigate({ to: "/cmd" });
    }
  }, [cmdInput, navigate]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const activeAgents = agents.filter((a) => a.state !== "SLEEPING").length;

  return (
    <>
      {/* ── Hamburger button ── */}
      <button
        onClick={() => { setOpen((v) => !v); if (open) setPanel("none"); }}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg backdrop-blur-md"
        style={{
          background: "rgba(0,0,0,0.75)",
          border: "1px solid rgba(0,245,255,0.35)",
          boxShadow: open ? "0 0 16px #00f5ff55" : "0 0 8px #00f5ff22",
          transition: "box-shadow 0.3s",
        }}
        aria-label="Menu"
      >
        <div className="flex flex-col gap-[5px]">
          <span
            className="block h-[1.5px] rounded-full bg-cyan-400 transition-all duration-300"
            style={{
              width: open ? 14 : 18,
              transform: open ? "rotate(45deg) translate(4.5px, 4.5px)" : "",
              boxShadow: "0 0 4px #00f5ff",
            }}
          />
          <span
            className="block h-[1.5px] rounded-full bg-cyan-400 transition-all duration-300"
            style={{
              width: open ? 0 : 18,
              opacity: open ? 0 : 1,
              boxShadow: "0 0 4px #00f5ff",
            }}
          />
          <span
            className="block h-[1.5px] rounded-full bg-cyan-400 transition-all duration-300"
            style={{
              width: open ? 14 : 18,
              transform: open ? "rotate(-45deg) translate(4.5px, -4.5px)" : "",
              boxShadow: "0 0 4px #00f5ff",
            }}
          />
        </div>
      </button>

      {/* ── Dropdown nav ── */}
      {open && (
        <div
          className="fixed right-4 top-16 z-50 w-52 overflow-hidden rounded-xl"
          style={{
            background: "rgba(5,8,20,0.92)",
            border: "1px solid rgba(0,245,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,245,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "#00ff88",
                boxShadow: "0 0 6px #00ff88",
                animation: "pulse 2s infinite",
              }}
            />
            <span className="text-[10px] font-medium tracking-widest" style={{ color: "#00f5ff88" }}>
              SYSTEM ONLINE
            </span>
          </div>

          {/* Nav items */}
          {[
            { id: "chat", icon: "💬", label: "Neural Chat", badge: messages.length, color: "#00f5ff" },
            { id: "agents", icon: "👥", label: "Agents", badge: agents.length, color: "#ff2d78" },
            { id: "cmd", icon: "⌨️", label: "Command Input", badge: null, color: "#8b5cf6" },
          ].map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150"
              style={{
                background: panel === item.id ? `${item.color}14` : "transparent",
                borderLeft: panel === item.id ? `2px solid ${item.color}` : "2px solid transparent",
              }}
              onMouseEnter={(e) => { if (panel !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = panel === item.id ? `${item.color}14` : "transparent"; }}
              onClick={() => setPanel(panel === item.id ? "none" : item.id as typeof panel)}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="flex-1 text-xs text-white/80">{item.label}</span>
              {item.badge !== null && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ background: `${item.color}22`, color: item.color }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          {/* Status footer */}
          <div
            className="px-4 py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex justify-between text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              <span>{activeAgents} active</span>
              <span>{agents.length - activeAgents} sleeping</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CMD panel ── */}
      {panel === "cmd" && (
        <div
          className="fixed right-4 z-40 w-68 overflow-hidden rounded-xl"
          style={{
            top: open ? "15rem" : "5rem",
            width: 268,
            background: "rgba(5,8,20,0.94)",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(139,92,246,0.1)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] tracking-widest" style={{ color: "#8b5cf6" }}>⌨ COMMAND INPUT</div>
          </div>
          <div className="p-3">
            <div className="mb-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Type a command to interact with the world
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <span className="text-[11px]" style={{ color: "#8b5cf6" }}>›</span>
              <input
                autoFocus
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                placeholder="try: cmd"
              />
            </div>
            <div className="mt-2 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Hint: type <span className="rounded bg-white/10 px-1 font-mono text-white/50">cmd</span> to open admin panel
            </div>
          </div>
        </div>
      )}

      {/* ── Chat panel ── */}
      {panel === "chat" && (
        <div
          className="fixed right-4 z-40 flex flex-col overflow-hidden rounded-xl"
          style={{
            top: open ? "15rem" : "5rem",
            width: 300,
            height: "min(62vh, 480px)",
            background: "rgba(5,8,20,0.94)",
            border: "1px solid rgba(0,245,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,245,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
            <span className="text-xs font-semibold text-white">World Chat</span>
            <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {messages.length} messages
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                No messages yet — add an agent to start!
              </div>
            )}
            {messages.slice(-50).map((m) => {
              const a = agents.find((x) => x.id === m.agentId);
              return (
                <div key={m.id} className="group flex gap-2.5">
                  {/* Avatar */}
                  <div
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{
                      background: `${a?.color ?? "#888"}22`,
                      border: `1.5px solid ${a?.color ?? "#888"}`,
                      color: a?.color ?? "#888",
                      boxShadow: `0 0 6px ${a?.color ?? "#888"}44`,
                    }}
                  >
                    {(a?.name ?? "?")[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-semibold" style={{ color: a?.color ?? "#aaa" }}>
                        {a?.name ?? "Unknown"}
                      </span>
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>
                      {m.text}
                    </div>
                    {m.reactions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.reactions.map((r, i) => (
                          <span
                            key={i}
                            className="rounded-full px-1.5 py-0.5 text-[9px]"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ── Agents panel ── */}
      {panel === "agents" && (
        <div
          className="fixed right-4 z-40 flex flex-col overflow-hidden rounded-xl"
          style={{
            top: open ? "15rem" : "5rem",
            width: 300,
            height: "min(62vh, 500px)",
            background: "rgba(5,8,20,0.94)",
            border: "1px solid rgba(255,45,120,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(255,45,120,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-xs font-semibold text-white">Agents</span>
            <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {agents.length} total
            </span>
          </div>

          {/* Agent list */}
          <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
            {agents.length === 0 && (
              <div className="flex h-full items-center justify-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                No agents — go to /cmd to add one
              </div>
            )}
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => { select(a.id); setPanel("none"); setOpen(false); }}
                className="w-full rounded-lg p-2.5 text-left transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${a.color}12`; e.currentTarget.style.borderColor = `${a.color}44`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Color dot */}
                  <div
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate" style={{ color: a.color }}>
                        {a.name}
                      </span>
                      <span className="ml-2 text-[9px] whitespace-nowrap" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {STATE_EMOJI[a.state]} {STATE_LABEL[a.state] ?? a.state}
                      </span>
                    </div>
                    {/* Mini stat bars */}
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 text-[8px]">⚡</span>
                        <div className="flex-1"><StatBar val={a.energy} color="#22c55e" glow="#22c55e" /></div>
                        <span className="w-5 text-right text-[8px]" style={{ color: "rgba(255,255,255,0.35)" }}>{Math.round(a.energy)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 text-[8px]">👥</span>
                        <div className="flex-1"><StatBar val={a.social} color="#3b82f6" glow="#3b82f6" /></div>
                        <span className="w-5 text-right text-[8px]" style={{ color: "rgba(255,255,255,0.35)" }}>{Math.round(a.social)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }`}</style>
    </>
  );
}
