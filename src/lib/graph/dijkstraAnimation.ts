import { Graph } from "./Graph";
import { PriorityQueue } from "./PriorityQueue";
import type { EdgeModel, NodeModel } from "./types";

export type AnimationStepType =
  | "init"
  | "visit"
  | "neighbor"
  | "relax"
  | "queue"
  | "finish";

export interface AnimationStep {
  type: AnimationStepType;
  nodeId: string;
  edge?: { source: string; target: string; weight: number };
  distances: Map<string, number>;
  previous: Map<string, string | null>;
  queue: string[];
  visited: string[];
  description: string;
  path?: string[];
}

function reconstructPath(previous: Map<string, string | null>, target: string): string[] {
  const path: string[] = [];
  let current: string | null = target;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }
  return path;
}

export function* dijkstraAnimation(
  graph: Graph,
  source: string,
  target?: string,
): Generator<AnimationStep, void, unknown> {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const queue = new PriorityQueue<string>();
  const queueItems: Array<{ item: string; priority: number }> = [];

  for (const node of graph.getNodes()) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }

  distances.set(source, 0);
  queue.enqueue(source, 0);
  queueItems.push({ item: source, priority: 0 });

  yield {
    type: "init",
    nodeId: source,
    distances: new Map(distances),
    previous: new Map(previous),
    queue: queueItems.map((q) => q.item),
    visited: Array.from(visited),
    description: `Initialize distances. Source ${source} = 0`,
  };

  while (!queue.isEmpty()) {
    const current = queue.dequeue()!;
    queueItems.shift();

    if (visited.has(current)) {
      yield {
        type: "queue",
        nodeId: current,
        distances: new Map(distances),
        previous: new Map(previous),
        queue: queueItems.map((q) => q.item),
        visited: Array.from(visited),
        description: `Skip already visited ${current}`,
      };
      continue;
    }

    visited.add(current);

    yield {
      type: "visit",
      nodeId: current,
      distances: new Map(distances),
      previous: new Map(previous),
      queue: queueItems.map((q) => q.item),
      visited: Array.from(visited),
      description: `Visit node ${current} with distance ${distances.get(current)}`,
    };

    if (target && current === target) {
      break;
    }

    const currentDistance = distances.get(current)!;

    for (const edge of graph.getNeighbors(current)) {
      const neighbor = edge.target;

      yield {
        type: "neighbor",
        nodeId: current,
        edge: { source: edge.source, target: edge.target, weight: edge.weight },
        distances: new Map(distances),
        previous: new Map(previous),
        queue: queueItems.map((q) => q.item),
        visited: Array.from(visited),
        description: `Explore neighbor ${neighbor} from ${current}`,
      };

      if (visited.has(neighbor)) {
        continue;
      }

      const newDistance = currentDistance + edge.weight;

      if (newDistance < distances.get(neighbor)!) {
        distances.set(neighbor, newDistance);
        previous.set(neighbor, current);

        queue.enqueue(neighbor, newDistance);
        queueItems.push({ item: neighbor, priority: newDistance });
        queueItems.sort((a, b) => a.priority - b.priority);

        yield {
          type: "relax",
          nodeId: current,
          edge: { source: edge.source, target: edge.target, weight: edge.weight },
          distances: new Map(distances),
          previous: new Map(previous),
          queue: queueItems.map((q) => q.item),
          visited: Array.from(visited),
          description: `Relax edge ${edge.source}->${edge.target}: new distance to ${neighbor} = ${newDistance}`,
        };
      }
    }

    yield {
      type: "queue",
      nodeId: current,
      distances: new Map(distances),
      previous: new Map(previous),
      queue: queueItems.map((q) => q.item),
      visited: Array.from(visited),
      description: `Queue now: [${queueItems.map((q) => `${q.item}:${q.priority}`).join(", ")}]`,
    };
  }

  yield {
    type: "finish",
    nodeId: target ?? source,
    distances: new Map(distances),
    previous: new Map(previous),
    queue: [],
    visited: Array.from(visited),
    description: `Dijkstra completed`,
    path: target ? reconstructPath(previous, target) : [],
  };
}