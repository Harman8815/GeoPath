"use client";

import { useMemo, useState } from "react";
import { useAnimationPlayback } from "@/hooks/useAnimationPlayback";
import { Graph } from "@/lib/graph";
import ControlPanel from "./ControlPanel";
import GraphRenderer from "./GraphRenderer";
import LiveStatsPanel from "./LiveStatsPanel";
import { SAMPLE_MAPS, sampleMapNodes, sampleMapEdges } from "@/lib/graph";
import ImportMap from "./ImportMap";
import OSMImport from "./OSMImport";
import type { GraphData, NodeModel, EdgeModel } from "@/lib/graph";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [source, setSource] = useState("A");
  const [destination, setDestination] = useState("G");
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [mapId, setMapId] = useState(SAMPLE_MAPS[0].id);
  const [custom, setCustom] = useState<GraphData | null>(null);
  const mapNodes: NodeModel[] = custom ? custom.nodes : sampleMapNodes(mapId);
  const mapEdges: EdgeModel[] = custom ? custom.edges : sampleMapEdges(mapId);

  const graph = useMemo(() => Graph.fromData({ nodes: mapNodes, edges: mapEdges }), [mapNodes, mapEdges]);

  const playback = useAnimationPlayback({
    graph,
    source,
    target: destination,
    speed,
  });

  const handleImport = (result: { graph: GraphData }) => {
    setCustom(result.graph);
    setMapId("");
  };

  const handleOSMLoad = (graphData: GraphData) => {
    setCustom(graphData);
    setMapId("");
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header onMenuClick={() => setMobileNavOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-black/10 p-4 lg:block dark:border-white/10">
          <div className="flex h-full flex-col gap-4 overflow-y-auto">
            <ControlPanel
              source={source}
              destination={destination}
              speed={speed}
              map={mapId}
              maps={SAMPLE_MAPS.map((m) => ({ id: m.id, name: m.name }))}
              onSourceChange={setSource}
              onDestinationChange={setDestination}
              onSpeedChange={setSpeed}
              onMapChange={setMapId}
              onPlay={playback.play}
              onPause={playback.pause}
              onResume={playback.resume}
              onReset={playback.reset}
              onStepForward={playback.stepForward}
              onStepBackward={playback.stepBackward}
            />
            <ImportMap onImport={handleImport} />
            <OSMImport onLoad={handleOSMLoad} />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-black/15 p-2 text-black/40 dark:border-white/15 dark:text-white/40">
            <GraphRenderer
              nodes={mapNodes}
              edges={mapEdges}
              source={source}
              destination={destination}
              selected={selected}
              visited={playback.step?.visited ?? []}
              currentNode={playback.step?.nodeId ?? null}
              queueNodes={playback.step?.queue ?? []}
              pathNodes={playback.step ? (playback.step.type === "finish" ? playback.step.path ?? [] : []) : []}
              animationStep={playback.step}
              onSelectNode={setSelected}
              onSetSource={setSource}
              onSetDestination={setDestination}
            />
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 border-l border-black/10 p-4 xl:block dark:border-white/10">
          <div className="flex h-full flex-col gap-4 overflow-y-auto">
            <h3 className="text-sm font-semibold">Details</h3>
            <LiveStatsPanel
              step={playback.step}
              status={playback.status}
              currentIndex={playback.currentIndex}
              totalSteps={playback.steps.length}
            />
          </div>
        </aside>
      </div>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 border-r border-black/10 bg-background p-4 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Navigation</span>
              <button
                type="button"
                aria-label="Close navigation"
                className="rounded p-1 text-lg leading-none hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setMobileNavOpen(false)}
              >
                &times;
              </button>
            </div>
            <ControlPanel
              source={source}
              destination={destination}
              speed={speed}
              map={mapId}
              maps={SAMPLE_MAPS.map((m) => ({ id: m.id, name: m.name }))}
              onSourceChange={setSource}
              onDestinationChange={setDestination}
              onSpeedChange={setSpeed}
              onMapChange={setMapId}
              onPlay={playback.play}
              onPause={playback.pause}
              onResume={playback.resume}
              onReset={playback.reset}
              onStepForward={playback.stepForward}
              onStepBackward={playback.stepBackward}
            />
            <ImportMap onImport={handleImport} />
            <OSMImport onLoad={handleOSMLoad} />
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-4 dark:border-white/10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          className="rounded p-1 text-xl leading-none hover:bg-black/5 lg:hidden dark:hover:bg-white/10"
          onClick={onMenuClick}
        >
          &#9776;
        </button>
        <span className="text-base font-semibold">EAF</span>
      </div>

      <ThemeTogglePlaceholder />
    </header>
  );
}

function ThemeTogglePlaceholder() {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="rounded-full border border-black/10 px-3 py-1 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
    >
      Theme
    </button>
  );
}
