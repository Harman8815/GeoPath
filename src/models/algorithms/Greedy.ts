import { PathfindingAlgorithm } from './PathfindingAlgorithm';
import { Graph } from '../Graph';
import type { AnimationStep, AlgorithmType } from '../../types';

export class Greedy extends PathfindingAlgorithm {
  private heuristicMap: Map<number, number>;
  private openList: number[];

  constructor(graph: Graph) {
    super(graph);
    this.heuristicMap = new Map();
    this.openList = [];
  }

  start(startNodeId: number, endNodeId: number): void {
    this.reset();
    this.startNodeId = startNodeId;
    this.endNodeId = endNodeId;
    
    const startNode = this.getNode(startNodeId);
    if (startNode) {
      startNode.distanceFromStart = 0;
      startNode.distanceToEnd = this.calculateHeuristic(startNodeId);
    }
    
    this.heuristicMap.set(startNodeId, startNode?.distanceToEnd || 0);
    this.openList = [startNodeId];
    console.log("[GeoPath] Greedy start:", { startNodeId, endNodeId });
  }

  nextStep(): AnimationStep[] {
    this.updatedNodes = [];

    if (this.openList.length === 0) {
      this.finished = true;
      console.log("[GeoPath] Greedy finished, openList empty");
      return [];
    }

    const currentNodeId = this.getLowestHeuristicNode();
    this.openList.splice(this.openList.indexOf(currentNodeId), 1);

    if (currentNodeId === this.endNodeId) {
      this.finished = true;
      console.log("[GeoPath] Greedy finished, reached endNode:", currentNodeId);
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

        const neighborNode = this.getNode(neighbor.nodeId);
        
        if (!neighborNode) continue;

        neighborNode.distanceToEnd = this.calculateHeuristic(neighbor.nodeId);
        neighborNode.parent = currentNodeId;
        this.heuristicMap.set(neighbor.nodeId, neighborNode.distanceToEnd);
        
        if (!this.openList.includes(neighbor.nodeId)) {
          this.openList.push(neighbor.nodeId);
        }
        
        this.updateNode(neighbor.nodeId, currentNodeId, neighborNode.distanceFromStart, neighborNode.distanceToEnd);
      }
    }

    this.updateNode(currentNodeId, currentNode?.parent || null,
      currentNode?.distanceFromStart || 0,
      currentNode?.distanceToEnd || 0);

    return this.updatedNodes;
  }

  getAlgorithmType(): AlgorithmType {
    return 'greedy';
  }

  private getLowestHeuristicNode(): number {
    let lowestNodeId = this.openList[0];
    let lowestHeuristic = this.heuristicMap.get(lowestNodeId) || Infinity;

    for (const nodeId of this.openList) {
      const heuristic = this.heuristicMap.get(nodeId) || Infinity;
      if (heuristic < lowestHeuristic) {
        lowestHeuristic = heuristic;
        lowestNodeId = nodeId;
      }
    }

    return lowestNodeId;
  }
}
