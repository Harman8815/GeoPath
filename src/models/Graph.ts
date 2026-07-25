import Node from "./Node";

export default class Graph {
  startNode: Node | null;
  nodes: Map<number, Node>;

  constructor() {
    this.startNode = null;
    this.nodes = new Map();
  }

  getNode(id: number) {
    return this.nodes.get(id);
  }

  addNode(id: number, latitude: number, longitude: number) {
    const node = new Node(id, latitude, longitude);
    this.nodes.set(node.id, node);
    return node;
  }
}
