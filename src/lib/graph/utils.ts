import { Graph } from "./Graph";
import type { EdgeModel, GraphData, NodeModel } from "./types";

export function createEmptyGraph(): Graph {
  return new Graph();
}

export function getNodeIds(graph: Graph): string[] {
  return graph.getNodes().map((node) => node.id);
}

export function getEdgeKey(edge: EdgeModel): string {
  return `${edge.source}->${edge.target}`;
}

export function findNodeById(
  data: GraphData,
  id: string,
): NodeModel | undefined {
  return data.nodes.find((node) => node.id === id);
}

export function totalWeight(edges: EdgeModel[]): number {
  return edges.reduce((sum, edge) => sum + edge.weight, 0);
}

export function cloneGraphData(data: GraphData): GraphData {
  return {
    nodes: data.nodes.map((node) => ({ ...node })),
    edges: data.edges.map((edge) => ({ ...edge })),
  };
}

export function buildGridGraph(
  rows: number,
  cols: number,
  weight = 1,
): Graph {
  const graph = new Graph();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `${r}-${c}`;
      graph.addNode({ id, label: id, x: c, y: r });
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `${r}-${c}`;
      if (c + 1 < cols) graph.addEdge(id, `${r}-${c + 1}`, weight);
      if (r + 1 < rows) graph.addEdge(id, `${r + 1}-${c}`, weight);
    }
  }
  return graph;
}
