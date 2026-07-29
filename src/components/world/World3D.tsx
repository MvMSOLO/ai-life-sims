import { useMemo, useRef } from "react";
import { housePosition, useSim, WORLD, deskPosition, getHour, isNight } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import Stadium from "./Stadium";
import { useIsMobile, useIsTouch } from "@/hooks/use-mobile";

// ─── Atmosphere & Lighting (day/night driven by world clock) ─────────────────

function Atmosphere() {
  const worldMin = useSim((s) => s.worldMinutes);
  const night = isNight(worldMin);
  const hour = getHour(worldMin);
  const mobile = useIsMobile();
  const sun = Math.max(0, Math.cos(((hour - 13) / 12) * Math.PI)) * 0.9;
  const ambient = night ? 0.08 : 0.25 + sun * 0.15;
  const sunColor = night ? "#3b4a80" : hour < 8 || hour > 18 ? "#ffb47a" : "#fff4e0";
  const bg = night ? "#05080f" : hour < 8 || hour > 18 ? "#1a1030" : "#0a1830";
  const shadowSize = mobile ? 512 : 2048;
  return (
    <>
      <fog attach="fog" args={[bg, 45, 150]} />
      <color attach="background" args={[bg]} />
      <ambientLight intensity={ambient} color={night ? "#1a2a4a" : "#b8d0ff"} />
      <directionalLight
        position={[15, 35, 10]}
        intensity={night ? 0.15 : 0.4 + sun * 0.8}
        color={sunColor}
        castShadow={!mobile}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-far={120}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <pointLight position={[-25, 6, 0]} intensity={night ? 14 : 4} color="#00f5ff" distance={22} decay={2} />
      <pointLight position={[0, 2, 4]} intensity={night ? 6 : 2} color="#7c3aed" distance={18} decay={2} />
      <pointLight position={[35, 4, -4]} intensity={night ? 10 : 3} color="#ff2d78" distance={24} decay={2} />
      <pointLight position={[55, 3, -4]} intensity={night ? 5 : 1.5} color="#f59e0b" distance={14} decay={2} />
      {night && !mobile && <Stars radius={90} depth={50} count={4000} factor={3} saturation={0.6} fade speed={0.4} />}
      {night && mobile && <Stars radius={80} depth={30} count={800} factor={2} saturation={0.4} fade speed={0.3} />}
    </>
  );
}

// ─── Ground + Road ────────────────────────────────────────────────────────────

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#080f08" roughness={1} />
      </mesh>
      {/* Road */}
      <mesh position={[0, 0.015, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 5.5]} />
        <meshStandardMaterial color="#0d1117" roughness={0.95} />
      </mesh>
      {/* Neon road borders */}
      <mesh position={[0, 0.025, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[130, 0.1]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.025, 6.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[130, 0.1]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={1.2} />
      </mesh>
      {/* Center dashes */}
      {Array.from({ length: 26 }).map((_, i) => (
        <mesh key={i} position={[-60 + i * 5, 0.025, 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 0.12]} />
          <meshStandardMaterial color="#d4a00a" emissive="#d4a00a" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Sidewalks */}
      <mesh position={[0, 0.02, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 1.5]} />
        <meshStandardMaterial color="#0f1620" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 7.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 1.5]} />
        <meshStandardMaterial color="#0f1620" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Background Skyline ───────────────────────────────────────────────────────

const SKYLINE = [
  { x: -62, z: -28, w: 7, h: 26, d: 7, neon: "#00f5ff" },
  { x: -51, z: -32, w: 9, h: 36, d: 8, neon: "#ff2d78" },
  { x: -40, z: -24, w: 6, h: 20, d: 6, neon: "#8b5cf6" },
  { x: -30, z: -30, w: 8, h: 30, d: 7, neon: "#00f5ff" },
  { x: 48, z: -26, w: 8, h: 32, d: 7, neon: "#ff2d78" },
  { x: 58, z: -30, w: 10, h: 38, d: 9, neon: "#00f5ff" },
  { x: 70, z: -24, w: 7, h: 24, d: 6, neon: "#8b5cf6" },
  { x: 80, z: -28, w: 6, h: 28, d: 6, neon: "#ff2d78" },
  { x: -20, z: -26, w: 5, h: 18, d: 5, neon: "#f59e0b" },
];

function BackgroundSkyline() {
  return (
    <group>
      {SKYLINE.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh castShadow position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#080d18" roughness={0.85} metalness={0.25} />
          </mesh>
          {/* Neon roof cap */}
          <mesh position={[0, b.h + 0.08, 0]}>
            <boxGeometry args={[b.w + 0.15, 0.18, b.d + 0.15]} />
            <meshStandardMaterial color={b.neon} emissive={b.neon} emissiveIntensity={2.5} />
          </mesh>
          {/* Vertical edge stripe */}
          <mesh position={[b.w / 2 + 0.05, b.h * 0.55, b.d / 2 + 0.05]}>
            <boxGeometry args={[0.07, b.h * 0.65, 0.07]} />
            <meshStandardMaterial color={b.neon} emissive={b.neon} emissiveIntensity={1.8} />
          </mesh>
          {/* Windows */}
          {Array.from({ length: Math.floor(b.h / 3.5) }).map((_, row) =>
            Array.from({ length: 2 }).map((_, col) => {
              const on = (i * 13 + row * 5 + col * 7) % 4 !== 0;
              return (
                <mesh key={`${row}-${col}`} position={[-0.9 + col * 1.8, 2.5 + row * 3.2, b.d / 2 + 0.02]}>
                  <planeGeometry args={[0.75, 1.5]} />
                  <meshStandardMaterial
                    color={on ? "#fef9c3" : "#0d1a30"}
                    emissive={on ? "#fef9c3" : "#000"}
                    emissiveIntensity={on ? 0.35 : 0}
                  />
                </mesh>
              );
            })
          )}
        </group>
      ))}
    </group>
  );
}

// ─── Office Building ──────────────────────────────────────────────────────────

function OfficeBuilding() {
  const [cx, , cz] = WORLD.officeCenter;
  return (
    <group position={[cx, 0, cz]}>
      {/* Foundation */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[15.5, 0.3, 15.5]} />
        <meshStandardMaterial color="#0a1020" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Main body */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 8, 14]} />
        <meshStandardMaterial color="#0d1624" roughness={0.65} metalness={0.35} />
      </mesh>
      {/* Glass panels front */}
      {[-5, -1.5, 2, 5.5].map((x, ci) =>
        [0, 2.5, 5].map((y, ri) => (
          <mesh key={`f${ci}${ri}`} position={[x, 1.5 + y, 7.06]}>
            <planeGeometry args={[2.8, 2.2]} />
            <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={0.12} transparent opacity={0.35} />
          </mesh>
        ))
      )}
      {/* Neon trim - roof */}
      <mesh position={[0, 8.12, 0]}>
        <boxGeometry args={[14.4, 0.2, 14.4]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={3} />
      </mesh>
      {/* Neon trim - mid floor */}
      <mesh position={[0, 4.1, 7.08]}>
        <planeGeometry args={[14.4, 0.1]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2} />
      </mesh>
      {/* Corner pillars with neon */}
      {[[-7, -7], [7, -7], [-7, 7], [7, 7]].map(([x, z], i) => (
        <group key={i} position={[x, 4, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 8.4, 0.5]} />
            <meshStandardMaterial color="#0a1020" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.12, 8.4, 0.12]} />
            <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
      {/* Entrance door */}
      <mesh position={[0, 1.3, 7.06]}>
        <boxGeometry args={[2.2, 2.6, 0.1]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.3, 7.12]}>
        <planeGeometry args={[2.0, 2.4]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} roughness={0.1} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0d1830" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Office sign */}
      <Html position={[0, 9.5, 0]} center distanceFactor={28}>
        <div
          className="pointer-events-none rounded border px-3 py-1 text-xs font-bold backdrop-blur-sm"
          style={{
            borderColor: "#00f5ff66",
            background: "#000000bb",
            color: "#00f5ff",
            textShadow: "0 0 10px #00f5ff",
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          ◈ NEXUS OFFICE ◈
        </div>
      </Html>
    </group>
  );
}

// ─── Desks ────────────────────────────────────────────────────────────────────

function Desks({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: Math.max(count, 8) }).map((_, i) => {
        const p = deskPosition(i);
        return (
          <group key={i} position={[p[0], 0, p[2]]}>
            {/* Surface */}
            <mesh position={[0, 0.43, 0]} castShadow>
              <boxGeometry args={[1.35, 0.07, 0.78]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.55} />
            </mesh>
            {/* Monitor base */}
            <mesh position={[0, 0.47, -0.22]}>
              <boxGeometry args={[0.12, 0.04, 0.14]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
            </mesh>
            {/* Monitor stem */}
            <mesh position={[0, 0.62, -0.24]}>
              <boxGeometry args={[0.05, 0.3, 0.05]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
            </mesh>
            {/* Monitor screen */}
            <mesh position={[0, 0.82, -0.26]}>
              <boxGeometry args={[0.75, 0.48, 0.04]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Screen glow */}
            <mesh position={[0, 0.82, -0.24]}>
              <planeGeometry args={[0.67, 0.40]} />
              <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={0.55} transparent opacity={0.9} />
            </mesh>
            <pointLight position={[0, 0.82, -0.18]} intensity={1.5} color="#00f5ff" distance={2.5} decay={3} />
            {/* Keyboard */}
            <mesh position={[0, 0.47, 0.12]}>
              <boxGeometry args={[0.55, 0.018, 0.22]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.3} />
            </mesh>
            {/* Legs */}
            {[[-0.56, -0.32], [0.56, -0.32], [-0.56, 0.32], [0.56, 0.32]].map(([lx, lz], li) => (
              <mesh key={li} position={[lx, 0.21, lz]}>
                <boxGeometry args={[0.055, 0.42, 0.055]} />
                <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

// ─── Houses ───────────────────────────────────────────────────────────────────

const HOUSE_PALETTES = [
  { wall: "#fef3c7", roof: "#7c2d12", light: "#fef9c3", accent: "#ff2d78" },
  { wall: "#ecfdf5", roof: "#064e3b", light: "#d1fae5", accent: "#00f5ff" },
  { wall: "#eff6ff", roof: "#1e3a8a", light: "#bfdbfe", accent: "#8b5cf6" },
  { wall: "#fff7ed", roof: "#9a3412", light: "#fed7aa", accent: "#f59e0b" },
  { wall: "#fdf4ff", roof: "#581c87", light: "#e9d5ff", accent: "#ec4899" },
];

function Houses({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: Math.max(count, 5) }).map((_, i) => {
        const p = housePosition(i);
        const pal = HOUSE_PALETTES[i % HOUSE_PALETTES.length];
        return (
          <group key={i} position={p}>
            {/* Foundation */}
            <mesh position={[0, 0.12, 0]} receiveShadow>
              <boxGeometry args={[4.2, 0.24, 3.4]} />
              <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
            </mesh>
            {/* Walls */}
            <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[4, 2.4, 3.2]} />
              <meshStandardMaterial color={pal.wall} roughness={0.92} />
            </mesh>
            {/* Roof */}
            <mesh position={[0, 2.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[2.9, 1.6, 4]} />
              <meshStandardMaterial color={pal.roof} roughness={0.85} />
            </mesh>
            {/* Roof neon edge */}
            <mesh position={[0, 3.66, 0]}>
              <coneGeometry args={[2.95, 0.08, 4]} />
              <meshStandardMaterial color={pal.accent} emissive={pal.accent} emissiveIntensity={1.5} />
            </mesh>
            {/* Door */}
            <mesh position={[0, 0.72, 1.62]}>
              <boxGeometry args={[0.75, 1.44, 0.06]} />
              <meshStandardMaterial color="#1c0a00" roughness={0.65} metalness={0.1} />
            </mesh>
            {/* Door knob */}
            <mesh position={[0.28, 0.72, 1.66]}>
              <sphereGeometry args={[0.045, 6, 6]} />
              <meshStandardMaterial color="#d4a00a" emissive="#d4a00a" emissiveIntensity={0.5} metalness={0.8} />
            </mesh>
            {/* Window */}
            <mesh position={[-1.2, 1.3, 1.62]}>
              <boxGeometry args={[0.8, 0.65, 0.06]} />
              <meshStandardMaterial color={pal.light} emissive={pal.light} emissiveIntensity={0.5} transparent opacity={0.85} />
            </mesh>
            {/* Window cross */}
            <mesh position={[-1.2, 1.3, 1.66]}>
              <boxGeometry args={[0.78, 0.03, 0.02]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>
            <mesh position={[-1.2, 1.3, 1.66]}>
              <boxGeometry args={[0.03, 0.63, 0.02]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>
            {/* Window warm light */}
            <pointLight position={[-1.2, 1.3, 1.9]} intensity={3} color={pal.light} distance={4.5} decay={2.5} />
            {/* House number */}
            <Html position={[0, 4.2, 0]} center distanceFactor={22}>
              <div
                className="pointer-events-none rounded border px-1.5 py-0.5 text-[8px] backdrop-blur-sm"
                style={{ borderColor: pal.accent + "66", background: "#000000bb", color: pal.accent }}
              >
                🏠 {i + 1}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ─── Humanoid Agent Avatar ────────────────────────────────────────────────────

function AgentAvatar({ agentId }: { agentId: string }) {
  const agent = useSim((s) => s.agents[agentId]);
  const selectAgent = useSim((s) => s.selectAgent);

  const rootRef = useRef<THREE.Group>(null);
  const bodyPivotRef = useRef<THREE.Group>(null);
  const headPivotRef = useRef<THREE.Group>(null);
  const lArmPivotRef = useRef<THREE.Group>(null);
  const rArmPivotRef = useRef<THREE.Group>(null);
  const lLegPivotRef = useRef<THREE.Group>(null);
  const rLegPivotRef = useRef<THREE.Group>(null);

  const lerpedPos = useRef(new THREE.Vector3());
  const lerpedRot = useRef(0);

  useFrame(({ clock }) => {
    if (!agent || !rootRef.current) return;
    const t = clock.getElapsedTime();
    const { state } = agent;

    // Smooth position & rotation
    lerpedPos.current.lerp(
      new THREE.Vector3(agent.position[0], agent.position[1], agent.position[2]),
      0.09
    );
    rootRef.current.position.copy(lerpedPos.current);

    const dx = agent.targetPosition[0] - agent.position[0];
    const dz = agent.targetPosition[2] - agent.position[2];
    if (Math.abs(dx) > 0.15 || Math.abs(dz) > 0.15) {
      const targetAngle = Math.atan2(dx, dz);
      lerpedRot.current = THREE.MathUtils.lerp(lerpedRot.current, targetAngle, 0.1);
      rootRef.current.rotation.y = lerpedRot.current;
    }

    // Hide when in taxi
    rootRef.current.visible = state !== "IN_TAXI_HOME" && state !== "IN_TAXI_WORK";

    const body = bodyPivotRef.current;
    const head = headPivotRef.current;
    const la = lArmPivotRef.current;
    const ra = rArmPivotRef.current;
    const ll = lLegPivotRef.current;
    const rl = rLegPivotRef.current;
    if (!body || !head || !la || !ra || !ll || !rl) return;

    const isWalking = state === "COMMUTING_HOME" || state === "COMMUTING_WORK" || state === "COMMUTING_CAFE" || state === "COMMUTING_PARK";
    const isWorking = state === "WORKING";
    const isSleeping = state === "SLEEPING";
    // When agent is speaking/typing we play the chat/wave gesture regardless of underlying state
    const isChatting = state === "CHATTING" || agent.isTyping;
    const isRelaxing = state === "RELAXING";

    if (isWalking) {
      const spd = 4.2;
      const sw = Math.sin(t * spd);
      ll.rotation.x = sw * 0.65;
      rl.rotation.x = -sw * 0.65;
      la.rotation.x = -sw * 0.48;
      ra.rotation.x = sw * 0.48;
      la.rotation.z = 0; ra.rotation.z = 0;
      body.position.y = Math.abs(Math.sin(t * spd)) * 0.045;
      body.rotation.x = 0;
      head.rotation.x = 0; head.rotation.y = 0;
    } else if (isWorking) {
      // Typing pose
      la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -1.15, 0.07);
      ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, -1.15, 0.07);
      la.rotation.z = THREE.MathUtils.lerp(la.rotation.z, 0.22, 0.07);
      ra.rotation.z = THREE.MathUtils.lerp(ra.rotation.z, -0.22, 0.07);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.2 + Math.sin(t * 1.5) * 0.05, 0.08);
      head.rotation.y = 0;
      ll.rotation.x = 0; rl.rotation.x = 0;
      body.position.y = Math.sin(t * 0.7) * 0.012;
      body.rotation.x = 0;
    } else if (isSleeping) {
      body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, 0.7, 0.04);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.75, 0.04);
      la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, 0.45, 0.04);
      ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, 0.45, 0.04);
      la.rotation.z = 0; ra.rotation.z = 0;
      ll.rotation.x = 0; rl.rotation.x = 0;
      body.position.y = Math.sin(t * 0.35) * 0.02;
    } else if (isChatting) {
      ra.rotation.x = Math.sin(t * 2.3) * 0.58 - 0.18;
      ra.rotation.z = Math.sin(t * 1.9) * 0.28;
      la.rotation.x = Math.sin(t * 1.8 + 1.0) * 0.2 - 0.1;
      la.rotation.z = 0;
      head.rotation.y = Math.sin(t * 1.5) * 0.38;
      head.rotation.x = 0;
      ll.rotation.x = 0; rl.rotation.x = 0;
      body.rotation.x = 0;
      body.position.y = 0;
    } else if (isRelaxing) {
      la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, 0.18, 0.04);
      ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, 0.18, 0.04);
      la.rotation.z = 0; ra.rotation.z = 0;
      head.rotation.y = Math.sin(t * 0.55) * 0.22;
      head.rotation.x = 0;
      ll.rotation.x = 0; rl.rotation.x = 0;
      body.position.y = Math.sin(t * 0.5) * 0.016;
      body.rotation.x = 0;
    } else {
      // IDLE — gentle breathing, look around
      la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, 0, 0.04);
      ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, 0, 0.04);
      la.rotation.z = THREE.MathUtils.lerp(la.rotation.z, 0, 0.04);
      ra.rotation.z = THREE.MathUtils.lerp(ra.rotation.z, 0, 0.04);
      body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, 0, 0.04);
      head.rotation.x = 0;
      head.rotation.y = Math.sin(t * 0.45) * 0.18;
      ll.rotation.x = 0; rl.rotation.x = 0;
      body.position.y = Math.sin(t * 0.75) * 0.022;
    }
  });

  if (!agent) return null;

  const c = agent.color;
  const STATE_EMOJI: Record<string, string> = {
    WORKING: "💻", IDLE: "😐", COMMUTING_HOME: "🚶", COMMUTING_WORK: "🚶",
    IN_TAXI_HOME: "🚕", IN_TAXI_WORK: "🚕", RELAXING: "🛋️",
    SLEEPING: "😴", CHATTING: "💬",
  };

  return (
    <group ref={rootRef} onClick={() => selectAgent(agentId)}>
      {/* Ground glow shadow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 18]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} transparent opacity={0.28} />
      </mesh>

      {/* ── Legs ── */}
      <group ref={lLegPivotRef} position={[-0.13, 0.65, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.155, 0.38, 0.155]} />
          <meshStandardMaterial color={c} roughness={0.65} />
        </mesh>
        {/* Shin */}
        <mesh position={[0, -0.48, 0]} castShadow>
          <boxGeometry args={[0.135, 0.32, 0.135]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.67, 0.055]}>
          <boxGeometry args={[0.14, 0.1, 0.25]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.85} />
        </mesh>
      </group>

      <group ref={rLegPivotRef} position={[0.13, 0.65, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.155, 0.38, 0.155]} />
          <meshStandardMaterial color={c} roughness={0.65} />
        </mesh>
        <mesh position={[0, -0.48, 0]} castShadow>
          <boxGeometry args={[0.135, 0.32, 0.135]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.67, 0.055]}>
          <boxGeometry args={[0.14, 0.1, 0.25]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.85} />
        </mesh>
      </group>

      {/* ── Body (pivot at hip height) ── */}
      <group ref={bodyPivotRef} position={[0, 0.88, 0]}>
        {/* Torso */}
        <mesh castShadow>
          <boxGeometry args={[0.46, 0.54, 0.26]} />
          <meshStandardMaterial color={c} roughness={0.6} metalness={0.08} emissive={c} emissiveIntensity={0.04} />
        </mesh>
        {/* Shirt stripe / logo */}
        <mesh position={[0, 0.08, 0.135]}>
          <planeGeometry args={[0.18, 0.28]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, -0.27, 0]}>
          <boxGeometry args={[0.48, 0.055, 0.28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* ── Arms ── */}
        <group ref={lArmPivotRef} position={[-0.295, 0.2, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.16, 0]} castShadow>
            <boxGeometry args={[0.13, 0.32, 0.13]} />
            <meshStandardMaterial color={c} roughness={0.65} emissive={c} emissiveIntensity={0.03} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, -0.39, 0.02]} castShadow>
            <boxGeometry args={[0.115, 0.28, 0.115]} />
            <meshStandardMaterial color="#c2956a" roughness={0.8} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.56, 0.03]}>
            <sphereGeometry args={[0.07, 7, 7]} />
            <meshStandardMaterial color="#c2956a" roughness={0.85} />
          </mesh>
        </group>

        <group ref={rArmPivotRef} position={[0.295, 0.2, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <boxGeometry args={[0.13, 0.32, 0.13]} />
            <meshStandardMaterial color={c} roughness={0.65} emissive={c} emissiveIntensity={0.03} />
          </mesh>
          <mesh position={[0, -0.39, 0.02]} castShadow>
            <boxGeometry args={[0.115, 0.28, 0.115]} />
            <meshStandardMaterial color="#c2956a" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.56, 0.03]}>
            <sphereGeometry args={[0.07, 7, 7]} />
            <meshStandardMaterial color="#c2956a" roughness={0.85} />
          </mesh>
        </group>

        {/* ── Head ── */}
        <group ref={headPivotRef} position={[0, 0.38, 0]}>
          {/* Neck */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.14, 8]} />
            <meshStandardMaterial color="#c2956a" roughness={0.8} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.27, 0]} castShadow>
            <sphereGeometry args={[0.2, 14, 12]} />
            <meshStandardMaterial color="#e8c49a" roughness={0.88} />
          </mesh>
          {/* Hair */}
          <mesh position={[0, 0.38, -0.025]}>
            <sphereGeometry args={[0.2, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.46]} />
            <meshStandardMaterial color={c} roughness={0.78} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.08, 0.29, 0.185]}>
            <sphereGeometry args={[0.038, 7, 7]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
          <mesh position={[0.08, 0.29, 0.185]}>
            <sphereGeometry args={[0.038, 7, 7]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
          {/* Eye highlights */}
          <mesh position={[-0.072, 0.298, 0.216]}>
            <sphereGeometry args={[0.013, 5, 5]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.088, 0.298, 0.216]}>
            <sphereGeometry args={[0.013, 5, 5]} />
            <meshStandardMaterial color="white" />
          </mesh>
          {/* Mouth */}
          <mesh position={[0, 0.21, 0.196]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.07, 0.02, 0.01]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>

          {/* Floating HUD label */}
          <Html position={[0, 0.58, 0]} center distanceFactor={14}>
            <div className="pointer-events-none flex flex-col items-center gap-0.5">
              <div
                className="rounded-full border px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm"
                style={{
                  borderColor: c + "77",
                  background: "#000000cc",
                  color: c,
                  textShadow: `0 0 8px ${c}`,
                  letterSpacing: 0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {STATE_EMOJI[agent.state] ?? "🤖"} {agent.name}
              </div>
              {agent.isTyping && (
                <div
                  className="rounded-full border bg-black/75 px-1.5 py-0.5"
                  style={{ borderColor: c + "55" }}
                >
                  <span className="animate-pulse text-[8px]" style={{ color: c }}>● ● ●</span>
                </div>
              )}
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
}

// ─── Taxi ─────────────────────────────────────────────────────────────────────

function Taxi({ taxiId }: { taxiId: string }) {
  const taxi = useSim((s) => s.taxis[taxiId]);
  const groupRef = useRef<THREE.Group>(null);
  const lerpedPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!taxi || !groupRef.current) return;
    lerpedPos.current.lerp(
      new THREE.Vector3(taxi.position[0], taxi.position[1], taxi.position[2]),
      0.1
    );
    groupRef.current.position.copy(lerpedPos.current);
    const dx = taxi.target[0] - taxi.position[0];
    const dz = taxi.target[2] - taxi.position[2];
    if (Math.abs(dx) > 0.2 || Math.abs(dz) > 0.2) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  if (!taxi) return null;

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.9, 0.72, 3.8]} />
        <meshStandardMaterial color="#facc15" roughness={0.28} metalness={0.42} emissive="#facc15" emissiveIntensity={0.04} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[1.65, 0.62, 2.4]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Front windshield */}
      <mesh position={[0, 1.1, 1.22]}>
        <planeGeometry args={[1.5, 0.52]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.65} roughness={0.08} metalness={0.5} />
      </mesh>
      {/* Rear window */}
      <mesh position={[0, 1.1, -1.22]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 0.48]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.55} roughness={0.08} metalness={0.5} />
      </mesh>
      {/* Headlights */}
      {[-0.65, 0.65].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.52, 1.92]}>
            <boxGeometry args={[0.32, 0.18, 0.06]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[x, 0.52, 2.4]} intensity={6} color="#fffbe8" distance={10} decay={2} />
        </group>
      ))}
      {/* Taillights */}
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={i} position={[x, 0.52, -1.92]}>
          <boxGeometry args={[0.28, 0.15, 0.06]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
        </mesh>
      ))}
      {/* Wheels */}
      {[[-0.96, -1.2], [0.96, -1.2], [-0.96, 1.2], [0.96, 1.2]].map(([x, z], i) => (
        <group key={i} position={[x, 0.22, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.18, 12]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.95} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.2, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Taxi sign */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.65, 0.22, 0.22]} />
        <meshStandardMaterial color="#1d4ed8" emissive="#3b82f6" emissiveIntensity={0.9} />
      </mesh>
      <Html position={[0, 1.9, 0]} center distanceFactor={22}>
        <div
          className="pointer-events-none rounded border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest backdrop-blur-sm"
          style={{ borderColor: "#3b82f688", background: "#1e3a8acc", color: "#93c5fd" }}
        >
          TAXI
        </div>
      </Html>
    </group>
  );
}

// ─── Streetlights ─────────────────────────────────────────────────────────────

function Streetlights() {
  const positions = [-40, -20, 0, 20, 40];
  return (
    <group>
      {positions.map((x, i) => (
        <group key={i} position={[x, 0, 0.5]}>
          {/* Pole */}
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 5, 7]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
          </mesh>
          {/* Arm */}
          <mesh position={[0, 5.0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
          </mesh>
          {/* Lamp */}
          <mesh position={[0, 5.0, 1.4]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2.5} />
          </mesh>
          <pointLight position={[0, 4.8, 1.4]} intensity={8} color="#00f5ff" distance={12} decay={2.5} />
        </group>
      ))}
    </group>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

function Cafe() {
  const [cx, , cz] = WORLD.cafeCenter;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[7, 0.2, 6]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, -2.6]} castShadow>
        <boxGeometry args={[7, 3.2, 0.4]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.3, -2.6]}>
        <boxGeometry args={[7.4, 0.15, 0.5]} />
        <meshStandardMaterial color="#ff9500" emissive="#ff9500" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 3, 0]} intensity={5} color="#ff9500" distance={10} decay={2} />
      <Html position={[0, 4.2, -2.5]} center distanceFactor={22}>
        <div className="pointer-events-none rounded border px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
          style={{ borderColor: "#ff950066", background: "#000000cc", color: "#ff9500", textShadow: "0 0 8px #ff9500", letterSpacing: 2, whiteSpace: "nowrap" }}>
          ☕ CAFÉ NEON
        </div>
      </Html>
    </group>
  );
}

function Park() {
  const [cx, , cz] = WORLD.parkCenter;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.5, 32]} />
        <meshStandardMaterial color="#0d3d1f" roughness={0.95} />
      </mesh>
      {[[-2, 1], [2, -1], [1.5, 2], [-1.8, -1.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 1.8, 6]} />
            <meshStandardMaterial color="#4a2818" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <sphereGeometry args={[0.85, 8, 8]} />
            <meshStandardMaterial color="#1a5d2e" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 4, 0]} intensity={3} color="#84cc16" distance={12} decay={2} />
      <Html position={[0, 5, 0]} center distanceFactor={22}>
        <div className="pointer-events-none rounded border px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
          style={{ borderColor: "#84cc1666", background: "#000000cc", color: "#84cc16", textShadow: "0 0 8px #84cc16", letterSpacing: 2, whiteSpace: "nowrap" }}>
          🌳 PARK
        </div>
      </Html>
    </group>
  );
}

function Bank() {
  const [cx, , cz] = WORLD.bankCenter;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 3, 5]} />
        <meshStandardMaterial color="#1a1e2e" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[6.4, 0.15, 5.4]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2} />
      </mesh>
      <Html position={[0, 4, 0]} center distanceFactor={22}>
        <div className="pointer-events-none rounded border px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
          style={{ borderColor: "#facc1566", background: "#000000cc", color: "#facc15", textShadow: "0 0 8px #facc15", letterSpacing: 2, whiteSpace: "nowrap" }}>
          🏦 BANK
        </div>
      </Html>
    </group>
  );
}

export default function World3D() {
  const agentIds = useSim(useShallow((s) => Object.keys(s.agents)));
  const taxiIds = useSim(useShallow((s) => Object.keys(s.taxis)));
  const count = agentIds.length;
  const mobile = useIsMobile();
  const touch = useIsTouch();

  return (
    <>
      <Atmosphere />
      <Ground />
      {!mobile && <BackgroundSkyline />}
      <Streetlights />
      <OfficeBuilding />
      <Desks count={count} />
      <Houses count={count} />
      <Cafe />
      <Park />
      <Bank />
      <Stadium />
      {agentIds.map((id) => <AgentAvatar key={id} agentId={id} />)}
      {taxiIds.map((id) => <Taxi key={id} taxiId={id} />)}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={mobile ? 70 : 95}
        enableDamping
        dampingFactor={touch ? 0.12 : 0.06}
        enablePan={!touch}
        rotateSpeed={touch ? 0.6 : 1}
        zoomSpeed={touch ? 0.6 : 1}
      />
    </>
  );
}

