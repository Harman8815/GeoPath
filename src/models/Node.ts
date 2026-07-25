// @ts-ignore
import Edge from "./Edge";

export default class Node {
  id: number;
  latitude: number;
  longitude: number;
  edges: any[];
  visited: boolean;
  distanceFromStart: number;
  distanceToEnd: number;
  parent: Node | null;
  referer: Node | null;

  constructor(id: number, latitude: number, longitude: number) {
    this.edges = [];
    this.distanceFromStart = 0;
    this.distanceToEnd = 0;
    this.parent = null;
    this.referer = null;
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.visited = false;
  }

  get totalDistance() {
    return this.distanceFromStart + this.distanceToEnd;
  }

  get neighbors() {
    return this.edges.map((edge: any) => ({ edge, node: edge.getOtherNode(this) }));
  }

  connectTo(node: Node) {
    const edge = new Edge(this, node);
    this.edges.push(edge);
    node.edges.push(edge);
  }

  reset() {
    this.visited = false;
    this.distanceFromStart = 0;
    this.distanceToEnd = 0;
    this.parent = null;
    this.referer = null;

    for (const neighbor of this.neighbors) {
      neighbor.edge.visited = false;
    }
  }
}
