import { useSim } from "@/lib/store";

export default function AgentInspector() {
  const id = useSim((s) => s.selectedAgentId);
  const agent = useSim((s) => (id ? s.agents[id] : null));
  const close = useSim((s) => s.selectAgent);
  const remove = useSim((s) => s.removeAgent);

  if (!agent) return null;

  const Bar = ({ label, val, color }: { label: string; val: number; color: string }) => (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px]">
        <span>{label}</span>
        <span>{Math.round(val)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-white/10">
        <div className="h-full" style={{ width: `${val}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="fixed left-4 top-4 z-40 w-72 rounded-lg bg-black/85 p-4 text-white shadow-xl backdrop-blur">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-lg font-bold" style={{ color: agent.color }}>
            {agent.name}
          </div>
          <div className="text-[11px] opacity-60">{agent.model}</div>
          <div className="mt-1 text-[10px] opacity-70">State: {agent.state}</div>
        </div>
        <button onClick={() => close(null)} className="text-white/60 hover:text-white">
          ✕
        </button>
      </div>
      <div className="space-y-2">
        <Bar label="Energy" val={agent.energy} color="#22c55e" />
        <Bar label="Boredom" val={agent.boredom} color="#f59e0b" />
        <Bar label="Social" val={agent.social} color="#3b82f6" />
        <div className="text-[11px]">💰 Wallet: ${Math.round(agent.wallet)}</div>
      </div>
      <div className="mt-3 text-[11px]">
        <div className="opacity-60">Persona:</div>
        <div className="opacity-90">{agent.persona}</div>
      </div>
      {agent.traits.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.traits.map((t) => (
            <span key={t} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
              {t}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          remove(agent.id);
          close(null);
        }}
        className="mt-3 w-full rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30"
      >
        Remove agent
      </button>
    </div>
  );
}
