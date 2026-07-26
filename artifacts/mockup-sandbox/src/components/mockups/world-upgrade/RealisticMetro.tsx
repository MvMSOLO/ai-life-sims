import { useEffect, useRef, useState } from "react";
import "./_group.css";

const AGENT_DATA = [
  { id: "a1", name: "Sarah Chen", color: "#3b82f6", state: "WORKING", deskX: 18, deskY: 42, anim: "typing" },
  { id: "a2", name: "Marcus Webb", color: "#ef4444", state: "COMMUTING", pathX: 55, pathY: 68, anim: "walk" },
  { id: "a3", name: "Yuna Park", color: "#8b5cf6", state: "CHATTING", deskX: 28, deskY: 45, anim: "gesture" },
  { id: "a4", name: "Aiden Torres", color: "#f59e0b", state: "IDLE", deskX: 22, deskY: 49, anim: "idle" },
  { id: "a5", name: "Luna Voss", color: "#10b981", state: "SLEEPING", houseX: 68, houseY: 58, anim: "sleep" },
];

function PersonAvatar({ x, y, color, state, name, tick, anim }: {
  x: number; y: number; color: string; state: string; name: string; tick: number; anim: string;
}) {
  let armAngle = 0;
  let bodyBob = 0;
  let legSwing = 0;
  let headNod = 0;
  let breathe = 1;

  if (anim === "walk") {
    const t = tick * 0.12;
    armAngle = Math.sin(t) * 25;
    legSwing = Math.sin(t) * 20;
    bodyBob = Math.abs(Math.sin(t)) * 2;
  }
  if (anim === "typing") {
    const t = tick * 0.15;
    headNod = Math.sin(t) * 5;
    armAngle = -20 + Math.sin(t * 2) * 5;
  }
  if (anim === "gesture") {
    const t = tick * 0.08;
    armAngle = Math.sin(t) * 35;
    headNod = Math.sin(t * 0.7) * 8;
  }
  if (anim === "sleep") {
    breathe = 1 + Math.sin(tick * 0.03) * 0.05;
  }
  if (anim === "idle") {
    headNod = Math.sin(tick * 0.05) * 3;
    breathe = 1 + Math.sin(tick * 0.04) * 0.02;
  }

  const stateLabels: Record<string, { icon: string; bg: string }> = {
    WORKING: { icon: "💼", bg: "#3b82f6" },
    COMMUTING: { icon: "🚶", bg: "#f59e0b" },
    CHATTING: { icon: "💬", bg: "#8b5cf6" },
    IDLE: { icon: "☕", bg: "#6b7280" },
    SLEEPING: { icon: "💤", bg: "#1d4ed8" },
  };
  const badge = stateLabels[state] || { icon: "🤖", bg: "#374151" };

  return (
    <g transform={`translate(${x}, ${y - bodyBob})`} style={{ cursor: "pointer" }}>
      {/* shadow */}
      <ellipse cx={0} cy={38} rx={10} ry={3} fill="rgba(0,0,0,0.15)" />

      {/* left leg */}
      <rect
        x={-4} y={24}
        width={6} height={14}
        rx={3}
        fill={color}
        opacity={0.8}
        transform={`rotate(${-legSwing * 0.5}, 0, 24)`}
      />
      {/* right leg */}
      <rect
        x={0} y={24}
        width={6} height={14}
        rx={3}
        fill={color}
        opacity={0.9}
        transform={`rotate(${legSwing * 0.5}, 0, 24)`}
      />

      {/* body */}
      <rect
        x={-9} y={10}
        width={18} height={16}
        rx={4}
        fill={color}
        transform={`scale(${1}, ${breathe})`}
        style={{ transformOrigin: "0 18px" }}
      />
      {/* shirt detail */}
      <rect x={-5} y={12} width={10} height={2} rx={1} fill="white" opacity={0.4} />
      {/* collar */}
      <path d="M-3 10 L0 14 L3 10" fill="none" stroke="white" strokeWidth={1} opacity={0.6} />

      {/* left arm */}
      <rect
        x={-14} y={12}
        width={6} height={12}
        rx={3}
        fill={color}
        opacity={0.85}
        transform={`rotate(${armAngle}, -9, 12)`}
      />
      {/* right arm */}
      <rect
        x={8} y={12}
        width={6} height={12}
        rx={3}
        fill={color}
        opacity={0.85}
        transform={`rotate(${-armAngle * 0.8}, 9, 12)`}
      />

      {/* neck */}
      <rect x={-3} y={6} width={6} height={5} rx={2} fill="#fcd7b0" />

      {/* head */}
      <ellipse
        cx={0} cy={0}
        rx={9} ry={8}
        fill="#fcd7b0"
        transform={`rotate(${headNod}, 0, 8)`}
      />
      {/* hair */}
      <ellipse cx={0} cy={-5} rx={9} ry={5} fill={color} opacity={0.7} transform={`rotate(${headNod}, 0, 8)`} />
      {/* eyes */}
      <circle cx={-3} cy={0} r={1.5} fill="#1f2937" transform={`rotate(${headNod}, 0, 8)`} />
      <circle cx={3} cy={0} r={1.5} fill="#1f2937" transform={`rotate(${headNod}, 0, 8)`} />
      <circle cx={-2.5} cy={-0.3} r={0.5} fill="white" transform={`rotate(${headNod}, 0, 8)`} />
      <circle cx={3.5} cy={-0.3} r={0.5} fill="white" transform={`rotate(${headNod}, 0, 8)`} />

      {/* State badge */}
      <circle cx={12} cy={-8} r={7} fill={badge.bg} />
      <text x={12} y={-5} textAnchor="middle" fontSize={8}>{badge.icon}</text>

      {/* Name label */}
      <g transform="translate(0, -22)">
        <rect x={-28} y={-8} width={56} height={12} rx={3} fill="rgba(17,24,39,0.85)" />
        <text x={0} y={1} textAnchor="middle" fontSize={7} fill="white" fontFamily="system-ui">{name}</text>
      </g>

      {/* Typing indicator for chatting */}
      {state === "CHATTING" && (
        <g transform="translate(0, -38)">
          <rect x={-18} y={-8} width={36} height={12} rx={6} fill="white" />
          <circle cx={-6} cy={-2} r={2.5} fill="#d1d5db">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0s" repeatCount="indefinite" />
          </circle>
          <circle cx={0} cy={-2} r={2.5} fill="#d1d5db">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={6} cy={-2} r={2.5} fill="#d1d5db">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
          </circle>
          <path d="M0 4 L4 8 L-4 8 Z" fill="white" />
        </g>
      )}
    </g>
  );
}

export function RealisticMetro() {
  const [tick, setTick] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState("Sarah Chen");
  const rafRef = useRef<number>();
  const [walkX, setWalkX] = useState(55);

  useEffect(() => {
    let t = 0;
    const loop = () => {
      t++;
      setTick(t);
      setWalkX(55 + Math.sin(t * 0.008) * 12);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const timeOfDay = Math.sin(tick * 0.001) * 0.5 + 0.5;
  const skyColor1 = `hsl(${200 + timeOfDay * 20}, ${70 + timeOfDay * 10}%, ${45 + timeOfDay * 20}%)`;
  const skyColor2 = `hsl(${220 + timeOfDay * 15}, 60%, ${25 + timeOfDay * 15}%)`;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: `linear-gradient(180deg, ${skyColor1} 0%, ${skyColor2} 60%, #1a1a2e 100%)`,
      position: "relative",
      overflow: "hidden",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Clouds */}
      {[
        { x: 10, y: 8, scale: 1.2, speed: 0.02 },
        { x: 40, y: 5, scale: 0.8, speed: 0.015 },
        { x: 70, y: 10, scale: 1, speed: 0.018 },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(c.x + tick * c.speed) % 110 - 10}%`,
          top: `${c.y}%`,
          width: `${12 * c.scale}%`,
          height: `${3 * c.scale}%`,
          background: "rgba(255,255,255,0.85)",
          borderRadius: "50px",
          boxShadow: "0 4px 20px rgba(255,255,255,0.3)",
          filter: "blur(2px)",
          minHeight: 20,
        }} />
      ))}

      {/* Sun */}
      <div style={{
        position: "absolute",
        right: "15%",
        top: "12%",
        width: 50,
        height: 50,
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff7 0%, #fcd34d 50%, transparent 70%)",
        boxShadow: "0 0 40px #fcd34d88, 0 0 80px #fcd34d33",
      }} />

      {/* City SVG */}
      <svg
        viewBox="0 0 800 500"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Sky gradient overlay */}
        <defs>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Ground */}
        <rect x="0" y="320" width="800" height="180" fill="url(#groundGrad)" />

        {/* Sidewalks */}
        <rect x="0" y="315" width="800" height="8" fill="#d1d5db" />

        {/* Office building */}
        <g filter="url(#shadow)">
          <rect x="60" y="120" width="180" height="200" rx="4" fill="#6b7280" />
          {/* Glass facade */}
          <rect x="64" y="124" width="172" height="196" rx="2" fill="#93c5fd" opacity="0.3" />
          {/* Window grid */}
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => (
              <rect key={`${row}-${col}`}
                x={68 + col * 33} y={130 + row * 28}
                width={25} height={20} rx={2}
                fill={Math.sin(row * 2.3 + col * 1.7 + tick * 0.005) > 0 ? "#fef9c3" : "#1e40af"}
                opacity={0.8}
              />
            ))
          )}
          {/* Roof features */}
          <rect x="100" y="110" width="100" height="12" rx="2" fill="#4b5563" />
          <rect x="140" y="100" width="20" height="12" rx="2" fill="#374151" />
          {/* Entrance */}
          <rect x="130" y="285" width="40" height="35" rx="2" fill="#1e3a5f" />
          <rect x="133" y="287" width="34" height="33" rx="1" fill="#93c5fd" opacity="0.5" />
          {/* Office sign */}
          <rect x="75" y="135" width="150" height="20" rx="2" fill="rgba(0,0,0,0.5)" />
          <text x="150" y="149" textAnchor="middle" fill="white" fontSize="10" fontFamily="system-ui" fontWeight="600">🏢 NEXUS OFFICE</text>
        </g>

        {/* Office desks (isometric feel) */}
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <rect x={80 + i * 40} y={230 + (i % 2) * 20} width={30} height={20} rx={2} fill="#92400e" opacity={0.8} />
            <rect x={82 + i * 40} y={225 + (i % 2) * 20} width={26} height={5} rx={1} fill="#a78bfa" opacity={0.6} />
            {/* Monitor */}
            <rect x={88 + i * 40} y={218 + (i % 2) * 20} width={14} height={9} rx={1} fill="#1f2937" />
            <rect x={89 + i * 40} y={219 + (i % 2) * 20} width={12} height={7} rx={1} fill="#3b82f6" opacity={0.7} />
          </g>
        ))}

        {/* Houses */}
        {[0, 1, 2].map(i => (
          <g key={i} filter="url(#shadow)">
            <rect x={500 + i * 90} y={230} width={70} height={90} rx={4} fill={["#fef3c7", "#ecfdf5", "#eff6ff"][i]} />
            {/* Roof */}
            <polygon
              points={`${500 + i * 90 - 5},230 ${535 + i * 90},185 ${575 + i * 90},230`}
              fill={["#7c2d12", "#064e3b", "#1e3a8a"][i]}
            />
            {/* Door */}
            <rect x={523 + i * 90} y={285} width={24} height={35} rx={2} fill={["#451a03", "#052e16", "#082f49"][i]} />
            <circle cx={540 + i * 90} cy={305} r={2} fill="#f59e0b" />
            {/* Window */}
            <rect x={505 + i * 90} y={248} width={22} height={18} rx={2} fill="#bfdbfe" />
            <line x1={516 + i * 90} y1={248} x2={516 + i * 90} y2={266} stroke="#60a5fa" strokeWidth={1} opacity={0.5} />
            <line x1={505 + i * 90} y1={257} x2={527 + i * 90} y2={257} stroke="#60a5fa" strokeWidth={1} opacity={0.5} />
            {/* Garden */}
            <ellipse cx={520 + i * 90} cy={320} rx={8} ry={4} fill="#16a34a" opacity={0.7} />
            <ellipse cx={555 + i * 90} cy={318} rx={6} ry={3} fill="#15803d" opacity={0.7} />
          </g>
        ))}

        {/* Road */}
        <rect x="0" y="318" width="800" height="28" fill="url(#roadGrad)" />
        {/* Road markings */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i}
            x={((i * 80) + (tick * 0.5)) % 820 - 20} y={329}
            width={40} height={4} rx={2}
            fill="#fbbf24" opacity={0.8}
          />
        ))}

        {/* Sidewalk trees */}
        {[50, 160, 280, 440, 490].map((x, i) => (
          <g key={i}>
            <rect x={x + 3} y={295} width={4} height={25} fill="#78350f" />
            <circle cx={x + 5} cy={288} r={12} fill="#16a34a" opacity={0.9} />
            <circle cx={x + 2} cy={292} r={8} fill="#15803d" opacity={0.7} />
          </g>
        ))}

        {/* Taxi */}
        <g transform={`translate(${walkX * 5.8}, 307)`}>
          <rect x={-25} y={-15} width={50} height={20} rx={4} fill="#facc15" />
          <rect x={-18} y={-22} width={36} height={10} rx={3} fill="#fef3c7" />
          {/* windows */}
          <rect x={-16} y={-20} width={14} height={7} rx={1} fill="#93c5fd" opacity={0.8} />
          <rect x={2} y={-20} width={14} height={7} rx={1} fill="#93c5fd" opacity={0.8} />
          {/* wheels */}
          <circle cx={-14} cy={5} r={5} fill="#1f2937" />
          <circle cx={14} cy={5} r={5} fill="#1f2937" />
          <circle cx={-14} cy={5} r={2} fill="#6b7280" />
          <circle cx={14} cy={5} r={2} fill="#6b7280" />
          {/* TAXI sign */}
          <rect x={-10} y={-26} width={20} height={6} rx={2} fill="#1d4ed8" />
          <text x={0} y={-21} textAnchor="middle" fill="white" fontSize={5} fontFamily="system-ui" fontWeight="700">TAXI</text>
        </g>

        {/* Agents */}
        {AGENT_DATA.slice(0, 4).map((agent, i) => {
          const x = (agent.deskX || agent.houseX || 50) * 8;
          const y = (agent.deskY || agent.houseY || 50) * 5;
          return (
            <PersonAvatar
              key={agent.id}
              x={x}
              y={y}
              color={agent.color}
              state={agent.state}
              name={agent.name}
              tick={tick}
              anim={agent.anim}
            />
          );
        })}

        {/* Walking agent */}
        <PersonAvatar
          x={walkX * 8}
          y={305}
          color={AGENT_DATA[1].color}
          state="COMMUTING"
          name={AGENT_DATA[1].name}
          tick={tick}
          anim="walk"
        />
      </svg>

      {/* UI Overlay — modern glass HUD */}
      {/* Top bar */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "rgba(17, 24, 39, 0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌆</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "white", letterSpacing: 0.5 }}>AI Life</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Autonomous Metaverse</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Weather */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "4px 12px" }}>
          <span style={{ fontSize: 14 }}>☀️</span>
          <span style={{ fontSize: 12, color: "#fcd34d" }}>23°C</span>
        </div>

        {/* Time */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px" }}>
          <div style={{ fontSize: 13, color: "white", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {String(9 + Math.floor(tick * 0.005) % 12).padStart(2, "0")}:{String(Math.floor(tick * 0.3) % 60).padStart(2, "0")}
          </div>
        </div>

        {/* Agents count */}
        {["💼 5 Working", "🚶 1 Commuting", "💬 1 Chatting"].map((label, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 11,
            color: "rgba(255,255,255,0.8)",
          }}>
            {label}
          </div>
        ))}

        {/* Hamburger */}
        <button style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(59,130,246,0.3)",
          border: "1px solid rgba(59,130,246,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          cursor: "pointer",
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 14, height: 1.5, background: "#93c5fd", borderRadius: 1 }} />
          ))}
        </button>
      </div>

      {/* Agent inspector — left panel */}
      <div style={{
        position: "absolute",
        top: 72,
        left: 16,
        width: 220,
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(20px)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}>
        {/* Agent header */}
        <div style={{
          padding: "12px 16px",
          background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 0 12px #3b82f644",
          }}>👩‍💻</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Sarah Chen</div>
            <div style={{ fontSize: 10, color: "#93c5fd", marginTop: 1 }}>💼 Working</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: "12px 16px" }}>
          {[
            { label: "Energy", val: 87, color: "#10b981", icon: "⚡" },
            { label: "Boredom", val: 23, color: "#f59e0b", icon: "😑" },
            { label: "Social", val: 65, color: "#3b82f6", icon: "👥" },
            { label: "Wallet", val: 340, color: "#8b5cf6", icon: "💰", max: 500 },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{s.icon}</span>{s.label}
                </span>
                <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>
                  {s.max ? `$${s.val}` : `${s.val}%`}
                </span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                <div style={{
                  height: "100%",
                  width: `${s.max ? (s.val / s.max) * 100 : s.val}%`,
                  background: `linear-gradient(90deg, ${s.color}88, ${s.color})`,
                  borderRadius: 3,
                  transition: "width 1s ease",
                  boxShadow: `0 0 8px ${s.color}44`,
                }} />
              </div>
            </div>
          ))}

          {/* Traits */}
          <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["friendly", "energetic"].map(t => (
              <span key={t} style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 10,
                background: "rgba(139,92,246,0.2)",
                border: "1px solid rgba(139,92,246,0.4)",
                color: "#c4b5fd",
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Chat panel — bottom right */}
      <div style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        width: 280,
        maxHeight: 280,
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(20px)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "white" }}>World Chat</span>
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>3 agents active</span>
        </div>

        {[
          { name: "Sarah Chen", color: "#3b82f6", msg: "Just finished the neural network design!", time: "2m" },
          { name: "Yuna Park", color: "#8b5cf6", msg: "I love the new office layout 😊", time: "1m" },
          { name: "Aiden Torres", color: "#f59e0b", msg: "Coffee time ☕ anyone joining?", time: "30s" },
        ].map((msg, i) => (
          <div key={i} style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `${msg.color}33`,
              border: `2px solid ${msg.color}`,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: msg.color,
            }}>
              {msg.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: msg.color }}>{msg.name}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{msg.time}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{msg.msg}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom hint */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(17, 24, 39, 0.7)",
        backdropFilter: "blur(10px)",
        borderRadius: 20,
        padding: "6px 16px",
        fontSize: 11,
        color: "rgba(255,255,255,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
        whiteSpace: "nowrap",
      }}>
        🖱 Drag to rotate · Scroll to zoom · Click agent to inspect
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
