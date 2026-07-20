import { Graph } from "@/lib/graph";
import { MapSystem, cellToNode, type Cell } from "./MapSystem";

export interface MapToGraphOptions {
  diagonals?: boolean;
}

const ORTHOGONAL: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const DIAGONAL: Array<[number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function mapToGraph(
  map: MapSystem,
  options: MapToGraphOptions = {},
): Graph {
  const { diagonals = false } = options;
  const graph = new Graph();
  const directions = diagonals ? [...ORTHOGONAL, ...DIAGONAL] : ORTHOGONAL;

  for (const cell of map.getCells()) {
    if (!cell.passable) continue;
    graph.addNode(cellToNode(cell));
  }

  for (const cell of map.getCells()) {
    if (!cell.passable) continue;
    const sourceId = MapSystem.key(cell.row, cell.col);
    for (const [dr, dc] of directions) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      if (!map.inBounds(nr, nc)) continue;
      const neighbor = map.getCell(nr, nc);
      if (!neighbor || !neighbor.passable) continue;
      const weight = neighbor.weight;
      if (!Number.isFinite(weight)) continue;
      graph.addEdge(sourceId, MapSystem.key(nr, nc), weight);
    }
  }

  return graph;
}

export function neighbors(map: MapSystem, cell: Cell): Cell[] {
  const result: Cell[] = [];
  for (const [dr, dc] of ORTHOGONAL) {
    const neighbor = map.getCell(cell.row + dr, cell.col + dc);
    if (neighbor) result.push(neighbor);
  }
  return result;
}
