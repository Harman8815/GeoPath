import { Graph } from './Graph';
import { PathfindingAlgorithm } from './algorithms/PathfindingAlgorithm';
import { AStar } from './algorithms/AStar';
import { Dijkstra } from './algorithms/Dijkstra';
import { Greedy } from './algorithms/Greedy';
import { BidirectionalSearch } from './algorithms/BidirectionalSearch';
import type { AlgorithmType, AnimationStep } from '../types';

export class PathfindingState {
  private static instance: PathfindingState | null = null;
  
  private graph: Graph | null = null;
  private endNodeId: number | null = null;
  private algorithm: PathfindingAlgorithm | null = null;
  private finished: boolean = false;

  private constructor() {}

  static getInstance(): PathfindingState {
    if (!PathfindingState.instance) {
      PathfindingState.instance = new PathfindingState();
    }
    return PathfindingState.instance;
  }

  setGraph(graph: Graph): void {
    this.graph = graph;
  }

  setEndNodeId(nodeId: number): void {
    this.endNodeId = nodeId;
  }

  getGraph(): Graph | null {
    return this.graph;
  }

  getStartNodeId(): number | null {
    return this.graph?.startNodeId || null;
  }

  getEndNodeId(): number | null {
    return this.endNodeId;
  }

  getNode(nodeId: number) {
    return this.graph?.getNode(nodeId);
  }

  reset(): void {
    this.finished = false;
    this.graph?.reset();
    if (this.algorithm) {
      this.algorithm.reset();
    }
  }

  start(algorithmType: AlgorithmType): void {
    if (!this.graph) {
      throw new Error('Graph not set');
    }

    const startNodeId = this.getStartNodeId();
    const endNodeId = this.getEndNodeId();

    if (startNodeId === null || endNodeId === null) {
      throw new Error('Start or end node not set');
    }

    this.reset();

    switch (algorithmType) {
      case 'astar':
        this.algorithm = new AStar(this.graph);
        break;
      case 'greedy':
        this.algorithm = new Greedy(this.graph);
        break;
      case 'dijkstra':
        this.algorithm = new Dijkstra(this.graph);
        break;
      case 'bidirectional':
        this.algorithm = new BidirectionalSearch(this.graph);
        break;
      default:
        this.algorithm = new AStar(this.graph);
        break;
    }

    this.algorithm.start(startNodeId, endNodeId);
  }

  nextStep(): AnimationStep[] {
    if (!this.algorithm) {
      return [];
    }

    const updatedNodes = this.algorithm.nextStep();
    
    if (this.algorithm.isFinished()) {
      this.finished = true;
    }

    return updatedNodes;
  }

  isFinished(): boolean {
    return this.finished;
  }

  getAlgorithmType(): AlgorithmType {
    return this.algorithm?.getAlgorithmType() || 'astar';
  }
}

export default PathfindingState;
