import type { Node } from './Node';

export class Edge {
  readonly node1Id: number;
  readonly node2Id: number;
  private _weight: number;
  visited: boolean;

  constructor(node1Id: number, node2Id: number, weight: number) {
    this.node1Id = node1Id;
    this.node2Id = node2Id;
    this._weight = weight;
    this.visited = false;
  }

  getOtherNodeId(nodeId: number): number {
    return nodeId === this.node1Id ? this.node2Id : this.node1Id;
  }

  get weight(): number {
    return this._weight;
  }

  reset(): void {
    this.visited = false;
  }
}
