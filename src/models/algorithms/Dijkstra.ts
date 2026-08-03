import { PathfindingAlgorithm } from './PathfindingAlgorithm';
import type { AnimationStep, AlgorithmType } from '../../types';

export class Dijkstra extends PathfindingAlgorithm {
  private distanceMap: Map<number, number>;
  private priorityQueue: number[];

  constructor(graph: import('../Graph').Graph) {
    super(graph);
    this.distanceMap = new Map();
    this.priorityQueue = [];
  }

  start(startNodeId: number, endNodeId: number): void {
    this.reset();
    this.startNodeId = startNodeId;
    this.endNodeId = endNodeId;
    
    const startNode = this.getNode(startNodeId);
    if (startNode) {
      startNode.distanceFromStart = 0;
    }
    
    this.distanceMap.set(startNodeId, 0);
    this.priorityQueue = [startNodeId];
    console.log("[GeoPath] Dijkstra start:", { startNodeId, endNodeId });
  }

  nextStep(): AnimationStep[] {
    this.updatedNodes = [];

    if (this.priorityQueue.length === 0) {
      this.finished = true;
      console.log("[GeoPath] Dijkstra finished, priorityQueue empty");
      return [];
    }

    const currentNodeId = this.getLowestDistanceNode();
    this.priorityQueue.splice(this.priorityQueue.indexOf(currentNodeId), 1);

    if (currentNodeId === this.endNodeId) {
      this.finished = true;
      console.log("[GeoPath] Dijkstra finished, reached endNode:", currentNodeId);
      this.updateNode(currentNodeId, this.getNode(currentNodeId)?.parent || null,
        this.getNode(currentNodeId)?.distanceFromStart || 0,
        this.getNode(currentNodeId)?.distanceToEnd || 0);
      return this.updatedNodes;
    }

    this.markVisited(currentNodeId);
    const currentNode = this.getNode(currentNodeId);
    
    if (currentNode) {
      const neighbors = currentNode.getNeighbors();
      
      for (const neighbor of neighbors) {
        if (this.visited.has(neighbor.nodeId)) continue;

        const alt = currentNode.distanceFromStart + neighbor.weight;
        const neighborNode = this.getNode(neighbor.nodeId);
        
        if (!neighborNode) continue;

        if (!this.distanceMap.has(neighbor.nodeId) || alt < neighborNode.distanceFromStart) {
          neighborNode.parent = currentNodeId;
          neighborNode.distanceFromStart = alt;
          this.distanceMap.set(neighbor.nodeId, alt);
          
          if (!this.priorityQueue.includes(neighbor.nodeId)) {
            this.priorityQueue.push(neighbor.nodeId);
          }
          
          this.updateNode(neighbor.nodeId, currentNodeId, alt, neighborNode.distanceToEnd);
        }
      }
    }

    this.updateNode(currentNodeId, currentNode?.parent || null,
      currentNode?.distanceFromStart || 0,
      currentNode?.distanceToEnd || 0);

    return this.updatedNodes;
  }

  getAlgorithmType(): AlgorithmType {
    return 'dijkstra';
  }

  private getLowestDistanceNode(): number {
    let lowestNodeId = this.priorityQueue[0];
    let lowestDistance = this.distanceMap.get(lowestNodeId) || Infinity;

    for (const nodeId of this.priorityQueue) {
      const distance = this.distanceMap.get(nodeId) || Infinity;
      if (distance < lowestDistance) {
        lowestDistance = distance;
        lowestNodeId = nodeId;
      }
    }

    return lowestNodeId;
  }
}
