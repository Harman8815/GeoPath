import { PathfindingAlgorithm } from './PathfindingAlgorithm';
import { Graph } from '../Graph';
import type { AnimationStep, AlgorithmType } from '../../types';

export class AStar extends PathfindingAlgorithm {
  private openSet: Map<number, number>;
  private openList: number[];

  constructor(graph: Graph) {
    super(graph);
    this.openSet = new Map();
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
    
    this.openSet.set(startNodeId, startNode?.totalDistance || 0);
    this.openList = [startNodeId];
    this.markVisited(startNodeId);
    console.log("[GeoPath] AStar start:", { startNodeId, endNodeId });
  }

  nextStep(): AnimationStep[] {
    this.updatedNodes = [];

    if (this.openList.length === 0) {
      this.finished = true;
      console.log("[GeoPath] AStar finished, openList empty");
      return [];
    }

    const currentNodeId = this.getLowestFScoreNode();
    this.openList.splice(this.openList.indexOf(currentNodeId), 1);
    this.openSet.delete(currentNodeId);

    console.log("[GeoPath] AStar step: processing node", currentNodeId, "openList size:", this.openList.length, "visited size:", this.visited.size);

    if (currentNodeId === this.endNodeId) {
      this.finished = true;
      console.log("[GeoPath] AStar finished, reached endNode:", currentNodeId);
      this.updateNode(currentNodeId, this.getNode(currentNodeId)?.parent || null, 
        this.getNode(currentNodeId)?.distanceFromStart || 0, 
        this.getNode(currentNodeId)?.distanceToEnd || 0);
      return this.updatedNodes;
    }

    this.markVisited(currentNodeId);
    const currentNode = this.getNode(currentNodeId);
    
    if (currentNode) {
      const neighbors = currentNode.getNeighbors();
      console.log("[GeoPath] AStar exploring neighbors of node", currentNodeId, "neighbors:", neighbors.length);
      
      for (const neighbor of neighbors) {
        if (this.visited.has(neighbor.nodeId)) continue;

        const tentativeGScore = currentNode.distanceFromStart + neighbor.weight;
        const neighborNode = this.getNode(neighbor.nodeId);
        
        if (!neighborNode) continue;

        if (!this.openSet.has(neighbor.nodeId) || tentativeGScore < neighborNode.distanceFromStart) {
          neighborNode.parent = currentNodeId;
          neighborNode.distanceFromStart = tentativeGScore;
          neighborNode.distanceToEnd = this.calculateHeuristic(neighbor.nodeId);
          
          if (!this.openSet.has(neighbor.nodeId)) {
            this.openSet.set(neighbor.nodeId, neighborNode.totalDistance);
            this.openList.push(neighbor.nodeId);
          }
          
          console.log("[GeoPath] AStar updating neighbor", neighbor.nodeId, "parent:", currentNodeId, "gScore:", tentativeGScore);
          this.updateNode(neighbor.nodeId, currentNodeId, tentativeGScore, neighborNode.distanceToEnd);
        }
      }
    }

    this.updateNode(currentNodeId, currentNode?.parent || null, 
      currentNode?.distanceFromStart || 0, 
      currentNode?.distanceToEnd || 0);

    console.log("[GeoPath] AStar step complete, updated nodes:", this.updatedNodes.length);
    return this.updatedNodes;
  }

  getAlgorithmType(): AlgorithmType {
    return 'astar';
  }

  private getLowestFScoreNode(): number {
    let lowestNodeId = this.openList[0];
    let lowestFScore = this.openSet.get(lowestNodeId) || Infinity;

    for (const nodeId of this.openList) {
      const fScore = this.openSet.get(nodeId) || Infinity;
      if (fScore < lowestFScore) {
        lowestFScore = fScore;
        lowestNodeId = nodeId;
      }
    }

    return lowestNodeId;
  }
}
