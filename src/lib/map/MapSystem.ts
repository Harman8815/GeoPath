import type { NodeModel } from "@/lib/graph/types";

export type TerrainType = "plain" | "wall" | "water" | "rough" | "road";

export interface Cell {
  row: number;
  col: number;
  terrain: TerrainType;
  weight: number;
  passable: boolean;
}

export interface MapData {
  rows: number;
  cols: number;
  cells: Cell[];
}

export const TERRAIN_WEIGHTS: Record<TerrainType, number> = {
  plain: 1,
  road: 1,
  rough: 3,
  water: 5,
  wall: Infinity,
};

export const TERRAIN_PASSABLE: Record<TerrainType, boolean> = {
  plain: true,
  road: true,
  rough: true,
  water: true,
  wall: false,
};

export interface MapSystemOptions {
  rows: number;
  cols: number;
  terrain?: (row: number, col: number) => TerrainType;
}

export class MapSystem {
  readonly rows: number;
  readonly cols: number;
  private cells: Map<string, Cell> = new Map();

  constructor(options: MapSystemOptions) {
    this.rows = options.rows;
    this.cols = options.cols;
    const terrain =
      options.terrain ?? (() => "plain" as TerrainType);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = terrain(r, c);
        const cell: Cell = {
          row: r,
          col: c,
          terrain: t,
          weight: TERRAIN_WEIGHTS[t],
          passable: TERRAIN_PASSABLE[t],
        };
        this.cells.set(this.key(r, c), cell);
      }
    }
  }

  static key(row: number, col: number): string {
    return `${row}-${col}`;
  }

  private key(row: number, col: number): string {
    return MapSystem.key(row, col);
  }

  getCell(row: number, col: number): Cell | undefined {
    return this.cells.get(this.key(row, col));
  }

  getCells(): Cell[] {
    return Array.from(this.cells.values());
  }

  setTerrain(row: number, col: number, terrain: TerrainType): void {
    const cell = this.cells.get(this.key(row, col));
    if (!cell) return;
    cell.terrain = terrain;
    cell.weight = TERRAIN_WEIGHTS[terrain];
    cell.passable = TERRAIN_PASSABLE[terrain];
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  toData(): MapData {
    return {
      rows: this.rows,
      cols: this.cols,
      cells: this.getCells().map((cell) => ({ ...cell })),
    };
  }

  static fromData(data: MapData): MapSystem {
    const map = new MapSystem({ rows: data.rows, cols: data.cols });
    for (const cell of data.cells) {
      map.setTerrain(cell.row, cell.col, cell.terrain);
    }
    return map;
  }
}

export function cellToNode(cell: Cell): NodeModel {
  return {
    id: MapSystem.key(cell.row, cell.col),
    label: MapSystem.key(cell.row, cell.col),
    x: cell.col,
    y: cell.row,
  };
}
