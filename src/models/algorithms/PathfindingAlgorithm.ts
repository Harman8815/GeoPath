import Node from "../Node";

class PathfindingAlgorithm {
  finished: boolean;
  startNode: Node | null;
  endNode: Node | null;

  constructor() {
    this.finished = false;
    this.startNode = null;
    this.endNode = null;
  }

  start(startNode: Node, endNode: Node) {
    this.finished = false;
    this.startNode = startNode;
    this.endNode = endNode;
  }

  nextStep() {
    return [] as Node[];
  }
}

export default PathfindingAlgorithm;
