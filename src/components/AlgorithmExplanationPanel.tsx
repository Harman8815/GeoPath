"use client";

import { useMemo } from "react";
import type { AnimationStep, AnimationStepType, PlaybackStatus } from "@/hooks/useAnimationPlayback";

export interface AlgorithmExplanationPanelProps {
  step: AnimationStep | null;
  status: PlaybackStatus;
}

const PSEUDOCODE: Array<{ key: string; lines: string[] }> = [
  {
    key: "init",
    lines: [
      "function dijkstra(graph, source, target):",
      "  distances[all nodes] ← ∞",
      "  previous[all nodes] ← null",
      "  distances[source] ← 0",
      "  queue ← empty priority queue",
      "  enqueue(queue, source, 0)",
    ],
  },
  {
    key: "loop",
    lines: [
      "  while queue is not empty:",
      "    current ← dequeue(queue)",
    ],
  },
  {
    key: "visit",
    lines: [
      "    if current already visited:",
      "      continue",
      "    visited.add(current)",
    ],
  },
  {
    key: "neighbor",
    lines: [
      "    for each neighbor of current:",
      "      if neighbor already visited:",
      "        continue",
    ],
  },
  {
    key: "relax",
    lines: [
      "      newDistance ← distances[current] + weight",
      "      if newDistance < distances[neighbor]:",
      "        distances[neighbor] ← newDistance",
      "        previous[neighbor] ← current",
      "        enqueue(queue, neighbor, newDistance)",
    ],
  },
  {
    key: "finish",
    lines: [
      "  return distances, previous",
    ],
  },
];

const STEP_EXPLANATIONS: Record<AnimationStepType, string> = {
  init: "Initialize all distances to infinity and set the source distance to 0. Add the source node to the priority queue.",
  visit: "Remove the node with the smallest distance from the priority queue and mark it as visited.",
  neighbor: "Examine each neighbor of the current node to see if a shorter path exists.",
  relax: "Update the neighbor's distance if a shorter path is found through the current node, then reinsert it into the queue.",
  queue: "The priority queue now contains frontier nodes ordered by their current shortest distance.",
  finish: "Dijkstra's algorithm has completed. The shortest distances and predecessor map are ready.",
};

export default function AlgorithmExplanationPanel({ step, status }: AlgorithmExplanationPanelProps) {
  const activeType: AnimationStepType | null = step?.type ?? null;
  const activeLines = useMemo(() => {
    if (!step || status === "idle") return new Set<number>();
    const lines = new Set<number>();
    const type = step.type;
    if (type === "init") {
      lines.add(0);
      lines.add(1);
      lines.add(2);
      lines.add(3);
      lines.add(4);
      lines.add(5);
    } else if (type === "visit") {
      lines.add(6);
      lines.add(7);
      lines.add(8);
      lines.add(9);
    } else if (type === "neighbor") {
      lines.add(10);
      lines.add(11);
      lines.add(12);
    } else if (type === "relax") {
      lines.add(13);
      lines.add(14);
      lines.add(15);
      lines.add(16);
      lines.add(17);
    } else if (type === "queue") {
      lines.add(6);
      lines.add(7);
      lines.add(8);
      lines.add(9);
    } else if (type === "finish") {
      lines.add(18);
    }
    return lines;
  }, [step, status]);

  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="text-sm font-semibold">Algorithm Explanation</h3>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Pseudocode</span>
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-black/5 p-3 font-mono text-xs leading-relaxed dark:border-white/10 dark:bg-white/5">
            {PSEUDOCODE.map((block) => (
              <div key={block.key}>
                {block.lines.map((line, idx) => {
                  const globalIndex = PSEUDOCODE
                    .slice(0, PSEUDOCODE.indexOf(block))
                    .reduce((sum, b) => sum + b.lines.length, 0) + idx;
                  const isActive = activeLines.has(globalIndex);
                  return (
                    <div
                      key={globalIndex}
                      className={cn(
                        "whitespace-pre",
                        isActive ? "bg-foreground/10 font-semibold" : "text-black/70 dark:text-white/70",
                      )}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">What&apos;s happening</span>
          <p className="text-sm leading-relaxed">
            {status === "idle"
              ? "Press Play or Step Forward to start the algorithm."
              : STEP_EXPLANATIONS[activeType ?? "init"]}
          </p>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
