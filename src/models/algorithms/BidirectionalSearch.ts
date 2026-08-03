import { PathfindingAlgorithm } from './PathfindingAlgorithm';
import type { AnimationStep, AlgorithmType } from '../../types';

export class BidirectionalSearch extends PathfindingAlgorithm {
  private openSetStart: Set<number>;
  private openSetEnd: Set<number>;
  private closedSetStart: Set<number>;
  private closedSetEnd: Set<number>;
  private distanceMapStart: Map<number, number>;
  private distanceMapEnd: Map<number, number>;
  private meetingNode: number | null;

  constructor(graph: import('../Graph').Graph) {
    super(graph);
    this.openSetStart = new Set();
    this.openSetEnd = new Set();
    this.closedSetStart = new Set();
    this.closedSetEnd = new Set();
    this.distanceMapStart = new Map();
    this.distanceMapEnd = new Map();
    this.meetingNode = null;
  }

  start(startNodeId: number, endNodeId: number): void {
    this.reset();
    this.startNodeId = startNodeId;
    this.endNodeId = endNodeId;
    
    const startNode = this.getNode(startNodeId);
    const endNode = this.getNode(endNodeId);
    
    if (startNode) {
      startNode.distanceFromStart = 0;
    }
    if (endNode) {
      endNode.distanceFromStart = 0;
    }
    
    this.distanceMapStart.set(startNodeId, 0);
    this.distanceMapEnd.set(endNodeId, 0);
    this.openSetStart.add(startNodeId);
    this.openSetEnd.add(endNodeId);
  }

  nextStep(): AnimationStep[] {
    this.updatedNodes = [];

    if (this.finished) {
      return [];
    }

    const currentStartId = this.getNextFromOpenSet(this.openSetStart, this.closedSetStart, this.distanceMapStart);
    if (currentStartId !== null) {
      this.closedSetStart.add(currentStartId);
      this.markVisited(currentStartId);

      if (this.openSetEnd.has(currentStartId) || this.closedSetEnd.has(currentStartId)) {
        this.meetingNode = currentStartId;
        this.finished = true;
        this.updateNode(currentStartId, this.getNode(currentStartId)?.parent || null,
          this.getNode(currentStartId)?.distanceFromStart || 0,
          this.getNode(currentStartId)?.distanceToEnd || 0);
        return this.updatedNodes;
      }

      this.updateNeighbors(currentStartId, this.openSetStart, this.closedSetStart, this.distanceMapStart, true);
      this.updateNode(currentStartId, this.getNode(currentStartId)?.parent || null,
        this.getNode(currentStartId)?.distanceFromStart || 0,
        this.getNode(currentStartId)?.distanceToEnd || 0);
    }

    const currentEndId = this.getNextFromOpenSet(this.openSetEnd, this.closedSetEnd, this.distanceMapEnd);
    if (currentEndId !== null) {
      this.closedSetEnd.add(currentEndId);
      this.markVisited(currentEndId);

      if (this.openSetStart.has(currentEndId) || this.closedSetStart.has(currentEndId)) {
        this.meetingNode = currentEndId;
        this.finished = true;
        this.updateNode(currentEndId, this.getNode(currentEndId)?.parent || null,
          this.getNode(currentEndId)?.distanceFromStart || 0,
          this.getNode(currentEndId)?.distanceToEnd || 0);
        return this.updatedNodes;
      }

      this.updateNeighbors(currentEndId, this.openSetEnd, this.closedSetEnd, this.distanceMapEnd, false);
      this.updateNode(currentEndId, this.getNode(currentEndId)?.parent || null,
        this.getNode(currentEndId)?.distanceFromStart || 0,
        this.getNode(currentEndId)?.distanceToEnd || 0);
    }

    return this.updatedNodes;
  }

  getAlgorithmType(): AlgorithmType {
    return 'bidirectional';
  }

  private updateNeighbors(
    nodeId: number,
    openSet: Set<number>,
    closedSet: Set<number>,
    distanceMap: Map<number, number>,
    isFromStart: boolean
  ): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    const neighbors = node.getNeighbors();

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.nodeId)) continue;

      const neighborNode = this.getNode(neighbor.nodeId);
      if (!neighborNode) continue;

      const alt = node.distanceFromStart + neighbor.weight;

      if (!distanceMap.has(neighbor.nodeId) || alt < neighborNode.distanceFromStart) {
        neighborNode.parent = nodeId;
        neighborNode.distanceFromStart = alt;
        distanceMap.set(neighbor.nodeId, alt);

        if (!openSet.has(neighbor.nodeId)) {
          openSet.add(neighbor.nodeId);
        }

        this.updateNode(neighbor.nodeId, nodeId, alt, neighborNode.distanceToEnd);
      }
    }
  }

  private getNextFromOpenSet(
    openSet: Set<number>,
    closedSet: Set<number>,
    distanceMap: Map<number, number>
  ): number | null {
    let minNodeId: number | null = null;
    let minDistance = Infinity;

    for (const nodeId of openSet) {
      if (closedSet.has(nodeId)) continue;

      const distance = distanceMap.get(nodeId) || Infinity;
      if (distance < minDistance) {
        minDistance = distance;
        minNodeId = nodeId;
      }
    }

    if (minNodeId !== null) {
      openSet.delete(minNodeId);
    }

    return minNodeId;
  }
}
