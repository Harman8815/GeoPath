import { Graph } from "./Graph";
import { PriorityQueue } from "./PriorityQueue";

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
  queueItems: Array<{ item: string; priority: number }>;
  visited: string[];
  description: string;
  path?: string[];
  exploredEdges: Array<{ source: string; target: string }>;
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
  if (!source) {
    return;
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const queue = new PriorityQueue<string>();
  const visitedOrder: string[] = [];
  const exploredEdges: Array<{ source: string; target: string }> = [];

  for (const node of graph.getNodes()) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }

  distances.set(source, 0);
  queue.enqueue(source, 0);

  yield {
    type: "init",
    nodeId: source,
    distances: new Map(distances),
    previous: new Map(previous),
    queue: [source],
    queueItems: [{ item: source, priority: 0 }],
    visited: [],
    description: `Initialize distances. Source ${source} = 0`,
    exploredEdges: [],
  };

  while (!queue.isEmpty()) {
    const current = queue.dequeue()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);
    visitedOrder.push(current);

    yield {
      type: "visit",
      nodeId: current,
      distances: new Map(distances),
      previous: new Map(previous),
      queue: Array.from(queue.size ? [] : []),
      queueItems: [],
      visited: [...visitedOrder],
      description: `Visit node ${current} with distance ${distances.get(current)}`,
      exploredEdges: [...exploredEdges],
    };

    if (target && current === target) {
      break;
    }

    const currentDistance = distances.get(current)!;

    for (const edge of graph.getNeighbors(current)) {
      const neighbor = edge.target;

      if (visited.has(neighbor)) {
        continue;
      }

      const newDistance = currentDistance + edge.weight;

      if (newDistance < distances.get(neighbor)!) {
        distances.set(neighbor, newDistance);
        previous.set(neighbor, current);

        queue.enqueue(neighbor, newDistance);
        exploredEdges.push({ source: edge.source, target: edge.target });

        yield {
          type: "relax",
          nodeId: current,
          edge: { source: edge.source, target: edge.target, weight: edge.weight },
          distances: new Map(distances),
          previous: new Map(previous),
          queue: [],
          queueItems: [],
          visited: [...visitedOrder],
          description: `Relax edge ${edge.source}->${edge.target}: new distance to ${neighbor} = ${newDistance}`,
          exploredEdges: [...exploredEdges],
        };
      }
    }
  }

  yield {
    type: "finish",
    nodeId: target ?? source,
    distances: new Map(distances),
    previous: new Map(previous),
    queue: [],
    queueItems: [],
    visited: visitedOrder,
    description: `Dijkstra completed`,
    path: target ? reconstructPath(previous, target) : [],
    exploredEdges: [...exploredEdges],
  };
}
