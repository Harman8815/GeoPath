"use client";

import { useState } from "react";
import { cn } from "@/utils";
import ControlPanel from "./ControlPanel";
import GraphRenderer from "./GraphRenderer";
import type { EdgeModel, NodeModel } from "@/lib/graph";

const sampleNodes: NodeModel[] = [
  { id: "A", label: "A" },
  { id: "B", label: "B" },
  { id: "C", label: "C" },
  { id: "D", label: "D" },
  { id: "E", label: "E" },
  { id: "F", label: "F" },
  { id: "G", label: "G" },
];

const sampleEdges: EdgeModel[] = [
  { source: "A", target: "B", weight: 4 },
  { source: "A", target: "C", weight: 2 },
  { source: "B", target: "D", weight: 5 },
  { source: "C", target: "D", weight: 1 },
  { source: "C", target: "E", weight: 8 },
  { source: "D", target: "F", weight: 3 },
  { source: "E", target: "F", weight: 2 },
  { source: "F", target: "G", weight: 6 },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [source, setSource] = useState("A");
  const [destination, setDestination] = useState("G");
  const [speed, setSpeed] = useState(1);

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
              onSourceChange={setSource}
              onDestinationChange={setDestination}
              onSpeedChange={setSpeed}
            />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-black/15 p-2 text-black/40 dark:border-white/15 dark:text-white/40">
            <GraphRenderer nodes={sampleNodes} edges={sampleEdges} />
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 border-l border-black/10 p-4 xl:block dark:border-white/10">
          <div className="flex h-full flex-col gap-4 overflow-y-auto">
            <h3 className="text-sm font-semibold">Details</h3>
            <PanelPlaceholder label="Right Sidebar" />
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
              onSourceChange={setSource}
              onDestinationChange={setDestination}
              onSpeedChange={setSpeed}
            />
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

function PanelPlaceholder({ label }: { label: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-black/15 text-sm text-black/40 dark:border-white/15 dark:text-white/40",
      )}
    >
      {label}
    </div>
  );
}
