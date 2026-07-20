import { Graph } from "./Graph";
import type { EdgeModel, NodeModel } from "./types";

export interface SampleMap {
  id: string;
  name: string;
  description: string;
  build: () => Graph;
}

function grid(rows: number, cols: number, weightFn: (r: number, c: number) => number): Graph {
  const graph = new Graph();
  const id = (r: number, c: number) => `n-${r}-${c}`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const node: NodeModel = { id: id(r, c), label: `${r},${c}`, x: c, y: r };
      graph.addNode(node);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) graph.addEdge(id(r, c), id(r, c + 1), weightFn(r, c + 1));
      if (r + 1 < rows) graph.addEdge(id(r, c), id(r + 1, c), weightFn(r + 1, c));
    }
  }
  return graph;
}

export const SAMPLE_MAPS: SampleMap[] = [
  {
    id: "small-town",
    name: "Small Town",
    description: "A compact 6x6 settlement with a single main road.",
    build: () =>
      grid(6, 6, (r, c) => (r === 2 || c === 3 ? 1 : 3)),
  },
  {
    id: "grid-city",
    name: "Grid City",
    description: "A regular 12x12 city block grid with uniform roads.",
    build: () => grid(12, 12, () => 2),
  },
  {
    id: "downtown",
    name: "Downtown",
    description: "A dense 14x14 core with avenues and pricey side streets.",
    build: () =>
      grid(14, 14, (r, c) => {
        const main = r % 3 === 0 || c % 3 === 0;
        return main ? 1 + ((r + c) % 3) : 4 + ((r * c) % 6);
      }),
  },
  {
    id: "campus",
    name: "Campus",
    description: "An 10x10 campus with clustered quads and winding paths.",
    build: () =>
      grid(10, 10, (r, c) => {
        const quad = Math.floor(r / 3) === Math.floor(c / 3);
        return quad ? 1 : 5;
      }),
  },
];

export function getSampleMap(id: string): SampleMap | undefined {
  return SAMPLE_MAPS.find((map) => map.id === id);
}

export function buildSampleMap(id: string): Graph {
  const map = getSampleMap(id) ?? SAMPLE_MAPS[0];
  return map.build();
}

export function sampleMapEdges(id: string): EdgeModel[] {
  return buildSampleMap(id).getEdges();
}

export function sampleMapNodes(id: string): NodeModel[] {
  return buildSampleMap(id).getNodes();
}
