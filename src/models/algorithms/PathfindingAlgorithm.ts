import type { Node } from '../Node';
import type { Graph } from '../Graph';
import type { AnimationStep, AlgorithmType } from '../../types';

export abstract class PathfindingAlgorithm {
  protected graph: Graph;
  protected startNodeId: number;
  protected endNodeId: number;
  protected finished: boolean;
  protected visited: Set<number>;
  protected updatedNodes: AnimationStep[];

  constructor(graph: Graph) {
    this.graph = graph;
    this.startNodeId = 0;
    this.endNodeId = 0;
    this.finished = false;
    this.visited = new Set();
    this.updatedNodes = [];
  }

  abstract start(startNodeId: number, endNodeId: number): void;
  abstract nextStep(): AnimationStep[];

  protected getNode(nodeId: number): Node | undefined {
    return this.graph.getNode(nodeId);
  }

  protected calculateHeuristic(nodeId: number): number {
    const node = this.getNode(nodeId);
    const endNode = this.getNode(this.endNodeId);
    
    if (!node || !endNode) return 0;
    
    return Math.hypot(
      node.longitude - endNode.longitude,
      node.latitude - endNode.latitude
    );
  }

  protected calculateDistance(nodeId1: number, nodeId2: number): number {
    const node1 = this.getNode(nodeId1);
    const node2 = this.getNode(nodeId2);
    
    if (!node1 || !node2) return 0;
    
    return Math.hypot(
      node1.longitude - node2.longitude,
      node1.latitude - node2.latitude
    );
  }

  protected markVisited(nodeId: number): void {
    this.visited.add(nodeId);
    const node = this.getNode(nodeId);
    if (node) {
      node.visited = true;
    }
  }

  protected updateNode(nodeId: number, parent: number | null, distanceFromStart: number, distanceToEnd: number): void {
    const node = this.getNode(nodeId);
    if (node) {
      node.parent = parent;
      node.distanceFromStart = distanceFromStart;
      node.distanceToEnd = distanceToEnd;
    }
    
    this.updatedNodes.push({
      nodeId,
      visited: this.visited.has(nodeId),
      parent,
      distanceFromStart,
      distanceToEnd,
    });
  }

  isFinished(): boolean {
    return this.finished;
  }

  getAlgorithmType(): AlgorithmType {
    return 'astar';
  }

  reset(): void {
    this.finished = false;
    this.visited.clear();
    this.updatedNodes = [];
    this.graph.reset();
  }
}
