export interface NodeModel {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  lat?: number;
  lon?: number;
}

export interface EdgeModel {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: NodeModel[];
  edges: EdgeModel[];
}
