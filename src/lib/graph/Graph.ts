import type { EdgeModel, GraphData, NodeModel } from "./types";

export class Graph {
  private nodes = new Map<string, NodeModel>();
  private adjacency = new Map<string, Array<EdgeModel>>();

  addNode(node: NodeModel): void {
    if (this.nodes.has(node.id)) return;
    this.nodes.set(node.id, node);
    this.adjacency.set(node.id, []);
  }

  addEdge(source: string, target: string, weight: number): void {
    if (!this.nodes.has(source)) this.addNode({ id: source });
    if (!this.nodes.has(target)) this.addNode({ id: target });
    this.adjacency.get(source)!.push({ source, target, weight });
  }

  getNode(id: string): NodeModel | undefined {
    return this.nodes.get(id);
  }

  getNodes(): NodeModel[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): EdgeModel[] {
    return this.getNodes().flatMap((node) => this.adjacency.get(node.id) ?? []);
  }

  getNeighbors(id: string): Array<EdgeModel> {
    return this.adjacency.get(id) ?? [];
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.getEdges().length;
  }

  toData(): GraphData {
    return {
      nodes: this.getNodes(),
      edges: this.getEdges(),
    };
  }

  static fromData(data: GraphData): Graph {
    const graph = new Graph();
    for (const node of data.nodes) graph.addNode(node);
    for (const edge of data.edges) {
      graph.addEdge(edge.source, edge.target, edge.weight);
    }
    return graph;
  }
}
