import { AlgorithmType, GridNode, HeuristicType, CellType } from '../types';

export function createGrid(rows: number, cols: number, startPos = { row: 5, col: 5 }, targetPos = { row: 5, col: 20 }): GridNode[][] {
  const grid: GridNode[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: GridNode[] = [];
    for (let c = 0; c < cols; c++) {
      let type: CellType = 'empty';
      if (r === startPos.row && c === startPos.col) type = 'start';
      else if (r === targetPos.row && c === targetPos.col) type = 'target';

      row.push({
        row: r,
        col: c,
        type,
        distance: Infinity,
        heuristic: 0,
        totalCost: Infinity,
        isVisited: false,
        previousNode: null,
        weight: 1,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function getHeuristic(
  nodeA: { row: number; col: number },
  nodeB: { row: number; col: number },
  type: HeuristicType = 'manhattan'
): number {
  const dx = Math.abs(nodeA.row - nodeB.row);
  const dy = Math.abs(nodeA.col - nodeB.col);

  if (type === 'manhattan') {
    return dx + dy;
  } else if (type === 'euclidean') {
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  }
}

export function getNeighbors(node: GridNode, grid: GridNode[][], allowDiagonal = false): GridNode[] {
  const neighbors: GridNode[] = [];
  const { row, col } = node;
  const numRows = grid.length;
  const numCols = grid[0].length;

  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (col < numCols - 1) neighbors.push(grid[row][col + 1]);
  if (row < numRows - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);

  if (allowDiagonal) {
    if (row > 0 && col > 0) neighbors.push(grid[row - 1][col - 1]);
    if (row > 0 && col < numCols - 1) neighbors.push(grid[row - 1][col + 1]);
    if (row < numRows - 1 && col > 0) neighbors.push(grid[row + 1][col - 1]);
    if (row < numRows - 1 && col < numCols - 1) neighbors.push(grid[row + 1][col + 1]);
  }

  return neighbors;
}

export interface GridPathfindingResult {
  visitedNodesInOrder: GridNode[];
  shortestPath: GridNode[];
  executionTimeMs: number;
}

export function runDijkstra(grid: GridNode[][], startNode: GridNode, targetNode: GridNode): GridPathfindingResult {
  const startTime = performance.now();
  const visitedNodesInOrder: GridNode[] = [];

  for (const row of grid) {
    for (const node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }

  startNode.distance = 0;
  const unvisitedNodes: GridNode[] = getAllNodes(grid);

  while (unvisitedNodes.length > 0) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();

    if (!closestNode) break;
    if (closestNode.distance === Infinity) break;
    if (closestNode.type === 'wall') continue;

    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);

    if (closestNode.row === targetNode.row && closestNode.col === targetNode.col) {
      break;
    }

    updateUnvisitedNeighborsDijkstra(closestNode, grid);
  }

  const endTime = performance.now();
  const shortestPath = getNodesInShortestPathOrder(targetNode);

  return {
    visitedNodesInOrder,
    shortestPath,
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
  };
}

function updateUnvisitedNeighborsDijkstra(node: GridNode, grid: GridNode[][]) {
  const unvisitedNeighbors = getNeighbors(node, grid).filter(n => !n.isVisited && n.type !== 'wall');
  for (const neighbor of unvisitedNeighbors) {
    const newDist = node.distance + neighbor.weight;
    if (newDist < neighbor.distance) {
      neighbor.distance = newDist;
      neighbor.previousNode = node;
    }
  }
}

export function runAStar(
  grid: GridNode[][],
  startNode: GridNode,
  targetNode: GridNode,
  heuristicType: HeuristicType = 'manhattan'
): GridPathfindingResult {
  const startTime = performance.now();
  const visitedNodesInOrder: GridNode[] = [];

  for (const row of grid) {
    for (const node of row) {
      node.distance = Infinity;
      node.heuristic = getHeuristic(node, targetNode, heuristicType);
      node.totalCost = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }

  startNode.distance = 0;
  startNode.totalCost = startNode.heuristic;

  const openSet: GridNode[] = [startNode];

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.totalCost - b.totalCost || a.heuristic - b.heuristic);
    const current = openSet.shift()!;

    if (current.type === 'wall') continue;
    if (current.isVisited) continue;

    current.isVisited = true;
    visitedNodesInOrder.push(current);

    if (current.row === targetNode.row && current.col === targetNode.col) {
      break;
    }

    const neighbors = getNeighbors(current, grid).filter(n => !n.isVisited && n.type !== 'wall');
    for (const neighbor of neighbors) {
      const tentativeG = current.distance + neighbor.weight;
      if (tentativeG < neighbor.distance) {
        neighbor.previousNode = current;
        neighbor.distance = tentativeG;
        neighbor.totalCost = neighbor.distance + neighbor.heuristic;

        if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  const endTime = performance.now();
  const shortestPath = getNodesInShortestPathOrder(targetNode);

  return {
    visitedNodesInOrder,
    shortestPath,
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
  };
}

export function runBFS(grid: GridNode[][], startNode: GridNode, targetNode: GridNode): GridPathfindingResult {
  const startTime = performance.now();
  const visitedNodesInOrder: GridNode[] = [];

  for (const row of grid) {
    for (const node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }

  startNode.distance = 0;
  startNode.isVisited = true;
  const queue: GridNode[] = [startNode];

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitedNodesInOrder.push(current);

    if (current.row === targetNode.row && current.col === targetNode.col) {
      break;
    }

    const neighbors = getNeighbors(current, grid).filter(n => !n.isVisited && n.type !== 'wall');
    for (const neighbor of neighbors) {
      neighbor.isVisited = true;
      neighbor.distance = current.distance + 1;
      neighbor.previousNode = current;
      queue.push(neighbor);
    }
  }

  const endTime = performance.now();
  const shortestPath = getNodesInShortestPathOrder(targetNode);

  return {
    visitedNodesInOrder,
    shortestPath,
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
  };
}

export function runDFS(grid: GridNode[][], startNode: GridNode, targetNode: GridNode): GridPathfindingResult {
  const startTime = performance.now();
  const visitedNodesInOrder: GridNode[] = [];

  for (const row of grid) {
    for (const node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }

  startNode.distance = 0;
  const stack: GridNode[] = [startNode];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.isVisited) continue;
    if (current.type === 'wall') continue;

    current.isVisited = true;
    visitedNodesInOrder.push(current);

    if (current.row === targetNode.row && current.col === targetNode.col) {
      break;
    }

    const neighbors = getNeighbors(current, grid).filter(n => !n.isVisited && n.type !== 'wall');
    for (const neighbor of neighbors) {
      neighbor.previousNode = current;
      neighbor.distance = current.distance + 1;
      stack.push(neighbor);
    }
  }

  const endTime = performance.now();
  const shortestPath = getNodesInShortestPathOrder(targetNode);

  return {
    visitedNodesInOrder,
    shortestPath,
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
  };
}

export function executeAlgorithm(
  algorithm: AlgorithmType,
  grid: GridNode[][],
  startNode: GridNode,
  targetNode: GridNode,
  heuristic: HeuristicType = 'manhattan'
): GridPathfindingResult {
  switch (algorithm) {
    case 'dijkstra':
      return runDijkstra(grid, startNode, targetNode);
    case 'astar':
      return runAStar(grid, startNode, targetNode, heuristic);
    case 'bfs':
      return runBFS(grid, startNode, targetNode);
    case 'dfs':
      return runDFS(grid, startNode, targetNode);
    default:
      return runDijkstra(grid, startNode, targetNode);
  }
}

function getAllNodes(grid: GridNode[][]): GridNode[] {
  const nodes: GridNode[] = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
}

function sortNodesByDistance(unvisitedNodes: GridNode[]) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

export function getNodesInShortestPathOrder(targetNode: GridNode): GridNode[] {
  const nodesInShortestPathOrder: GridNode[] = [];
  let currentNode: GridNode | null = targetNode;

  if (!targetNode.previousNode && targetNode.distance === Infinity) {
    return [];
  }

  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}

export function generateRandomWalls(grid: GridNode[][], density = 0.25): GridNode[][] {
  const newGrid = cloneGrid(grid);
  for (let r = 0; r < newGrid.length; r++) {
    for (let c = 0; c < newGrid[0].length; c++) {
      const node = newGrid[r][c];
      if (node.type === 'start' || node.type === 'target') continue;
      if (Math.random() < density) {
        node.type = 'wall';
      } else {
        node.type = 'empty';
      }
    }
  }
  return newGrid;
}

export function generateWeightedSwamps(grid: GridNode[][], density = 0.2): GridNode[][] {
  const newGrid = cloneGrid(grid);
  for (let r = 0; r < newGrid.length; r++) {
    for (let c = 0; c < newGrid[0].length; c++) {
      const node = newGrid[r][c];
      if (node.type === 'start' || node.type === 'target') continue;
      const rand = Math.random();
      if (rand < 0.15) {
        node.type = 'wall';
        node.weight = 1;
      } else if (rand < 0.35) {
        node.type = 'weight';
        node.weight = 5;
      } else {
        node.type = 'empty';
        node.weight = 1;
      }
    }
  }
  return newGrid;
}

export function generateRecursiveDivisionMaze(grid: GridNode[][]): GridNode[][] {
  const newGrid = cloneGrid(grid);
  const numRows = newGrid.length;
  const numCols = newGrid[0].length;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (newGrid[r][c].type !== 'start' && newGrid[r][c].type !== 'target') {
        newGrid[r][c].type = 'empty';
        newGrid[r][c].weight = 1;
      }
    }
  }

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (r === 0 || r === numRows - 1 || c === 0 || c === numCols - 1) {
        if (newGrid[r][c].type !== 'start' && newGrid[r][c].type !== 'target') {
          newGrid[r][c].type = 'wall';
        }
      }
    }
  }

  function divide(rStart: number, rEnd: number, cStart: number, cEnd: number) {
    if (rEnd - rStart <= 2 || cEnd - cStart <= 2) return;

    const chooseHorizontal = Math.random() < 0.5;

    if (chooseHorizontal) {
      const wallRow = Math.floor(rStart + 1 + Math.random() * (rEnd - rStart - 2));
      const passageCol = Math.floor(cStart + Math.random() * (cEnd - cStart));

      for (let c = cStart; c <= cEnd; c++) {
        if (c !== passageCol && newGrid[wallRow][c].type !== 'start' && newGrid[wallRow][c].type !== 'target') {
          newGrid[wallRow][c].type = 'wall';
        }
      }

      divide(rStart, wallRow - 1, cStart, cEnd);
      divide(wallRow + 1, rEnd, cStart, cEnd);
    } else {
      const wallCol = Math.floor(cStart + 1 + Math.random() * (cEnd - cStart - 2));
      const passageRow = Math.floor(rStart + Math.random() * (rEnd - rStart));

      for (let r = rStart; r <= rEnd; r++) {
        if (r !== passageRow && newGrid[r][wallCol].type !== 'start' && newGrid[r][wallCol].type !== 'target') {
          newGrid[r][wallCol].type = 'wall';
        }
      }

      divide(rStart, rEnd, cStart, wallCol - 1);
      divide(rStart, rEnd, wallCol + 1, cEnd);
    }
  }

  divide(1, numRows - 2, 1, numCols - 2);
  return newGrid;
}

export function cloneGrid(grid: GridNode[][]): GridNode[][] {
  return grid.map(row =>
    row.map(node => ({
      ...node,
      previousNode: node.previousNode ? { ...node.previousNode } : null,
    }))
  );
}
