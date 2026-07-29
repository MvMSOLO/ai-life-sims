// Santiago Bernabéu-inspired stadium — oval bowl, metallic louvered facade,
// retractable roof panels, four seat tiers in Real Madrid blue, painted pitch.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances, Html } from "@react-three/drei";
import * as THREE from "three";
import { WORLD, useSim, getHour, isNight } from "@/lib/store";
import { useIsMobile } from "@/hooks/use-mobile";

const RM_BLUE_DEEP = "#0b2464";
const RM_BLUE = "#1e40af";
const RM_BLUE_LIGHT = "#3b82f6";
const METAL = "#c8ccd4";
const PITCH_A = "#0f7a2e";
const PITCH_B = "#0d6a28";

// Oval params
const RX = 14; // ellipse x radius
const RZ = 11; // ellipse z radius
const HEIGHT = 9;

function ovalPoint(ax: number, az: number, angle: number): [number, number] {
  return [Math.cos(angle) * ax, Math.sin(angle) * az];
}

// Vertical louver panels around the perimeter (Bernabéu 2024 look)
function Facade({ mobile }: { mobile: boolean }) {
  const count = mobile ? 48 : 96;
  const items = useMemo(() => {
    const arr: { pos: [number, number, number]; rot: number; scaleY: number }[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const [x, z] = ovalPoint(RX, RZ, a);
      // Tangent angle to face outward
      const rot = -a + Math.PI / 2;
      const scaleY = 1 + Math.sin(a * 3) * 0.05;
      arr.push({ pos: [x, HEIGHT / 2, z], rot, scaleY });
    }
    return arr;
  }, [count]);

  return (
    <Instances limit={count} castShadow={!mobile} receiveShadow>
      <boxGeometry args={[0.22, HEIGHT, 0.9]} />
      <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.28} emissive="#1a2540" emissiveIntensity={0.15} />
      {items.map((it, i) => (
        <Instance key={i} position={it.pos} rotation={[0, it.rot, 0]} scale={[1, it.scaleY, 1]} />
      ))}
    </Instances>
  );
}

// Halo scoreboard ring
function HaloScoreboard({ mobile }: { mobile: boolean }) {
  const worldMin = useSim((s) => s.worldMinutes);
  const hour = getHour(worldMin);
  const mm = Math.floor(worldMin % 60);
  const timeStr = `${String(hour).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return (
    <group position={[0, HEIGHT - 1.2, 0]}>
      <mesh>
        <torusGeometry args={[6.5, 0.35, 8, mobile ? 24 : 48]} />
        <meshStandardMaterial color="#0a0f1a" emissive={RM_BLUE_LIGHT} emissiveIntensity={1.4} metalness={0.7} roughness={0.3} />
      </mesh>
      {!mobile && (
        <Html center distanceFactor={18} position={[0, 0, 0]}>
          <div
            className="pointer-events-none rounded border px-3 py-1 text-[11px] font-bold tracking-widest"
            style={{
              borderColor: "#3b82f688",
              background: "#000000dd",
              color: "#93c5fd",
              textShadow: "0 0 10px #3b82f6",
            }}
          >
            REAL MADRID · {timeStr}
          </div>
        </Html>
      )}
    </group>
  );
}

// Retractable roof — two half oval panels that slide open in daytime
function RetractableRoof({ mobile }: { mobile: boolean }) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const worldMin = useSim((s) => s.worldMinutes);
  const closed = isNight(worldMin);

  useFrame(() => {
    if (!leftRef.current || !rightRef.current) return;
    const targetX = closed ? 0 : RX * 0.55;
    leftRef.current.position.x = THREE.MathUtils.lerp(leftRef.current.position.x, -targetX, 0.05);
    rightRef.current.position.x = THREE.MathUtils.lerp(rightRef.current.position.x, targetX, 0.05);
  });

  return (
    <group position={[0, HEIGHT + 0.4, 0]}>
      <mesh ref={leftRef} castShadow={!mobile}>
        <boxGeometry args={[RX * 0.95, 0.35, RZ * 1.6]} />
        <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh ref={rightRef} castShadow={!mobile}>
        <boxGeometry args={[RX * 0.95, 0.35, RZ * 1.6]} />
        <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
}

// Seating bowl — 4 concentric tiers of instanced seat blocks
function SeatingBowl({ mobile }: { mobile: boolean }) {
  const perTier = mobile ? 40 : 96;
  const tiers = [
    { rx: RX - 1.2, rz: RZ - 1.0, y: 0.9, color: RM_BLUE_DEEP },
    { rx: RX - 2.2, rz: RZ - 1.8, y: 1.8, color: RM_BLUE },
    { rx: RX - 3.1, rz: RZ - 2.5, y: 2.7, color: RM_BLUE_LIGHT },
    { rx: RX - 4.0, rz: RZ - 3.2, y: 3.6, color: RM_BLUE },
  ];
  return (
    <>
      {tiers.map((t, ti) => (
        <Instances key={ti} limit={perTier} receiveShadow>
          <boxGeometry args={[0.7, 0.35, 0.55]} />
          <meshStandardMaterial color={t.color} roughness={0.75} />
          {Array.from({ length: perTier }).map((_, i) => {
            const a = (i / perTier) * Math.PI * 2;
            const [x, z] = ovalPoint(t.rx, t.rz, a);
            const rot = -a + Math.PI / 2;
            // North stand: lighter block spelling out RM area
            return <Instance key={i} position={[x, t.y, z]} rotation={[0, rot, 0]} />;
          })}
        </Instances>
      ))}
    </>
  );
}

// Painted pitch
function Pitch() {
  const stripes = 10;
  return (
    <group position={[0, 0.05, 0]}>
      {/* Grass base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RX * 1.4, RZ * 1.4]} />
        <meshStandardMaterial color={PITCH_A} roughness={1} />
      </mesh>
      {/* Mowed stripes */}
      {Array.from({ length: stripes }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, -RZ * 0.65 + i * (RZ * 1.3 / stripes) + RZ * 1.3 / stripes / 2]}
        >
          <planeGeometry args={[RX * 1.35, RZ * 1.3 / stripes]} />
          <meshStandardMaterial color={i % 2 === 0 ? PITCH_A : PITCH_B} roughness={1} />
        </mesh>
      ))}
      {/* Touchlines */}
      {[-RZ * 0.6, RZ * 0.6].map((z, i) => (
        <mesh key={`tl${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}>
          <planeGeometry args={[RX * 1.3, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}
      {[-RX * 0.65, RX * 0.65].map((x, i) => (
        <mesh key={`sl${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[0.1, RZ * 1.2]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}
      {/* Halfway line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.1, RZ * 1.2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <ringGeometry args={[1.5, 1.6, 32]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <circleGeometry args={[0.15, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Penalty boxes */}
      {[-1, 1].map((s) => (
        <mesh key={`pb${s}`} rotation={[-Math.PI / 2, 0, 0]} position={[s * (RX * 0.55), 0.011, 0]}>
          <ringGeometry args={[1.9, 2.0, 24, 1, 0, Math.PI]} />
          <meshStandardMaterial color="white" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Goals */}
      {[-RX * 0.65, RX * 0.65].map((x, i) => (
        <group key={`g${i}`} position={[x, 0.6, 0]}>
          <mesh>
            <boxGeometry args={[0.08, 1.2, 2.4]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Floodlights({ mobile }: { mobile: boolean }) {
  const worldMin = useSim((s) => s.worldMinutes);
  const night = isNight(worldMin);
  if (mobile) {
    return night ? <pointLight position={[0, HEIGHT + 4, 0]} intensity={6} color="#e0f2fe" distance={45} decay={2} /> : null;
  }
  const corners: [number, number][] = [
    [-RX * 0.85, -RZ * 0.85],
    [RX * 0.85, -RZ * 0.85],
    [-RX * 0.85, RZ * 0.85],
    [RX * 0.85, RZ * 0.85],
  ];
  return (
    <>
      {corners.map(([x, z], i) => (
        <spotLight
          key={i}
          position={[x, HEIGHT + 3, z]}
          angle={0.7}
          intensity={night ? 20 : 0}
          color="#e0f2fe"
          distance={40}
          decay={1.8}
          target-position={[0, 0, 0]}
        />
      ))}
    </>
  );
}

export default function Stadium() {
  const mobile = useIsMobile();
  const [cx, , cz] = WORLD.stadiumCenter;

  return (
    <group position={[cx, 0, cz]}>
      {/* Foundation platform */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0, RX + 2, mobile ? 24 : 48]} />
        <meshStandardMaterial color="#1a1e2e" roughness={0.9} />
      </mesh>
      <Facade mobile={mobile} />
      <SeatingBowl mobile={mobile} />
      <Pitch />
      <RetractableRoof mobile={mobile} />
      <HaloScoreboard mobile={mobile} />
      <Floodlights mobile={mobile} />

      {/* Stadium name — north facade */}
      <Html position={[0, HEIGHT + 2.5, -RZ - 1]} center distanceFactor={30}>
        <div
          className="pointer-events-none rounded border px-3 py-1 text-xs font-bold backdrop-blur-sm"
          style={{
            borderColor: "#93c5fd88",
            background: "#000000dd",
            color: "#93c5fd",
            textShadow: "0 0 10px #3b82f6",
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          ⚪ SANTIAGO BERNABÉU ⚪
        </div>
      </Html>
    </group>
  );
}
