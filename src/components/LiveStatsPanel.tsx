"use client";

import { useMemo } from "react";
import type { AnimationStep, PlaybackStatus } from "@/hooks/useAnimationPlayback";

export interface LiveStatsPanelProps {
  step: AnimationStep | null;
  status: PlaybackStatus;
  currentIndex: number;
  totalSteps: number;
}

export default function LiveStatsPanel({
  step,
  status,
  currentIndex,
  totalSteps,
}: LiveStatsPanelProps) {
  const currentDistance = useMemo(() => {
    if (!step) return null;
    const d = step.distances.get(step.nodeId);
    return d ?? null;
  }, [step]);

  const progress = useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  }, [currentIndex, totalSteps]);

  const ops = currentIndex + 1;

  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="text-sm font-semibold">Live Statistics</h3>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Current Node" value={step?.nodeId ?? "—"} />
        <Stat label="Queue Size" value={String(step?.queue.length ?? 0)} />
        <Stat label="Nodes Visited" value={String(step?.visited.length ?? 0)} />
        <Stat label="Distance" value={formatDistance(currentDistance)} />
        <Stat label="Operations" value={String(ops)} />
        <Stat label="Status" value={formatStatus(status)} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-black/60 dark:text-white/60">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Description</span>
          <p className="text-sm leading-relaxed">{step.description}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-black/60 dark:text-white/60">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function formatDistance(d: number | null): string {
  if (d === null) return "—";
  if (d === Infinity) return "∞";
  return String(d);
}

function formatStatus(status: PlaybackStatus): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "playing":
      return "Running";
    case "paused":
      return "Paused";
    case "finished":
      return "Finished";
  }
}
