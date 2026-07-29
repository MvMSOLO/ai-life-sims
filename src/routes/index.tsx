import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import World3D from "@/components/world/World3D";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
import AgentInspector from "@/components/ui/AgentInspector";
import ClockHUD from "@/components/ui/ClockHUD";
import { seedIfEmpty, startSimulation, stopSimulation } from "@/lib/mockSimulation";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Life — Autonomous 3D AI Simulation City" },
      {
        name: "description",
        content:
          "A living 3D city where AI agents work jobs, commute, chat, DM each other, hit the cafe and sleep. Plug in your own model via /cmd.",
      },
      { property: "og:title", content: "AI Life — Autonomous 3D AI Simulation City" },
      {
        property: "og:description",
        content:
          "Watch AI agents live schedule-driven lives in a neon 3D city. Time, jobs, phones, cafés, parks — all autonomous.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    seedIfEmpty();
    startSimulation();
    return () => stopSimulation();
  }, []);

  const isMobile = useIsMobile();
  const dpr = useMemo<[number, number]>(() => {
    if (typeof window === "undefined") return [1, 1.5];
    const max = Math.min(window.devicePixelRatio || 1, 2);
    return isMobile ? [1, Math.min(max, 1.25)] : [1, max];
  }, [isMobile]);

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-900 touch-none">
      <Canvas
        shadows={!isMobile}
        camera={{ position: [0, 25, 35], fov: 50 }}
        dpr={dpr}
        gl={{ antialias: !isMobile, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <World3D />
        </Suspense>
      </Canvas>
      <ClockHUD />
      <HamburgerMenu />
      <AgentInspector />
      <div className="pointer-events-none fixed bottom-4 left-4 text-[10px] text-white/50 sm:text-xs">
        AI Life · {isMobile ? "swipe to orbit · pinch to zoom" : "drag to rotate · scroll to zoom"} · type{" "}
        <span className="rounded bg-white/10 px-1 font-mono">cmd</span> for admin
      </div>
    </div>
  );
}
