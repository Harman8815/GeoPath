// Core Types

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  type: 'node';
}

export interface OverpassWay {
  id: number;
  nodes: number[];
  type: 'way';
}

export type OverpassElement = OverpassNode | OverpassWay;

export interface OverpassResponse {
  elements: OverpassElement[];
}

// Graph Types

export interface NodeData {
  id: number;
  latitude: number;
  longitude: number;
}

export interface EdgeData {
  from: number;
  to: number;
  weight: number;
}

export interface GraphData {
  nodes: Map<number, NodeData>;
  edges: EdgeData[];
  startNodeId: number;
}

// Pathfinding Types

export type AlgorithmType = 'astar' | 'dijkstra' | 'greedy' | 'bidirectional' | 'bfs' | 'dfs' | 'bellman-ford' | 'floyd-warshall' | 'kruskal' | 'prim' | 'topological-sort';

export type HeuristicType = 'manhattan' | 'euclidean' | 'octile';

export type CellType = 'empty' | 'wall' | 'weight' | 'start' | 'target' | 'visited' | 'visiting' | 'path';

export interface GridNode {
  row: number;
  col: number;
  type: CellType;
  distance: number;
  heuristic: number;
  totalCost: number;
  isVisited: boolean;
  previousNode: GridNode | null;
  weight: number;
}

export interface AlgorithmInfo {
  id: AlgorithmType;
  name: string;
  tagline: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  guaranteesShortestPath: boolean;
  supportsWeights: boolean;
  usesHeuristic: boolean;
  color: string;
  badge: string;
  useCases: string[];
}

export type ProgrammingLanguage = 'python' | 'javascript' | 'cpp' | 'java' | 'rust';

export interface MemoryLogStep {
  step: number;
  action: string;
  details: string;
  memoryCellState: {
    queueSize: number;
    visitedCount: number;
    currentWorkingNode?: string;
    distanceUpdate?: string;
    heapState?: string[];
  };
  timestampMs: number;
}

export interface DetailedAlgorithm extends AlgorithmInfo {
  category: 'Shortest Path' | 'Graph Traversal' | 'Minimum Spanning Tree' | 'Ordering & DAG';
  overview: string;
  codeSnippets: Record<ProgrammingLanguage, string>;
  pseudocode: string[];
  mathFormulas: {
    title: string;
    latexRepresentation: string;
    explanation: string;
  }[];
  flowchartNodes: {
    id: string;
    label: string;
    type: 'start' | 'process' | 'decision' | 'end';
  }[];
}

export interface SimulationStats {
  visitedNodesCount: number;
  pathLength: number;
  pathCost: number;
  executionTimeMs: number;
  status: 'idle' | 'running' | 'completed' | 'no-path';
}

export interface ComparisonResult {
  algorithm: AlgorithmType;
  visitedNodesCount: number;
  pathLength: number;
  pathCost: number;
  executionTimeMs: number;
}

export interface PathfindingResult {
  path: number[];
  visited: Set<number>;
  distance: number;
  finished: boolean;
}

export interface AnimationStep {
  nodeId: number;
  visited: boolean;
  parent: number | null;
  distanceFromStart: number;
  distanceToEnd: number;
}

export interface WaypointData {
  path: [number, number][];
  timestamps: [number, number];
  color: string;
}

// UI Types

export interface MapSettings {
  algorithm: AlgorithmType;
  radius: number;
  speed: number;
}

export interface ColorScheme {
  path: number[];
  route: number[];
  explored: number[];
  finalPath: number[];
  startNodeFill: number[];
  startNodeBorder: number[];
  endNodeFill: number[];
  endNodeBorder: number[];
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  transitionDuration?: number;
  transitionInterpolator?: any;
}
