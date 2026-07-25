import { useMemo } from "react";
import { housePosition, useSim, WORLD, deskPosition } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#4a7c3a" />
    </mesh>
  );
}

function Road() {
  return (
    <group>
      <mesh position={[0, 0.02, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          position={[-45 + i * 5, 0.03, 4]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2, 0.2]} />
          <meshStandardMaterial color="#fff59d" />
        </mesh>
      ))}
    </group>
  );
}

function OfficeBuilding() {
  const [cx, , cz] = WORLD.officeCenter;
  return (
    <group position={[cx, 0, cz]}>
      {/* floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#d1d5db" />
      </mesh>
      {/* walls */}
      <mesh position={[0, 2, -7]} castShadow>
        <boxGeometry args={[14, 4, 0.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-7, 2, 0]} castShadow>
        <boxGeometry args={[0.2, 4, 14]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[7, 2, 0]} castShadow>
        <boxGeometry args={[0.2, 4, 14]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* sign */}
      <Html position={[0, 5, -7]} center distanceFactor={20}>
        <div className="pointer-events-none rounded bg-black/70 px-3 py-1 text-xs font-bold text-white">
          🏢 OFFICE
        </div>
      </Html>
    </group>
  );
}

function Desks({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: Math.max(count, 8) }).map((_, i) => {
        const p = deskPosition(i);
        return (
          <mesh key={i} position={[p[0], 0.4, p[2]]} castShadow>
            <boxGeometry args={[1.2, 0.1, 0.7]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        );
      })}
    </group>
  );
}

function Houses({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: Math.max(count, 4) }).map((_, i) => {
        const p = housePosition(i);
        return (
          <group key={i} position={p}>
            <mesh position={[0, 1, 0]} castShadow>
              <boxGeometry args={[4, 2, 3]} />
              <meshStandardMaterial color="#fef3c7" />
            </mesh>
            <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[2.8, 1.5, 4]} />
              <meshStandardMaterial color="#7c2d12" />
            </mesh>
            <mesh position={[0, 0.5, 1.5]}>
              <boxGeometry args={[0.6, 1, 0.05]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function AgentAvatar({ agentId }: { agentId: string }) {
  const agent = useSim((s) => s.agents[agentId]);
  const groupRef = useRef<THREE.Group>(null);
  const select = useSim((s) => s.selectAgent);

  useFrame(({ clock }) => {
    if (!groupRef.current || !agent) return;
    groupRef.current.position.set(...agent.position);
    // bob when moving/typing
    const t = clock.getElapsedTime();
    const moving =
      agent.state === "COMMUTING_HOME" || agent.state === "COMMUTING_WORK";
    groupRef.current.position.y =
      agent.position[1] + (moving ? Math.abs(Math.sin(t * 8)) * 0.1 : 0);
  });

  if (!agent) return null;
  if (agent.state === "IN_TAXI_HOME" || agent.state === "IN_TAXI_WORK")
    return null;

  const stateEmoji: Record<string, string> = {
    WORKING: "💼",
    IDLE: "😐",
    COMMUTING_HOME: "🚶",
    COMMUTING_WORK: "🚶",
    RELAXING: "🛋️",
    SLEEPING: "😴",
    CHATTING: "💬",
  };

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); select(agent.id); }}>
      {/* body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <Html position={[0, 2, 0]} center distanceFactor={12}>
        <div className="pointer-events-none flex flex-col items-center gap-0.5">
          <div className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
            {stateEmoji[agent.state] ?? ""} {agent.name}
          </div>
        </div>
      </Html>
    </group>
  );
}

function Taxi({ taxiId }: { taxiId: string }) {
  const t = useSim((s) => s.taxis[taxiId]);
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current || !t) return;
    ref.current.position.set(t.position[0], 0.3, t.position[2]);
  });
  if (!t) return null;
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.6, 0.9]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.8]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      <Html position={[0, 1.2, 0]} center distanceFactor={15}>
        <div className="pointer-events-none rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
          🚕 TAXI
        </div>
      </Html>
    </group>
  );
}

export default function World3D() {
  const agentIds = useSim(useShallow((s) => Object.keys(s.agents)));
  const taxiIds = useSim(useShallow((s) => Object.keys(s.taxis)));
  const count = agentIds.length;

  const lights = useMemo(
    () => (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
      </>
    ),
    []
  );

  return (
    <>
      {lights}
      <Sky sunPosition={[100, 20, 100]} />
      <Ground />
      <Road />
      <OfficeBuilding />
      <Desks count={count} />
      <Houses count={count} />
      {agentIds.map((id) => (
        <AgentAvatar key={id} agentId={id} />
      ))}
      {taxiIds.map((id) => (
        <Taxi key={id} taxiId={id} />
      ))}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={80}
      />
    </>
  );
}
