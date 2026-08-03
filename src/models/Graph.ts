import { Node } from './Node';
import { Edge } from './Edge';
import type { GraphData, NodeData, EdgeData } from '../types';

export class Graph {
  private nodes: Map<number, Node>;
  private edges: Map<string, Edge>;
  startNodeId: number | null;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.startNodeId = null;
  }

  getNode(id: number): Node | undefined {
    return this.nodes.get(id);
  }

  addNode(id: number, latitude: number, longitude: number): Node {
    const node = new Node(id, latitude, longitude);
    this.nodes.set(id, node);
    return node;
  }

  addEdge(node1Id: number, node2Id: number): void {
    const node1 = this.nodes.get(node1Id);
    const node2 = this.nodes.get(node2Id);
    
    if (!node1 || !node2) {
      return;
    }

    const weight = this.calculateDistance(node1, node2);
    const edgeId = this.getEdgeId(node1Id, node2Id);
    const edge = new Edge(node1Id, node2Id, weight);
    
    this.edges.set(edgeId, edge);
    node1.addNeighbor(edgeId, node2Id, weight);
    node2.addNeighbor(edgeId, node1Id, weight);
  }

  getEdge(node1Id: number, node2Id: number): Edge | undefined {
    return this.edges.get(this.getEdgeId(node1Id, node2Id));
  }

  reset(): void {
    for (const node of this.nodes.values()) {
      node.reset();
    }
    for (const edge of this.edges.values()) {
      edge.reset();
    }
  }

  getNodes(): Map<number, Node> {
    return this.nodes;
  }

  getEdges(): Map<string, Edge> {
    return this.edges;
  }

  toJSON(): GraphData {
    const nodesData = new Map<number, NodeData>();
    for (const [id, node] of this.nodes) {
      nodesData.set(id, {
        id: node.id,
        latitude: node.latitude,
        longitude: node.longitude,
      });
    }

    const edgesData: EdgeData[] = [];
    for (const edge of this.edges.values()) {
      edgesData.push({
        from: edge.node1Id,
        to: edge.node2Id,
        weight: edge.weight,
      });
    }

    return {
      nodes: nodesData,
      edges: edgesData,
      startNodeId: this.startNodeId || 0,
    };
  }

  private calculateDistance(node1: Node, node2: Node): number {
    return Math.hypot(
      node1.longitude - node2.longitude,
      node1.latitude - node2.latitude
    );
  }

  private getEdgeId(node1Id: number, node2Id: number): string {
    return [node1Id, node2Id].sort((a, b) => a - b).join('-');
  }
}
