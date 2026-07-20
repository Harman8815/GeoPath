import { Graph } from "./Graph";
import type { EdgeModel, NodeModel } from "./types";

export interface CityGeneratorOptions {
  rows?: number;
  cols?: number;
  mainRoadEvery?: number;
  sideStreetChance?: number;
  minWeight?: number;
  maxWeight?: number;
  seed?: number;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

export function generateCityGraph(
  options: CityGeneratorOptions = {},
): Graph {
  const rows = options.rows ?? 12;
  const cols = options.cols ?? 12;
  const mainRoadEvery = options.mainRoadEvery ?? 3;
  const sideStreetChance = options.sideStreetChance ?? 0.5;
  const minWeight = options.minWeight ?? 1;
  const maxWeight = options.maxWeight ?? 10;
  const rng = createRng(options.seed ?? Date.now());

  const isMain = (index: number) => index % mainRoadEvery === 0;
  const weight = () => Math.round(minWeight + rng() * (maxWeight - minWeight));
  const id = (r: number, c: number) => `n-${r}-${c}`;

  const graph = new Graph();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const node: NodeModel = {
        id: id(r, c),
        label: `${r},${c}`,
        x: c,
        y: r,
      };
      graph.addNode(node);
    }
  }

  const edges: EdgeModel[] = [];
  const addEdge = (r1: number, c1: number, r2: number, c2: number) => {
    const main = isMain(r1) || isMain(c1) || isMain(r2) || isMain(c2);
    const w = main ? weight() : weight() + 2;
    edges.push({ source: id(r1, c1), target: id(r2, c2), weight: w });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) addEdge(r, c, r, c + 1);
      if (r + 1 < rows) addEdge(r, c, r + 1, c);

      const main = isMain(r) && isMain(c);
      if (main && c + 1 < cols && rng() < sideStreetChance) {
        addEdge(r, c, r, c + 1);
      }
      if (main && r + 1 < rows && rng() < sideStreetChance) {
        addEdge(r, c, r + 1, c);
      }
    }
  }

  for (const edge of edges) {
    graph.addEdge(edge.source, edge.target, edge.weight);
  }

  return graph;
}
