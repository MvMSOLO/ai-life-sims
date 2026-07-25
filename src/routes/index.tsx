import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import World3D from "@/components/world/World3D";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
import AgentInspector from "@/components/ui/AgentInspector";
import { useSim } from "@/lib/store";
import { catchUpTick } from "@/lib/world.functions";

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
    // Fire initial catch-up tick
    catchUpTick().catch(() => {});

    // Poll /api/state every 2 s to hydrate the store
    const poll = async () => {
      try {
        const res = await fetch("/api/state");
        if (!res.ok) return;
        const data = await res.json() as {
          agents: unknown[];
          messages: unknown[];
          taxis: unknown[];
        };
        // Use getState() to avoid subscribing to setWorldFromServer in render
        useSim.getState().setWorldFromServer(
          data.agents as Parameters<ReturnType<typeof useSim.getState>["setWorldFromServer"]>[0],
          data.messages as Parameters<ReturnType<typeof useSim.getState>["setWorldFromServer"]>[1],
          data.taxis as Parameters<ReturnType<typeof useSim.getState>["setWorldFromServer"]>[2],
        );
      } catch {
        // ignore network blips
      }
    };

    poll(); // immediate first fetch

    const pollInterval = setInterval(poll, 2000);

    // Every 5 s trigger a server-side simulation tick
    const tickInterval = setInterval(() => {
      catchUpTick().catch(() => {});
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []); // run once on mount

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
        AI Life · drag to rotate · scroll to zoom · hint: type{" "}
        <span className="rounded bg-white/10 px-1 font-mono">cmd</span> in the input
      </div>
    </div>
  );
}
