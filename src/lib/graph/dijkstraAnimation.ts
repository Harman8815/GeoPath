import { Graph } from "./Graph";
import { PriorityQueue } from "./PriorityQueue";

export type AnimationStepType = "visit" | "relax" | "finish";

export interface AnimationStep {
  type: AnimationStepType;
  nodeId: string;
  newEdge?: { source: string; target: string };
  visitedCount: number;
  exploredCount: number;
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
  if (!source) {
    return;
  }

  const visitedSet = new Set<string>();
  const previous = new Map<string, string | null>();
  const distances = new Map<string, number>();
  const queue = new PriorityQueue<string>();
  const exploredEdges: Array<{ source: string; target: string }> = [];

  for (const node of graph.getNodes()) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }

  distances.set(source, 0);
  queue.enqueue(source, 0);

  yield {
    type: "visit",
    nodeId: source,
    visitedCount: 1,
    exploredCount: 0,
    description: `Initialize: source ${source} = 0`,
  };

  while (!queue.isEmpty()) {
    const current = queue.dequeue()!;

    if (visitedSet.has(current)) {
      continue;
    }

    visitedSet.add(current);

    yield {
      type: "visit",
      nodeId: current,
      visitedCount: visitedSet.size,
      exploredCount: exploredEdges.length,
      description: `Visit node ${current} with distance ${distances.get(current)}`,
    };

    if (target && current === target) {
      break;
    }

    const currentDistance = distances.get(current)!;

    for (const edge of graph.getNeighbors(current)) {
      const neighbor = edge.target;

      if (visitedSet.has(neighbor)) {
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
          newEdge: { source: edge.source, target: edge.target },
          visitedCount: visitedSet.size,
          exploredCount: exploredEdges.length,
          description: `Explore edge ${edge.source}->${edge.target}: new distance to ${neighbor} = ${newDistance}`,
        };
      }
    }
  }

  yield {
    type: "finish",
    nodeId: target ?? source,
    visitedCount: visitedSet.size,
    exploredCount: exploredEdges.length,
    description: `Dijkstra completed`,
    path: target ? reconstructPath(previous, target) : [],
  };
}
