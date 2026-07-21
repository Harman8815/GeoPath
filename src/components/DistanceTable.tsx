"use client";

import { useMemo } from "react";
import type { AnimationStep } from "@/hooks/useAnimationPlayback";

export interface DistanceTableProps {
  step: AnimationStep | null;
}

export default function DistanceTable({ step }: DistanceTableProps) {
  const rows = useMemo(() => {
    if (!step) return [];
    const entries = Array.from(step.distances.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    return entries.map(([nodeId, distance]) => ({
      nodeId,
      distance,
      previous: step.previous.get(nodeId) ?? null,
      visited: step.visited.includes(nodeId),
    }));
  }, [step]);

  return (
    <div className="flex h-full flex-col gap-3">
      <h3 className="text-sm font-semibold">Distance Table</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="pb-2 pr-3 font-medium text-black/60 dark:text-white/60">Node</th>
              <th className="pb-2 pr-3 font-medium text-black/60 dark:text-white/60">Distance</th>
              <th className="pb-2 pr-3 font-medium text-black/60 dark:text-white/60">Previous</th>
              <th className="pb-2 font-medium text-black/60 dark:text-white/60">Visited</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.nodeId}
                className="border-b border-black/5 dark:border-white/5 last:border-0"
              >
                <td className="py-1.5 pr-3 font-medium">{row.nodeId}</td>
                <td className="py-1.5 pr-3 tabular-nums">{formatDistance(row.distance)}</td>
                <td className="py-1.5 pr-3">{row.previous ?? "—"}</td>
                <td className="py-1.5">
                  {row.visited ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-black/50 dark:bg-white/10 dark:text-white/50">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDistance(distance: number): string {
  if (distance === Infinity) return "∞";
  return String(distance);
}
