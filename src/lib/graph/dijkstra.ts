import { Graph } from "./Graph";
import { PriorityQueue } from "./PriorityQueue";

export interface DijkstraResult {
  distances: Map<string, number>;
  previous: Map<string, string | null>;
  path: string[];
}

export function dijkstra(graph: Graph, source: string, target?: string): DijkstraResult {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const queue = new PriorityQueue<string>();

  for (const node of graph.getNodes()) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }

  distances.set(source, 0);
  queue.enqueue(source, 0);

  while (!queue.isEmpty()) {
    const current = queue.dequeue()!;
    
    if (visited.has(current)) continue;
    visited.add(current);

    if (target && current === target) break;

    const currentDistance = distances.get(current)!;

    for (const edge of graph.getNeighbors(current)) {
      const neighbor = edge.target;
      if (visited.has(neighbor)) continue;

      const newDistance = currentDistance + edge.weight;
      if (newDistance < distances.get(neighbor)!) {
        distances.set(neighbor, newDistance);
        previous.set(neighbor, current);
        queue.enqueue(neighbor, newDistance);
      }
    }
  }

  const path: string[] = [];
  if (target) {
    let current: string | null = target;
    if (distances.get(target) !== Infinity) {
      while (current !== null) {
        path.unshift(current);
        current = previous.get(current) ?? null;
      }
    }
  }

  return { distances, previous, path };
}

export function getShortestPath(graph: Graph, source: string, target: string): string[] {
  const { path } = dijkstra(graph, source, target);
  return path;
}

export function getShortestDistance(graph: Graph, source: string, target: string): number {
  const { distances } = dijkstra(graph, source, target);
  return distances.get(target) ?? Infinity;
}