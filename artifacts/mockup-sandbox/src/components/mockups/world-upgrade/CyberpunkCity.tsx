import { useEffect, useRef, useState } from "react";
import "./_group.css";

const NEON_COLORS = ["#ff2d78", "#00f5ff", "#bf00ff", "#00ff88", "#ffaa00"];

const AGENTS = [
  { id: "a1", name: "ARIA-7", color: "#00f5ff", state: "WORKING", x: 22, y: 62, anim: "float" },
  { id: "a2", name: "KADE-9", color: "#ff2d78", state: "COMMUTING", x: 48, y: 72, anim: "walk" },
  { id: "a3", name: "NOVA-3", color: "#bf00ff", state: "CHATTING", x: 35, y: 58, anim: "pulse" },
  { id: "a4", name: "ZEX-1", color: "#00ff88", state: "IDLE", x: 15, y: 66, anim: "idle" },
  { id: "a5", name: "RAZE-5", color: "#ffaa00", state: "SLEEPING", x: 60, y: 55, anim: "breathe" },
];

const BUILDINGS = [
  { x: 10, y: 15, w: 8, h: 55, color: "#0a1628", accent: "#00f5ff", windows: 18 },
  { x: 20, y: 25, w: 6, h: 40, color: "#0d1f3c", accent: "#ff2d78", windows: 12 },
  { x: 30, y: 10, w: 10, h: 60, color: "#080e1e", accent: "#bf00ff", windows: 20 },
  { x: 42, y: 20, w: 7, h: 50, color: "#0a1628", accent: "#00ff88", windows: 16 },
  { x: 52, y: 30, w: 9, h: 35, color: "#0d1f3c", accent: "#ffaa00", windows: 10 },
  { x: 63, y: 15, w: 6, h: 55, color: "#080e1e", accent: "#00f5ff", windows: 18 },
  { x: 71, y: 28, w: 8, h: 42, color: "#0a1628", accent: "#ff2d78", windows: 14 },
  { x: 81, y: 18, w: 7, h: 52, color: "#0d1f3c", accent: "#bf00ff", windows: 17 },
];

function glowStyle(color: string, px = 8) {
  return { textShadow: `0 0 ${px}px ${color}, 0 0 ${px * 2}px ${color}` };
}
function boxGlow(color: string, px = 8) {
  return { boxShadow: `0 0 ${px}px ${color}, 0 0 ${px * 2}px ${color}40` };
}

function AgentAvatar({ agent, tick }: { agent: typeof AGENTS[0]; tick: number }) {
  const phase = (tick / 60 + AGENTS.indexOf(agent) * 0.7) % 1;
  let yOff = 0;
  let scale = 1;
  let opacity = 1;
  if (agent.anim === "walk") yOff = Math.sin(tick * 0.18) * 4;
  if (agent.anim === "float") yOff = Math.sin(tick * 0.06) * 3;
  if (agent.anim === "pulse") scale = 1 + Math.sin(tick * 0.12) * 0.08;
  if (agent.anim === "breathe") { scale = 1 + Math.sin(tick * 0.04) * 0.04; opacity = 0.7; }

  const stateEmoji: Record<string, string> = {
    WORKING: "💻", COMMUTING: "🚶", CHATTING: "💬", IDLE: "😐", SLEEPING: "😴"
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${agent.x}%`,
        top: `${agent.y + yOff * 0.3}%`,
        transform: `translateX(-50%) scale(${scale})`,
        opacity,
        transition: "transform 0.1s ease",
        zIndex: 10,
      }}
    >
      {/* holographic ring */}
      <div style={{
        position: "absolute",
        bottom: "-4px",
        left: "50%",
        transform: "translateX(-50%)",
        width: 32,
        height: 8,
        borderRadius: "50%",
        background: `${agent.color}30`,
        border: `1px solid ${agent.color}80`,
        boxShadow: `0 0 12px ${agent.color}`,
        animation: "holoring 2s linear infinite",
      }} />

      {/* body */}
      <div style={{
        width: 20,
        height: 28,
        borderRadius: "6px 6px 4px 4px",
        background: `linear-gradient(180deg, ${agent.color}cc 0%, ${agent.color}44 100%)`,
        border: `1px solid ${agent.color}`,
        ...boxGlow(agent.color, 6),
        position: "relative",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
      }}>
        {/* scanline overlay */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)", borderRadius: "inherit", pointerEvents: "none" }} />
        <span style={{ position: "relative", zIndex: 1 }}>{stateEmoji[agent.state] || "🤖"}</span>
      </div>

      {/* head */}
      <div style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, white, ${agent.color})`,
        border: `2px solid ${agent.color}`,
        ...boxGlow(agent.color, 4),
        margin: "-8px auto 0",
        position: "relative",
        zIndex: 2,
      }} />

      {/* name tag */}
      <div style={{
        position: "absolute",
        top: "-22px",
        left: "50%",
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        fontSize: 9,
        fontFamily: "'Courier New', monospace",
        color: agent.color,
        ...glowStyle(agent.color, 4),
        background: "#00000099",
        padding: "1px 5px",
        border: `1px solid ${agent.color}66`,
        borderRadius: 3,
        letterSpacing: 1,
      }}>
        {agent.name}
      </div>

      {/* typing indicator */}
      {agent.state === "CHATTING" && (
        <div style={{
          position: "absolute",
          top: "-38px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#00000088",
          border: `1px solid ${agent.color}`,
          borderRadius: 8,
          padding: "2px 6px",
          display: "flex",
          gap: 2,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: agent.color,
              animation: `typingDot 1.2s ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Building({ b, tick }: { b: typeof BUILDINGS[0]; tick: number }) {
  return (
    <div style={{ position: "absolute", left: `${b.x}%`, bottom: `${100 - (b.y + b.h)}%`, width: `${b.w}%`, height: `${b.h}%` }}>
      <div style={{
        width: "100%",
        height: "100%",
        background: b.color,
        border: `1px solid ${b.accent}33`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* scanlines */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.02) 4px, rgba(255,255,255,0.02) 5px)", pointerEvents: "none" }} />
        {/* windows grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: 3, height: "100%" }}>
          {Array.from({ length: b.windows }).map((_, i) => {
            const lit = (tick * 0.02 + i * 0.37) % 1 > 0.3;
            return (
              <div key={i} style={{
                background: lit ? `${b.accent}cc` : `${b.accent}11`,
                borderRadius: 1,
                boxShadow: lit ? `0 0 6px ${b.accent}` : "none",
                transition: "background 1s, box-shadow 1s",
              }} />
            );
          })}
        </div>
        {/* neon top stripe */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: b.accent,
          boxShadow: `0 0 8px ${b.accent}, 0 0 20px ${b.accent}88`,
        }} />
        {/* vertical neon stripe */}
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "20%",
          width: 1,
          background: `linear-gradient(180deg, ${b.accent}, transparent)`,
          opacity: 0.5,
        }} />
      </div>
    </div>
  );
}

export function CyberpunkCity() {
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

  const scanlineY = (tick * 0.8) % 100;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(180deg, #000008 0%, #010314 40%, #020820 70%, #030a28 100%)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Stars */}
      {Array.from({ length: 80 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 137.5) % 100}%`,
          top: `${(i * 97.3) % 40}%`,
          width: i % 5 === 0 ? 2 : 1,
          height: i % 5 === 0 ? 2 : 1,
          borderRadius: "50%",
          background: "white",
          opacity: 0.3 + (i % 3) * 0.2,
          animation: `starTwinkle ${2 + (i % 4)}s ${i % 2}s ease-in-out infinite alternate`,
        }} />
      ))}

      {/* Atmospheric fog */}
      <div style={{
        position: "absolute",
        bottom: "28%",
        left: 0,
        right: 0,
        height: "12%",
        background: "linear-gradient(180deg, transparent, #00f5ff08, #bf00ff08, transparent)",
        filter: "blur(20px)",
      }} />

      {/* Skyline buildings */}
      <div style={{ position: "absolute", inset: 0 }}>
        {BUILDINGS.map((b, i) => (
          <Building key={i} b={b} tick={tick} />
        ))}
      </div>

      {/* Ground */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "35%",
        background: "linear-gradient(180deg, #030a28 0%, #010210 100%)",
      }}>
        {/* Road with neon reflections */}
        <div style={{
          position: "absolute",
          top: "20%",
          left: 0,
          right: 0,
          height: "25%",
          background: "#050a14",
          borderTop: "2px solid #00f5ff44",
          borderBottom: "2px solid #00f5ff44",
        }}>
          {/* moving dashes */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              top: "50%",
              left: `${((i * 12.5) + (tick * 0.3)) % 110 - 10}%`,
              transform: "translateY(-50%)",
              width: "8%",
              height: 2,
              background: "linear-gradient(90deg, transparent, #fff59d, transparent)",
              transition: "left 0.016s linear",
            }} />
          ))}
          {/* neon reflection on road */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #ff2d7822, #00f5ff22, #bf00ff22, #00ff8822)",
            mixBlendMode: "screen",
            opacity: 0.5,
          }} />
        </div>

        {/* Grid floor pattern */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60%",
          backgroundImage: `
            linear-gradient(90deg, #00f5ff11 1px, transparent 1px),
            linear-gradient(0deg, #00f5ff11 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          perspective: "200px",
          transform: "perspective(300px) rotateX(30deg)",
          transformOrigin: "bottom center",
        }} />
      </div>

      {/* Agents */}
      {AGENTS.map(agent => (
        <AgentAvatar key={agent.id} agent={agent} tick={tick} />
      ))}

      {/* Holographic taxi */}
      <div style={{
        position: "absolute",
        left: `${38 + Math.sin(tick * 0.015) * 8}%`,
        top: "70%",
        width: 50,
        height: 28,
        background: "linear-gradient(135deg, #facc1544, #eab30844)",
        border: "1px solid #facc15",
        borderRadius: 4,
        boxShadow: "0 0 12px #facc15, 0 0 24px #facc1544",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
      }}>
        <span>🚕</span>
      </div>

      {/* Global scanline effect */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: `${scanlineY}%`,
        height: "3%",
        background: "linear-gradient(180deg, transparent, rgba(0,245,255,0.03), transparent)",
        pointerEvents: "none",
      }} />

      {/* UI OVERLAY */}
      {/* Top HUD */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        {/* Logo */}
        <div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#00f5ff",
            letterSpacing: 4,
            ...glowStyle("#00f5ff", 8),
          }}>
            AI//LIFE
          </div>
          <div style={{ fontSize: 9, color: "#00f5ff88", letterSpacing: 3, marginTop: 2 }}>
            METAVERSE OS v2.7
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          background: "#000000cc",
          border: "1px solid #00f5ff44",
          borderRadius: 4,
          padding: "8px 16px",
          backdropFilter: "blur(12px)",
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}>
          {[
            { label: "AGENTS", val: "5 ACTIVE", color: "#00ff88" },
            { label: "TICK", val: `#${(tick % 9999).toString().padStart(4, "0")}`, color: "#00f5ff" },
            { label: "STATUS", val: "ONLINE", color: "#ff2d78" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#ffffff44", letterSpacing: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: s.color, ...glowStyle(s.color, 3), letterSpacing: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Hamburger button */}
        <div style={{
          width: 40,
          height: 40,
          background: "#000000cc",
          border: "1px solid #00f5ff66",
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          cursor: "pointer",
          ...boxGlow("#00f5ff", 4),
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 18, height: 1.5, background: "#00f5ff", boxShadow: "0 0 4px #00f5ff" }} />
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        width: 260,
        background: "#000000cc",
        border: "1px solid #00f5ff33",
        borderRadius: 4,
        backdropFilter: "blur(16px)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "8px 12px",
          borderBottom: "1px solid #00f5ff22",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#00f5ff", letterSpacing: 2 }}>NEURAL CHAT</span>
        </div>
        {AGENTS.slice(0, 3).map((agent, i) => (
          <div key={agent.id} style={{
            padding: "6px 12px",
            borderBottom: "1px solid #ffffff08",
            display: "flex",
            gap: 8,
            alignItems: "center",
            animation: `fadeInUp 0.4s ${i * 0.1}s both`,
          }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${agent.color}33`, border: `1px solid ${agent.color}`, boxShadow: `0 0 6px ${agent.color}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: agent.color, fontWeight: 700 }}>
              {agent.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 9, color: agent.color, letterSpacing: 1 }}>{agent.name}</div>
              <div style={{ fontSize: 8, color: "#ffffff66", marginTop: 1 }}>
                {["processing neural links...", "optimizing pathways...", "scanning environment..."][i]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent inspector */}
      <div style={{
        position: "absolute",
        top: 80,
        left: 16,
        width: 200,
        background: "#000000cc",
        border: "1px solid #ff2d7844",
        borderRadius: 4,
        backdropFilter: "blur(16px)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #ff2d7822", fontSize: 9, color: "#ff2d78", letterSpacing: 2, ...glowStyle("#ff2d78", 2) }}>
          ▶ SELECTED: ARIA-7
        </div>
        <div style={{ padding: "10px 12px" }}>
          {[
            { label: "ENERGY", val: 87, color: "#00ff88" },
            { label: "BOREDOM", val: 23, color: "#ffaa00" },
            { label: "SOCIAL", val: 65, color: "#00f5ff" },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 8, letterSpacing: 1 }}>
                <span style={{ color: "#ffffff66" }}>{s.label}</span>
                <span style={{ color: s.color }}>{s.val}%</span>
              </div>
              <div style={{ height: 3, background: "#ffffff11", borderRadius: 2 }}>
                <div style={{
                  height: "100%",
                  width: `${s.val}%`,
                  background: s.color,
                  borderRadius: 2,
                  boxShadow: `0 0 6px ${s.color}`,
                  transition: "width 1s ease",
                }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 8, color: "#ffffff44", fontStyle: "italic", lineHeight: 1.5 }}>
            "A sentient AI architect building neural bridges between digital dimensions."
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      {[
        { top: 0, left: 0, borderTop: "2px solid #00f5ff", borderLeft: "2px solid #00f5ff" },
        { top: 0, right: 0, borderTop: "2px solid #ff2d78", borderRight: "2px solid #ff2d78" },
        { bottom: 0, left: 0, borderBottom: "2px solid #bf00ff", borderLeft: "2px solid #bf00ff" },
        { bottom: 0, right: 0, borderBottom: "2px solid #00ff88", borderRight: "2px solid #00ff88" },
      ].map((style, i) => (
        <div key={i} style={{ position: "absolute", width: 20, height: 20, ...style as React.CSSProperties }} />
      ))}

      <style>{`
        @keyframes holoring { from { transform: translateX(-50%) scaleX(1); } to { transform: translateX(-50%) scaleX(1.3); } }
        @keyframes typingDot { 0%, 100% { opacity: 0.2; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
        @keyframes starTwinkle { from { opacity: 0.1; } to { opacity: 0.8; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
