import { useEffect, useRef, useState } from "react";
import "./_group.css";

const GRID_COLOR = "#7c3aed";
const PINK = "#ec4899";
const CYAN = "#06b6d4";
const PURPLE = "#8b5cf6";

const AGENTS = [
  { id: "a1", name: "VEGA", color: "#ec4899", state: "WORKING", x: 200, y: 230, anim: "sit" },
  { id: "a2", name: "ORION", color: "#06b6d4", state: "RUNNING", x: 420, y: 270, anim: "run" },
  { id: "a3", name: "LYRA", color: "#f472b6", state: "JUMPING", x: 310, y: 240, anim: "jump" },
  { id: "a4", name: "ZETA", color: "#a78bfa", state: "IDLE", x: 550, y: 250, anim: "idle" },
  { id: "a5", name: "NOVA", color: "#34d399", state: "SLEEPING", x: 140, y: 260, anim: "sleep" },
];

const BUILDINGS_SW = [
  { x: 30, y: 80, w: 55, h: 170, color: "#1a0533", stripe: PINK },
  { x: 95, y: 110, w: 40, h: 140, color: "#150829", stripe: CYAN },
  { x: 145, y: 60, w: 65, h: 190, color: "#1a0533", stripe: PURPLE },
  { x: 540, y: 90, w: 45, h: 160, color: "#150829", stripe: PINK },
  { x: 595, y: 70, w: 60, h: 180, color: "#1a0533", stripe: CYAN },
  { x: 665, y: 105, w: 50, h: 145, color: "#150829", stripe: PURPLE },
  { x: 725, y: 80, w: 55, h: 170, color: "#1a0533", stripe: PINK },
];

function SynthAgent({ agent, tick }: { agent: typeof AGENTS[0]; tick: number }) {
  let bodyY = 0;
  let armAngle = 0;
  let legAngle = 0;
  let squish = 1;
  let stretchY = 1;

  const t = tick * 0.1;
  if (agent.anim === "run") {
    armAngle = Math.sin(t * 1.5) * 40;
    legAngle = Math.sin(t * 1.5) * 35;
    bodyY = Math.abs(Math.sin(t * 1.5)) * -4;
  }
  if (agent.anim === "jump") {
    const phase = (tick % 80) / 80;
    if (phase < 0.5) {
      bodyY = -Math.sin(phase * Math.PI) * 40;
      stretchY = 1 - Math.abs(Math.sin(phase * Math.PI)) * 0.2;
    } else {
      bodyY = -Math.sin(phase * Math.PI) * 40;
      squish = 1 + Math.sin(phase * Math.PI) * 0.15;
    }
    armAngle = -bodyY * 0.5;
    legAngle = bodyY > -5 ? 30 : -20;
  }
  if (agent.anim === "sit") {
    armAngle = -30;
    legAngle = 60;
    bodyY = 6;
  }
  if (agent.anim === "idle") {
    bodyY = Math.sin(tick * 0.05) * 2;
    armAngle = Math.sin(tick * 0.06) * 8;
  }
  if (agent.anim === "sleep") {
    armAngle = 20;
    legAngle = 15;
    bodyY = 8;
  }

  const color = agent.color;
  const shadowAlpha = 0.4;

  return (
    <g transform={`translate(${agent.x}, ${agent.y + bodyY})`}>
      {/* Glow shadow on ground */}
      <ellipse cx={0} cy={40 - bodyY} rx={20} ry={5}
        fill={color} opacity={0.15 - Math.abs(bodyY) * 0.003}
        filter="url(#agentGlow)"
      />

      {/* Left leg */}
      <rect
        x={-6} y={18} width={7} height={18} rx={3}
        fill={color} opacity={0.85}
        transform={`rotate(${legAngle * 0.5}, -2, 18)`}
      />
      {/* Right leg */}
      <rect
        x={1} y={18} width={7} height={18} rx={3}
        fill={color} opacity={0.95}
        transform={`rotate(${-legAngle * 0.5}, 4, 18)`}
      />

      {/* Body */}
      <rect
        x={-10} y={4} width={20} height={16} rx={5}
        fill={color}
        transform={`scale(${squish}, ${stretchY})`}
        style={{ transformOrigin: "0 12px" }}
      />
      {/* Body glow overlay */}
      <rect
        x={-10} y={4} width={20} height={8} rx={5}
        fill="white" opacity={0.2}
        transform={`scale(${squish}, ${stretchY})`}
        style={{ transformOrigin: "0 12px" }}
      />

      {/* Left arm */}
      <rect
        x={-17} y={6} width={8} height={12} rx={4}
        fill={color} opacity={0.8}
        transform={`rotate(${armAngle}, -10, 6)`}
      />
      {/* Right arm */}
      <rect
        x={10} y={6} width={8} height={12} rx={4}
        fill={color} opacity={0.9}
        transform={`rotate(${-armAngle * 0.9}, 10, 6)`}
      />

      {/* Head */}
      <rect
        x={-8} y={-14} width={16} height={16} rx={6}
        fill={color}
        transform={`scale(${squish * 0.95}, 1)`}
      />
      {/* Face visor */}
      <rect x={-6} y={-11} width={12} height={7} rx={3} fill="#000000aa" />
      {/* Eyes */}
      <rect x={-5} y={-9} width={4} height={3} rx={1} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      <rect x={1} y={-9} width={4} height={3} rx={1} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />

      {/* State badge */}
      <circle cx={10} cy={-14} r={6} fill="#1a0533" stroke={color} strokeWidth={1} />
      <text x={10} y={-11} textAnchor="middle" fontSize={6}>
        {agent.anim === "run" ? "🏃" : agent.anim === "jump" ? "🦘" : agent.anim === "sit" ? "💺" : agent.anim === "sleep" ? "💤" : "😐"}
      </text>

      {/* Name tag */}
      <g transform="translate(0, -26)">
        <rect x={-16} y={-7} width={32} height={10} rx={3}
          fill="#000000cc" stroke={color} strokeWidth={0.5} strokeOpacity={0.5} />
        <text x={0} y={0} textAnchor="middle" fontSize={7}
          fill={color} fontFamily="'Courier New', monospace"
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
          {agent.name}
        </text>
      </g>

      {/* Running dust particles */}
      {agent.anim === "run" && [0, 1, 2].map(i => (
        <circle key={i}
          cx={-15 - i * 8}
          cy={38 + Math.sin(tick * 0.2 + i) * 3}
          r={2 - i * 0.4}
          fill={color}
          opacity={(0.6 - i * 0.15) * (Math.sin(tick * 0.3 + i) > 0 ? 1 : 0)}
        />
      ))}

      {/* Jump sparkles */}
      {agent.anim === "jump" && bodyY < -15 && [0,1,2,3].map(i => (
        <circle key={i}
          cx={Math.cos(i * Math.PI / 2) * 18}
          cy={Math.sin(i * Math.PI / 2) * 12 - 5}
          r={2}
          fill={color}
          opacity={0.7}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      ))}
    </g>
  );
}

export function SynthwaveWorld() {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    let t = 0;
    const loop = () => {
      t++;
      setTick(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const runX = ((tick * 1.5) % 700) + 50;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(180deg, #0d001a 0%, #1a0533 40%, #0d001a 100%)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Animated stars */}
      {Array.from({ length: 100 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 97.3 + 7) % 100}%`,
          top: `${(i * 41.7) % 45}%`,
          width: i % 8 === 0 ? 3 : 1,
          height: i % 8 === 0 ? 3 : 1,
          borderRadius: "50%",
          background: i % 3 === 0 ? PINK : i % 3 === 1 ? CYAN : "white",
          opacity: 0.2 + (i % 5) * 0.12,
          animation: `twinkle ${1.5 + (i % 5) * 0.5}s ${(i % 3) * 0.3}s ease-in-out infinite alternate`,
          boxShadow: i % 8 === 0 ? `0 0 4px ${i % 2 ? PINK : CYAN}` : "none",
        }} />
      ))}

      {/* Gradient horizon glow */}
      <div style={{
        position: "absolute",
        top: "35%",
        left: 0,
        right: 0,
        height: "8%",
        background: `linear-gradient(180deg, transparent, ${PINK}33, ${CYAN}22, transparent)`,
        filter: "blur(30px)",
      }} />

      {/* Sun / retrowave circle */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "30%",
        transform: "translate(-50%, -50%)",
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: `linear-gradient(180deg, ${PINK} 0%, #7c3aed 50%, transparent 100%)`,
        boxShadow: `0 0 40px ${PINK}88, 0 0 100px ${PINK}44`,
        overflow: "hidden",
      }}>
        {/* Horizontal scan lines on sun */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${50 + i * 7}%`,
            height: 3,
            background: "#1a0533",
          }} />
        ))}
      </div>

      <svg
        viewBox="0 0 800 500"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="agentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1a0533" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Buildings */}
        {BUILDINGS_SW.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color} />
            {/* Neon outline */}
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none"
              stroke={b.stripe} strokeWidth={1} strokeOpacity={0.6}
              filter="url(#neonGlow)" />
            {/* Window pattern */}
            {Array.from({ length: Math.floor(b.h / 22) }).map((_, row) =>
              Array.from({ length: Math.floor(b.w / 14) }).map((_, col) => (
                <rect key={`${row}-${col}`}
                  x={b.x + 4 + col * 14} y={b.y + 8 + row * 22}
                  width={8} height={12} rx={1}
                  fill={b.stripe}
                  opacity={Math.sin(row * 1.7 + col * 2.3 + tick * 0.03) > 0.2 ? 0.7 : 0.1}
                />
              ))
            )}
            {/* Neon top */}
            <line x1={b.x} y1={b.y} x2={b.x + b.w} y2={b.y}
              stroke={b.stripe} strokeWidth={2}
              style={{ filter: `drop-shadow(0 0 4px ${b.stripe})` }} />
            {/* Neon side stripe */}
            <line x1={b.x + b.w - 4} y1={b.y} x2={b.x + b.w - 4} y2={b.y + b.h}
              stroke={b.stripe} strokeWidth={1} strokeOpacity={0.4} />
          </g>
        ))}

        {/* Perspective grid floor */}
        <g opacity={0.8}>
          {/* Horizontal lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = 310 + i * (i * 2.5 + 10);
            if (y > 500) return null;
            return (
              <line key={`h${i}`} x1={0} y1={y} x2={800} y2={y}
                stroke={GRID_COLOR} strokeWidth={0.8}
                style={{ filter: `drop-shadow(0 0 2px ${GRID_COLOR})` }} />
            );
          })}
          {/* Vertical lines (perspective) */}
          {Array.from({ length: 20 }).map((_, i) => {
            const x = (i / 19) * 800;
            return (
              <line key={`v${i}`} x1={400} y1={310} x2={x} y2={500}
                stroke={GRID_COLOR} strokeWidth={0.8}
                style={{ filter: `drop-shadow(0 0 2px ${GRID_COLOR})` }} />
            );
          })}
        </g>

        {/* Ground plane */}
        <rect x={0} y={310} width={800} height={3} fill={PINK}
          style={{ filter: `drop-shadow(0 0 8px ${PINK})` }} />

        {/* Moving taxi */}
        <g transform={`translate(${(tick * 1.2 % 900) - 100}, 285)`}>
          <rect x={-25} y={-12} width={50} height={18} rx={4}
            fill="#facc15" style={{ filter: "drop-shadow(0 0 6px #facc15)" }} />
          <rect x={-15} y={-20} width={30} height={10} rx={3} fill="#fef9c3" opacity={0.8} />
          <rect x={-13} y={-18} width={11} height={7} rx={1} fill={CYAN} opacity={0.9} />
          <rect x={2} y={-18} width={11} height={7} rx={1} fill={CYAN} opacity={0.9} />
          <circle cx={-12} cy={6} r={4} fill="#1a0533" stroke={PINK} strokeWidth={1} />
          <circle cx={12} cy={6} r={4} fill="#1a0533" stroke={PINK} strokeWidth={1} />
          {/* Speed lines */}
          {[0,1,2].map(i => (
            <line key={i} x1={-30 - i * 15} y1={-4 + i * 3} x2={-26 - i * 15} y2={-4 + i * 3}
              stroke={PINK} strokeWidth={1} opacity={0.5 - i * 0.1} />
          ))}
        </g>

        {/* Static agents */}
        {AGENTS.filter(a => a.anim !== "run").map(agent => (
          <SynthAgent key={agent.id} agent={agent} tick={tick} />
        ))}

        {/* Running agent */}
        <SynthAgent
          agent={{ ...AGENTS[1], x: runX, y: 275 }}
          tick={tick}
        />

        {/* Floating holographic office sign */}
        <g transform="translate(240, 135)">
          <rect x={-60} y={-15} width={120} height={26} rx={4}
            fill="#000000aa" stroke={CYAN} strokeWidth={1} />
          <rect x={-60} y={-15} width={120} height={26} rx={4}
            fill="none" stroke={CYAN} strokeWidth={1}
            style={{ filter: `drop-shadow(0 0 8px ${CYAN})` }} />
          <text x={0} y={2} textAnchor="middle" fill={CYAN} fontSize={10}
            fontFamily="'Courier New', monospace" letterSpacing={3}
            style={{ filter: `drop-shadow(0 0 6px ${CYAN})` }}>
            ◈ NEXUS HQ ◈
          </text>
          {/* animated dot */}
          <circle cx={-52} cy={0} r={3} fill={PINK}
            opacity={Math.sin(tick * 0.1) > 0 ? 1 : 0.2}
            style={{ filter: `drop-shadow(0 0 4px ${PINK})` }} />
          <circle cx={52} cy={0} r={3} fill={PINK}
            opacity={Math.sin(tick * 0.1 + Math.PI) > 0 ? 1 : 0.2}
            style={{ filter: `drop-shadow(0 0 4px ${PINK})` }} />
        </g>
      </svg>

      {/* UI — vaporwave HUD */}
      {/* Top bar */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        background: "rgba(13, 0, 26, 0.9)",
        borderBottom: `1px solid ${PINK}44`,
        boxShadow: `0 0 20px ${PINK}22`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 20,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 18, filter: `drop-shadow(0 0 8px ${PINK})` }}>🌌</div>
          <div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 4,
              background: `linear-gradient(90deg, ${PINK}, ${CYAN})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
            }}>AI//LIFE</div>
            <div style={{ fontSize: 8, color: `${PURPLE}cc`, letterSpacing: 3, marginTop: -1 }}>SYNTHWAVE METAVERSE</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Stats */}
        {[
          { label: "AGENTS", val: "5", color: PINK },
          { label: "DIMENSION", val: "Δ-7", color: CYAN },
          { label: "FLUX", val: `${(tick % 999).toString().padStart(3, "0")}`, color: PURPLE },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: "center",
            background: `${s.color}11`,
            border: `1px solid ${s.color}44`,
            borderRadius: 4,
            padding: "4px 12px",
          }}>
            <div style={{ fontSize: 8, color: `${s.color}88`, letterSpacing: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 700, letterSpacing: 2, textShadow: `0 0 8px ${s.color}` }}>{s.val}</div>
          </div>
        ))}

        {/* Hamburger */}
        <div style={{
          width: 38,
          height: 38,
          border: `1px solid ${PINK}66`,
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          cursor: "pointer",
          boxShadow: `0 0 10px ${PINK}33`,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === 1 ? 12 : 18,
              height: 1.5,
              background: PINK,
              boxShadow: `0 0 4px ${PINK}`,
              transition: "width 0.3s",
            }} />
          ))}
        </div>
      </div>

      {/* Animation legend */}
      <div style={{
        position: "absolute",
        top: 68,
        left: 16,
        width: 190,
        background: "rgba(13, 0, 26, 0.9)",
        border: `1px solid ${PURPLE}44`,
        borderRadius: 6,
        boxShadow: `0 0 20px ${PURPLE}22`,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${PURPLE}33`,
          fontSize: 9,
          color: CYAN,
          letterSpacing: 2,
          textShadow: `0 0 6px ${CYAN}`,
        }}>
          ▸ AGENT ANIMATIONS
        </div>
        {[
          { icon: "💺", label: "VEGA — Sitting/Working", color: PINK },
          { icon: "🏃", label: "ORION — Running", color: CYAN },
          { icon: "🦘", label: "LYRA — Jumping", color: "#f472b6" },
          { icon: "😐", label: "ZETA — Idle", color: PURPLE },
          { icon: "💤", label: "NOVA — Sleeping", color: "#34d399" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "7px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: `1px solid ${PURPLE}11`,
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: `${item.color}22`,
              border: `1px solid ${item.color}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}>{item.icon}</div>
            <div style={{ fontSize: 9, color: `${item.color}cc`, letterSpacing: 1 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Chat panel */}
      <div style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        width: 260,
        background: "rgba(13, 0, 26, 0.92)",
        border: `1px solid ${CYAN}33`,
        borderRadius: 6,
        boxShadow: `0 0 20px ${CYAN}22`,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${CYAN}22`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#34d399",
            boxShadow: `0 0 8px #34d399`,
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 10, color: CYAN, letterSpacing: 2, textShadow: `0 0 6px ${CYAN}` }}>NEURAL COMMS</span>
        </div>
        {[
          { name: "VEGA", color: PINK, msg: "Grid stability at 98% ✓" },
          { name: "ORION", color: CYAN, msg: "Running patrol route D-4..." },
          { name: "LYRA", color: "#f472b6", msg: "Ping! New dimension found 🌀" },
        ].map((msg, i) => (
          <div key={i} style={{
            padding: "7px 12px",
            borderBottom: `1px solid ${PURPLE}11`,
            display: "flex",
            gap: 8,
          }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: `${msg.color}22`,
              border: `1px solid ${msg.color}`,
              boxShadow: `0 0 6px ${msg.color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: msg.color,
              flexShrink: 0,
            }}>
              {msg.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 9, color: msg.color, letterSpacing: 1, marginBottom: 2, textShadow: `0 0 4px ${msg.color}` }}>{msg.name}</div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>{msg.msg}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Scanline overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(124,58,237,0.02) 3px, rgba(124,58,237,0.02) 4px)",
        pointerEvents: "none",
      }} />

      {/* Bottom controls hint */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 9,
        color: `${PINK}88`,
        letterSpacing: 3,
        textShadow: `0 0 6px ${PINK}44`,
        whiteSpace: "nowrap",
      }}>
        ◈ DRAG TO ROTATE ◈ SCROLL TO ZOOM ◈ CLICK TO INSPECT ◈
      </div>

      <style>{`
        @keyframes twinkle { from { opacity: 0.1; transform: scale(0.8); } to { opacity: 0.9; transform: scale(1.2); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
