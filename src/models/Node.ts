import type { Edge } from './Edge';

export interface Neighbor {
  edgeId: string;
  nodeId: number;
  weight: number;
}

export class Node {
  readonly id: number;
  readonly latitude: number;
  readonly longitude: number;
  private neighbors: Map<string, Neighbor>;
  visited: boolean;
  distanceFromStart: number;
  distanceToEnd: number;
  parent: number | null;
  referer: number | null;

  constructor(id: number, latitude: number, longitude: number) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.neighbors = new Map();
    this.visited = false;
    this.distanceFromStart = 0;
    this.distanceToEnd = 0;
    this.parent = null;
    this.referer = null;
  }

  get totalDistance(): number {
    return this.distanceFromStart + this.distanceToEnd;
  }

  getNeighbors(): Neighbor[] {
    return Array.from(this.neighbors.values());
  }

  addNeighbor(edgeId: string, nodeId: number, weight: number): void {
    this.neighbors.set(edgeId, { edgeId, nodeId, weight });
  }

  reset(): void {
    this.visited = false;
    this.distanceFromStart = 0;
    this.distanceToEnd = 0;
    this.parent = null;
    this.referer = null;
  }

  toJSON() {
    return {
      id: this.id,
      latitude: this.latitude,
      longitude: this.longitude,
      visited: this.visited,
      distanceFromStart: this.distanceFromStart,
      distanceToEnd: this.distanceToEnd,
      parent: this.parent,
    };
  }
}
