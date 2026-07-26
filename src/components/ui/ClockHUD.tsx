import { useSim, formatTime, getDayIndex, getHour, isNight } from "@/lib/store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ClockHUD() {
  const worldMin = useSim((s) => s.worldMinutes);
  const speed = useSim((s) => s.simSpeed);
  const setSpeed = useSim((s) => s.setSimSpeed);
  const paused = useSim((s) => s.paused);
  const setPaused = useSim((s) => s.setPaused);

  const night = isNight(worldMin);
  const hour = getHour(worldMin);
  const day = DAYS[getDayIndex(worldMin) % 7];
  const accent = night ? "#8b5cf6" : "#00f5ff";

  return (
    <div
      className="fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl px-3 py-1.5 backdrop-blur-md"
      style={{
        background: "rgba(5,8,20,0.85)",
        border: `1px solid ${accent}44`,
        boxShadow: `0 0 18px ${accent}22`,
      }}
    >
      <span className="text-base" title={night ? "Night" : "Day"}>
        {night ? "🌙" : hour >= 6 && hour < 12 ? "🌅" : hour >= 18 ? "🌆" : "☀️"}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-sm font-bold tabular-nums"
          style={{ color: accent, textShadow: `0 0 8px ${accent}88` }}
        >
          {formatTime(worldMin)}
        </span>
        <span className="text-[9px] uppercase tracking-widest text-white/40">{day}</span>
      </div>
      <div className="mx-1 h-4 w-px bg-white/10" />
      <button
        onClick={() => setPaused(!paused)}
        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/70 hover:bg-white/10"
      >
        {paused ? "▶" : "⏸"}
      </button>
      {[1, 2, 4, 8].map((s) => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className="rounded px-1.5 py-0.5 text-[10px] font-mono tabular-nums transition-colors"
          style={{
            background: speed === s ? `${accent}22` : "transparent",
            color: speed === s ? accent : "rgba(255,255,255,0.45)",
          }}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
