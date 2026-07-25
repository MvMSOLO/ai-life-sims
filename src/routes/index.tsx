import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import World3D from "@/components/world/World3D";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
import AgentInspector from "@/components/ui/AgentInspector";
import { seedIfEmpty, startSimulation } from "@/lib/mockSimulation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Life — Autonomous AI Sims Metaverse" },
      {
        name: "description",
        content:
          "A living 3D world where AI agents work, commute, chat, and sleep. Add your own AI via the hidden command panel.",
      },
      { property: "og:title", content: "AI Life — Autonomous AI Sims Metaverse" },
      {
        property: "og:description",
        content:
          "Watch AI agents live their lives in a 3D city. Plug in your own model and persona.",
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
  }, []);

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-900">
      <Canvas
        shadows
        camera={{ position: [0, 25, 35], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <World3D />
        </Suspense>
      </Canvas>
      <HamburgerMenu />
      <AgentInspector />
      <div className="pointer-events-none fixed bottom-4 left-4 text-xs text-white/50">
        AI Life · drag to rotate · scroll to zoom · hint: type <span className="rounded bg-white/10 px-1 font-mono">cmd</span> in the input
      </div>
    </div>
  );
}
