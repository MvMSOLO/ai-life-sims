import { useSim } from "@/lib/store";

const STATE_EMOJI: Record<string, string> = {
  WORKING: "💻", IDLE: "😐", COMMUTING_HOME: "🚶", COMMUTING_WORK: "🚶",
  IN_TAXI_HOME: "🚕", IN_TAXI_WORK: "🚕", RELAXING: "🛋️", SLEEPING: "😴", CHATTING: "💬",
};
const STATE_LABEL: Record<string, string> = {
  WORKING: "Working at desk", IDLE: "Idle", COMMUTING_HOME: "Commuting home",
  COMMUTING_WORK: "Commuting to work", IN_TAXI_HOME: "In taxi → home",
  IN_TAXI_WORK: "In taxi → office", RELAXING: "Relaxing at home",
  SLEEPING: "Sleeping", CHATTING: "Chatting with colleague",
};
const TRAIT_COLORS: Record<string, string> = {
  impatient: "#ef4444", friendly: "#22c55e", quiet: "#6b7280",
  energetic: "#f59e0b", sarcastic: "#8b5cf6",
};

function GlowBar({
  icon, label, val, color, max = 100,
}: {
  icon: string; label: string; val: number; color: string; max?: number;
}) {
  const pct = Math.max(0, Math.min(100, (val / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
          {max === 100 ? `${Math.round(val)}%` : `$${Math.round(val)}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 8px ${color}88`,
          }}
        />
      </div>
    </div>
  );
}

export default function AgentInspector() {
  const id = useSim((s) => s.selectedAgentId);
  const agent = useSim((s) => (id ? s.agents[id] : null));
  const close = useSim((s) => s.selectAgent);
  const remove = useSim((s) => s.removeAgent);

  if (!agent) return null;

  const c = agent.color;
  const affinityEntries = Object.entries(agent.affinity ?? {}).slice(0, 3);

  return (
    <div
      className="fixed left-4 top-4 z-40 w-72 overflow-hidden rounded-xl"
      style={{
        background: "rgba(5,8,20,0.94)",
        border: `1px solid ${c}33`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 24px ${c}18`,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="relative px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${c}1a 0%, rgba(5,8,20,0) 100%)`,
          borderBottom: `1px solid ${c}22`,
        }}
      >
        {/* Neon top edge */}
        <div className="absolute inset-x-0 top-0 h-[1.5px]" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />

        <div className="flex items-start justify-between gap-3">
          {/* Avatar circle */}
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold"
            style={{
              background: `${c}22`,
              border: `2px solid ${c}`,
              color: c,
              boxShadow: `0 0 14px ${c}44, inset 0 0 12px ${c}11`,
            }}
          >
            {STATE_EMOJI[agent.state] ?? "🤖"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-base font-bold leading-tight truncate" style={{ color: c, textShadow: `0 0 10px ${c}88` }}>
              {agent.name}
            </div>
            <div className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {agent.model}
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px]"
              style={{ background: `${c}18`, border: `1px solid ${c}33`, color: c }}
            >
              {STATE_LABEL[agent.state] ?? agent.state}
            </div>
          </div>

          <button
            onClick={() => close(null)}
            className="flex-shrink-0 rounded-lg p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Biometrics ── */}
      <div className="space-y-2.5 px-4 py-3">
        <div className="text-[9px] font-medium tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
          BIOMETRICS
        </div>
        <GlowBar icon="⚡" label="Energy" val={agent.energy} color="#22c55e" />
        <GlowBar icon="😑" label="Boredom" val={agent.boredom} color="#f59e0b" />
        <GlowBar icon="👥" label="Social" val={agent.social} color="#3b82f6" />
        <GlowBar icon="💰" label="Wallet" val={agent.wallet} color="#8b5cf6" max={500} />
      </div>

      {/* Divider */}
      <div className="mx-4" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* ── Persona ── */}
      <div className="px-4 py-3">
        <div className="mb-1.5 text-[9px] font-medium tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
          PERSONA
        </div>
        <div className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          {agent.persona || <span style={{ color: "rgba(255,255,255,0.2)" }}>No persona set</span>}
        </div>
      </div>

      {/* ── Traits ── */}
      {agent.traits.length > 0 && (
        <>
          <div className="mx-4" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <div className="px-4 py-3">
            <div className="mb-1.5 text-[9px] font-medium tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              TRAITS
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.traits.map((t) => {
                const tc = TRAIT_COLORS[t] ?? c;
                return (
                  <span
                    key={t}
                    className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                    style={{
                      background: `${tc}18`,
                      border: `1px solid ${tc}44`,
                      color: tc,
                    }}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Affinity ── */}
      {affinityEntries.length > 0 && (
        <>
          <div className="mx-4" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <div className="px-4 py-3">
            <div className="mb-1.5 text-[9px] font-medium tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              RELATIONSHIPS
            </div>
            <div className="space-y-1.5">
              {affinityEntries.map(([otherId, score]) => (
                <div key={otherId} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: score > 0 ? "#22c55e" : "#ef4444" }} />
                  <div className="flex-1 text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {otherId.slice(0, 8)}…
                  </div>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: score > 0 ? "#22c55e" : "#ef4444" }}
                  >
                    {score > 0 ? "+" : ""}{score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Remove button ── */}
      <div className="px-4 pb-4">
        <button
          onClick={() => { remove(agent.id); close(null); }}
          className="w-full rounded-lg py-2 text-xs font-medium transition-all duration-150"
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.22)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
        >
          Remove Agent
        </button>
      </div>
    </div>
  );
}
