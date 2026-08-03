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

export type AlgorithmType = 'astar' | 'dijkstra' | 'greedy' | 'bidirectional';

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
