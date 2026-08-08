import { DetailedAlgorithm } from '../types';

export const DETAILED_ALGORITHMS: DetailedAlgorithm[] = [
  {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    tagline: "The gold standard for single-source weighted shortest paths.",
    description: "Systematically explores graph nodes in order of their tentative distance using a priority queue, guaranteeing the absolute shortest path on non-negative weighted graphs.",
    overview: "Dijkstra's Algorithm visits vertices in order of increasing distance from the start node. It maintains a priority queue (min-heap) of unvisited nodes and continually relaxes adjacent edges until the target destination is reached or all nodes are evaluated.",
    category: 'Shortest Path',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: true,
    supportsWeights: true,
    usesHeuristic: false,
    color: 'emerald',
    badge: 'Weighted Optimal',
    useCases: [
      'GPS and Turn-by-Turn Navigation Systems',
      'IP Network Routing Protocols (OSPF, IS-IS)',
      'Flight Route Optimizers with Toll Costs'
    ],
    codeSnippets: {
      python: `import heapq

def dijkstra(graph, start, target):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    previous = {}

    while pq:
        current_dist, current_node = heapq.heappop(pq)

        if current_node == target:
            break

        if current_dist > distances[current_node]:
            continue

        for neighbor, weight in graph[current_node].items():
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))

    return distances, previous`,

      javascript: `function dijkstra(graph, start, target) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  
  // Priority queue simulated via sorted array or min-heap
  const pq = new PriorityQueue();
  
  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
  });
  distances[start] = 0;
  pq.enqueue(start, 0);

  while (!pq.isEmpty()) {
    const { element: u, priority: currentDist } = pq.dequeue();
    if (u === target) break;
    if (visited.has(u)) continue;
    visited.add(u);

    for (const [v, weight] of Object.entries(graph[u])) {
      const alt = currentDist + weight;
      if (alt < distances[v]) {
        distances[v] = alt;
        previous[v] = u;
        pq.enqueue(v, alt);
      }
    }
  }

  return { distances, previous };
}`,

      cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>

using namespace std;

typedef pair<int, int> pii; // {distance, node}

void dijkstra(int start, int target, const vector<vector<pii>>& adj) {
    int n = adj.size();
    vector<int> dist(n, 1e9);
    priority_queue<pii, vector<pii>, greater<pii>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (u == target) break;
        if (d > dist[u]) continue;

        for (auto& edge : adj[u]) {
            int v = edge.first;
            int w = edge.second;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
}`,

      java: `import java.util.*;

public class Dijkstra {
    static class Node implements Comparable<Node> {
        int id, dist;
        Node(int id, int dist) {
            this.id = id;
            this.dist = dist;
        }
        public int compareTo(Node o) {
            return Integer.compare(this.dist, o.dist);
        }
    }

    public static void findPath(int start, int target, List<List<Node>> adj) {
        int[] dist = new int[adj.size()];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[start] = 0;

        PriorityQueue<Node> pq = new PriorityQueue<>();
        pq.add(new Node(start, 0));

        while (!pq.isEmpty()) {
            Node curr = pq.poll();
            if (curr.id == target) break;
            if (curr.dist > dist[curr.id]) continue;

            for (Node neighbor : adj.get(curr.id)) {
                if (dist[curr.id] + neighbor.dist < dist[neighbor.id]) {
                    dist[neighbor.id] = dist[curr.id] + neighbor.dist;
                    pq.add(new Node(neighbor.id, dist[neighbor.id]));
                }
            }
        }
    }
}`,

      rust: `use std::collections::BinaryHeap;
use std::cmp::Ordering;

#[derive(Copy, Clone, Eq, PartialEq)]
struct State {
    cost: usize,
    position: usize,
}

impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other.cost.cmp(&self.cost)
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn dijkstra(adj_list: &Vec<Vec<(usize, usize)>>, start: usize, goal: usize) -> Option<usize> {
    let mut dist: Vec<_> = (0..adj_list.len()).map(|_| usize::MAX).collect();
    let mut heap = BinaryHeap::new();

    dist[start] = 0;
    heap.push(State { cost: 0, position: start });

    while let Some(State { cost, position }) = heap.pop() {
        if position == goal { return Some(cost); }
        if cost > dist[position] { continue; }

        for &(next, edge_cost) in &adj_list[position] {
            let next_cost = cost + edge_cost;
            if next_cost < dist[next] {
                dist[next] = next_cost;
                heap.push(State { cost: next_cost, position: next });
            }
        }
    }
    None
}`
    },
    pseudocode: [
      "1. Initialize dist[v] = Infinity for all vertices v in G, except dist[start] = 0",
      "2. Insert (0, start) into Min-Priority Queue PQ",
      "3. While PQ is not empty:",
      "     a. Extract vertex u with minimum distance from PQ",
      "     b. If u == target, terminate search",
      "     c. For each neighbor v of u with edge weight w(u,v):",
      "          i. Relax edge: new_dist = dist[u] + w(u,v)",
      "         ii. If new_dist < dist[v]:",
      "               dist[v] = new_dist",
      "               parent[v] = u",
      "               Insert or decrease key (new_dist, v) in PQ",
      "4. Backtrack from target to start using parent pointers to reconstruct shortest path"
    ],
    mathFormulas: [
      {
        title: "Edge Relaxation Condition",
        latexRepresentation: "d(v) \\leftarrow \\min\\bigl(d(v),\\; d(u) + w(u, v)\\bigr)",
        explanation: "If the current shortest distance to node u plus the weight to neighbor v is smaller than v's current recorded distance, we update v's distance and parent link."
      },
      {
        title: "Priority Queue Invariant",
        latexRepresentation: "u = \\arg\\min_{x \\in Q} \\, d(x)",
        explanation: "At every step, Dijkstra extracts the vertex u with the globally minimum tentative distance among all unvisited vertices."
      },
      {
        title: "Triangle Inequality",
        latexRepresentation: "d(s, v) \\le d(s, u) + w(u, v)",
        explanation: "Guarantees that once a vertex is popped from the priority queue in non-negative weighted graphs, its final shortest distance is settled permanently."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Start Initialization (dist[start]=0, dist[v]=∞)', type: 'start' },
      { id: '2', label: 'Push (0, start) to Min Heap', type: 'process' },
      { id: '3', label: 'Is Priority Queue Empty?', type: 'decision' },
      { id: '4', label: 'Pop node u with min distance', type: 'process' },
      { id: '5', label: 'Is u == Target?', type: 'decision' },
      { id: '6', label: 'Examine all adjacent edges (u, v)', type: 'process' },
      { id: '7', label: 'Is dist[u] + w(u,v) < dist[v]?', type: 'decision' },
      { id: '8', label: 'Update dist[v] & push v to Heap', type: 'process' },
      { id: '9', label: 'Reconstruct & Return Path', type: 'end' }
    ]
  },

  {
    id: 'astar',
    name: 'A* Search Algorithm',
    tagline: 'Informed heuristic-driven graph search for ultra-fast navigation.',
    description: 'Combines Dijkstra’s path cost with a directional heuristic function h(n) to intelligently guide the search towards the target, drastically reducing explored nodes.',
    overview: 'A* evaluates nodes using f(n) = g(n) + h(n), where g(n) is the exact cost from start to node n, and h(n) is an estimated cost from n to target. When the heuristic is admissible (never overestimates), A* guarantees finding the optimal shortest path.',
    category: 'Shortest Path',
    timeComplexity: 'O(E) worst case, O(b^d) directed',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: true,
    supportsWeights: true,
    usesHeuristic: true,
    color: 'cyan',
    badge: 'Heuristic Guided',
    useCases: [
      'Video Game AI Unit Pathfinding (RTS, RPGs)',
      'Autonomous Drone Flight Planning',
      'Robotic Arm Trajectory Calculation'
    ],
    codeSnippets: {
      python: `import heapq

def heuristic(a, b):
    # Manhattan distance for grid
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def astar_search(grid, start, goal):
    open_set = []
    heapq.heappush(open_set, (0, start))
    
    g_score = {start: 0}
    f_score = {start: heuristic(start, goal)}
    came_from = {}

    while open_set:
        _, current = heapq.heappop(open_set)

        if current == goal:
            return reconstruct_path(came_from, current)

        for neighbor in get_neighbors(grid, current):
            tentative_g = g_score[current] + neighbor.cost
            
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None`,

      javascript: `function astar(grid, start, goal) {
  const openSet = new PriorityQueue();
  const gScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map();

  gScore.set(start, 0);
  fScore.set(start, ManhattanDistance(start, goal));
  openSet.enqueue(start, fScore.get(start));

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue().element;

    if (current === goal) {
      return reconstructPath(cameFrom, current);
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const tentativeG = gScore.get(current) + neighbor.weight;

      if (tentativeG < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        const f = tentativeG + ManhattanDistance(neighbor, goal);
        fScore.set(neighbor, f);
        openSet.enqueue(neighbor, f);
      }
    }
  }
  return null;
}`,

      cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <cmath>

using namespace std;

struct Node {
    int r, c;
    double g, h, f;
    bool operator>(const Node& other) const {
        return f > other.f;
    }
};

double heuristic(int r1, int c1, int r2, int c2) {
    return abs(r1 - r2) + abs(c1 - c2); // Manhattan
}

void astar(int startR, int startC, int goalR, int goalC) {
    priority_queue<Node, vector<Node>, greater<Node>> openSet;
    openSet.push({startR, startC, 0, heuristic(startR, startC, goalR, goalC), 0});
    // A* evaluation loop continues...
}`,

      java: `import java.util.*;

public class AStar {
    static class Node implements Comparable<Node> {
        int x, y;
        double g, h, f;
        Node(int x, int y, double g, double h) {
            this.x = x; this.y = y;
            this.g = g; this.h = h;
            this.f = g + h;
        }
        public int compareTo(Node o) {
            return Double.compare(this.f, o.f);
        }
    }

    public static double heuristic(Node a, Node b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}`,

      rust: `use std::collections::BinaryHeap;

#[derive(Copy, Clone, Eq, PartialEq)]
struct Node {
    f_score: usize,
    position: (usize, usize),
}

fn heuristic(p1: (usize, usize), p2: (usize, usize)) -> usize {
    (p1.0 as isize - p2.0 as isize).unsigned_abs() + (p1.1 as isize - p2.1 as isize).unsigned_abs()
}`
    },
    pseudocode: [
      "1. Initialize g_score[start] = 0, f_score[start] = h(start, goal)",
      "2. Add start to OpenSet (Priority Queue ordered by f_score)",
      "3. While OpenSet is not empty:",
      "     a. Current = node in OpenSet with lowest f_score",
      "     b. If Current == Goal: return reconstructed path",
      "     c. Remove Current from OpenSet and add to ClosedSet",
      "     d. For each neighbor of Current:",
      "          i. tentative_g = g_score[Current] + weight(Current, neighbor)",
      "         ii. If tentative_g < g_score[neighbor]:",
      "               cameFrom[neighbor] = Current",
      "               g_score[neighbor] = tentative_g",
      "               f_score[neighbor] = tentative_g + h(neighbor, goal)",
      "               If neighbor not in OpenSet, push neighbor"
    ],
    mathFormulas: [
      {
        title: "A* Evaluation Function",
        latexRepresentation: "f(n) = g(n) + h(n)",
        explanation: "g(n) is the exact cost incurred from start to node n. h(n) is the heuristic estimation from n to the goal."
      },
      {
        title: "Admissibility Condition",
        latexRepresentation: "h(n) \\le h^*(n) \\quad \\forall n",
        explanation: "The heuristic must never overestimate the true minimum cost h*(n) to reach the goal. This guarantees shortest path optimality."
      },
      {
        title: "Manhattan Distance Heuristic",
        latexRepresentation: "h(n) = |x_n - x_g| + |y_n - y_g|",
        explanation: "Standard heuristic for 4-directional grid graphs where horizontal and vertical moves have unit cost."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Init g(start)=0, f(start)=h(start, goal)', type: 'start' },
      { id: '2', label: 'Push start node to OpenSet PQ', type: 'process' },
      { id: '3', label: 'Pop current node with min f(n)', type: 'process' },
      { id: '4', label: 'Is Current == Goal?', type: 'decision' },
      { id: '5', label: 'Calculate neighbor tentative g = g(curr) + cost', type: 'process' },
      { id: '6', label: 'Is tentative g < g(neighbor)?', type: 'decision' },
      { id: '7', label: 'Update g, compute f = g + h, push to OpenSet', type: 'process' },
      { id: '8', label: 'Return Optimal Path', type: 'end' }
    ]
  },

  {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    tagline: 'Explores nodes level-by-level using a FIFO queue.',
    description: 'Traverses a graph systematically radially outwards level-by-level. Guarantees the unweighted minimum step count path.',
    overview: 'BFS explores all neighbor nodes at the present depth before moving to nodes at the next depth level. It uses a First-In-First-Out (FIFO) queue data structure to track nodes awaiting expansion.',
    category: 'Graph Traversal',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: true,
    supportsWeights: false,
    usesHeuristic: false,
    color: 'amber',
    badge: 'Unweighted Optimal',
    useCases: [
      'Social Network Friend Connections (Degrees of Separation)',
      'Web Crawlers Indexing Web Pages',
      'Bipartite Graph Verification & Flood Fill'
    ],
    codeSnippets: {
      python: `from collections import deque

def bfs_shortest_path(graph, start, target):
    queue = deque([start])
    visited = {start}
    parent = {}

    while queue:
        current = queue.popleft()

        if current == target:
            break

        for neighbor in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = current
                queue.append(neighbor)

    return parent`,

      javascript: `function bfs(graph, start, target) {
  const queue = [start];
  const visited = new Set([start]);
  const parent = {};

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === target) break;

    for (const neighbor of graph[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent[neighbor] = current;
        queue.push(neighbor);
      }
    }
  }
  return parent;
}`,

      cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <unordered_set>

using namespace std;

void bfs(int start, int target, const vector<vector<int>>& adj) {
    queue<int> q;
    unordered_set<int> visited;
    
    q.push(start);
    visited.insert(start);

    while (!q.empty()) {
        int curr = q.front();
        q.pop();

        if (curr == target) break;

        for (int neighbor : adj[curr]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }
}`,

      java: `import java.util.*;

public class BFS {
    public static void search(int start, int target, List<List<Integer>> adj) {
        Queue<Integer> queue = new LinkedList<>();
        boolean[] visited = new boolean[adj.size()];

        queue.add(start);
        visited[start] = true;

        while (!queue.isEmpty()) {
            int curr = queue.poll();
            if (curr == target) break;

            for (int neighbor : adj.get(curr)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.add(neighbor);
                }
            }
        }
    }
}`,

      rust: `use std::collections::VecDeque;
use std::collections::HashSet;

fn bfs(adj: &Vec<Vec<usize>>, start: usize, target: usize) -> Option<usize> {
    let mut queue = VecDeque::new();
    let mut visited = HashSet::new();

    queue.push_back(start);
    visited.insert(start);

    while let Some(curr) = queue.pop_front() {
        if curr == target { return Some(curr); }

        for &neighbor in &adj[curr] {
            if visited.insert(neighbor) {
                queue.push_back(neighbor);
            }
        }
    }
    None
}`
    },
    pseudocode: [
      "1. Enqueue start node into Queue Q, mark start as Visited",
      "2. While Q is not empty:",
      "     a. Dequeue node u from Q",
      "     b. If u == Target: Stop and reconstruct path",
      "     c. For each unvisited neighbor v of u:",
      "          i. Mark v as Visited",
      "         ii. Set parent[v] = u",
      "        iii. Enqueue v into Q"
    ],
    mathFormulas: [
      {
        title: "Level Order Radius",
        latexRepresentation: "d(s, v) = \\delta(s, v)",
        explanation: "In unweighted graphs (all edges weight 1), BFS guarantees that the first time a node is discovered, its level distance equals the exact minimum edge count from s."
      },
      {
        title: "BFS Time Complexity",
        latexRepresentation: "T(V, E) = O(V + E)",
        explanation: "Every vertex is enqueued at most once (O(V)) and every edge is inspected at most twice in undirected graphs (O(E))."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Push start to FIFO Queue & set visited=true', type: 'start' },
      { id: '2', label: 'Is FIFO Queue Empty?', type: 'decision' },
      { id: '3', label: 'Dequeue front node u', type: 'process' },
      { id: '4', label: 'Is u == Target?', type: 'decision' },
      { id: '5', label: 'Iterate unvisited neighbors v', type: 'process' },
      { id: '6', label: 'Mark v visited & push to Queue', type: 'process' },
      { id: '7', label: 'Return Path', type: 'end' }
    ]
  },

  {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    tagline: 'Explores deeply down branch pathways before backtracking.',
    description: 'Traverses deeply down each branch before backtracking using a LIFO stack or recursion. Ideal for cycle detection and topological sorting.',
    overview: 'DFS explores as far as possible along each branch before backtracking. While it does NOT guarantee shortest paths, it requires low memory for tree traversal and is the foundation for connected component analysis.',
    category: 'Graph Traversal',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: false,
    supportsWeights: false,
    usesHeuristic: false,
    color: 'rose',
    badge: 'Deep Exploration',
    useCases: [
      'Maze Solving and Puzzle Backtracking',
      'Cycle Detection in Directed Graphs',
      'Strongly Connected Components (Tarjan/Kosaraju)'
    ],
    codeSnippets: {
      python: `def dfs_recursive(graph, node, visited=None):
    if visited is None:
        visited = set()
    
    visited.add(node)
    
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs_recursive(graph, neighbor, visited)
            
    return visited`,

      javascript: `function dfs(graph, start) {
  const visited = new Set();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!visited.has(current)) {
      visited.add(current);

      for (const neighbor of graph[current]) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }
  return visited;
}`,

      cpp: `#include <iostream>
#include <vector>
#include <unordered_set>

using namespace std;

void dfs(int u, const vector<vector<int>>& adj, unordered_set<int>& visited) {
    visited.insert(u);
    for (int v : adj[u]) {
        if (visited.find(v) == visited.end()) {
            dfs(v, adj, visited);
        }
    }
}`,

      java: `import java.util.*;

public class DFS {
    public static void dfs(int u, List<List<Integer>> adj, boolean[] visited) {
        visited[u] = true;
        for (int v : adj.get(u)) {
            if (!visited[v]) {
                dfs(v, adj, visited);
            }
        }
    }
}`,

      rust: `use std::collections::HashSet;

fn dfs(adj: &Vec<Vec<usize>>, curr: usize, visited: &mut HashSet<usize>) {
    visited.insert(curr);
    for &next in &adj[curr] {
        if !visited.contains(&next) {
            dfs(adj, next, visited);
        }
    }
}`
    },
    pseudocode: [
      "1. Push start node onto Call Stack S / Mark start as Visited",
      "2. While S is not empty:",
      "     a. Pop top node u from S",
      "     b. Process node u",
      "     c. For each unvisited neighbor v of u:",
      "          i. Mark v as Visited",
      "         ii. Push v onto Stack S",
      "3. Backtrack automatically when a dead end is reached"
    ],
    mathFormulas: [
      {
        title: "Parenthesis Theorem",
        latexRepresentation: "d[u] < d[v] < f[v] < f[u]",
        explanation: "In any DFS forest, discovery time d and finish time f of node v are strictly nested inside node u if v is a descendant of u."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Push start node onto Stack S', type: 'start' },
      { id: '2', label: 'Is Stack S Empty?', type: 'decision' },
      { id: '3', label: 'Pop top node u', type: 'process' },
      { id: '4', label: 'For each unvisited neighbor v', type: 'process' },
      { id: '5', label: 'Push v to Stack & mark visited', type: 'process' },
      { id: '6', label: 'Backtrack on dead-end', type: 'end' }
    ]
  },

  {
    id: 'bellman-ford',
    name: 'Bellman-Ford Algorithm',
    tagline: 'Handles negative edge weights and detects negative cycles.',
    description: 'Relaxes all edges V-1 times. Capable of computing shortest paths on graphs with negative weights and flagging negative weight cycles.',
    overview: 'Unlike Dijkstra, Bellman-Ford can handle negative edge weights. By performing V-1 iterations of full edge relaxations, it guarantees shortest paths. An additional V-th iteration detects negative cycles.',
    category: 'Shortest Path',
    timeComplexity: 'O(V * E)',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: true,
    supportsWeights: true,
    usesHeuristic: false,
    color: 'amber',
    badge: 'Negative Weights OK',
    useCases: [
      'Financial Arbitrage Cycle Detection',
      'Distance Vector Routing Protocols (RIP)',
      'Graphs with Penalty or Discount Weights'
    ],
    codeSnippets: {
      python: `def bellman_ford(vertices, edges, start):
    dist = {v: float('inf') for v in vertices}
    dist[start] = 0

    for _ in range(len(vertices) - 1):
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Negative cycle check
    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            raise ValueError("Graph contains a negative weight cycle")

    return dist`,

      javascript: `function bellmanFord(vertices, edges, start) {
  const dist = {};
  vertices.forEach(v => dist[v] = Infinity);
  dist[start] = 0;

  for (let i = 0; i < vertices.length - 1; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
      }
    }
  }

  // Check for negative cycle
  for (const [u, v, w] of edges) {
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      return { hasNegativeCycle: true };
    }
  }

  return { dist, hasNegativeCycle: false };
}`,

      cpp: `#include <iostream>
#include <vector>

using namespace std;

struct Edge { int u, v, w; };

bool bellmanFord(int V, int start, const vector<Edge>& edges, vector<int>& dist) {
    dist.assign(V, 1e9);
    dist[start] = 0;

    for (int i = 0; i < V - 1; ++i) {
        for (const auto& edge : edges) {
            if (dist[edge.u] != 1e9 && dist[edge.u] + edge.w < dist[edge.v]) {
                dist[edge.v] = dist[edge.u] + edge.w;
            }
        }
    }

    for (const auto& edge : edges) {
        if (dist[edge.u] != 1e9 && dist[edge.u] + edge.w < dist[edge.v]) {
            return false; // Negative cycle detected
        }
    }
    return true;
}`,

      java: `import java.util.*;

public class BellmanFord {
    static class Edge {
        int u, v, w;
        Edge(int u, int v, int w) { this.u = u; this.v = v; this.w = w; }
    }

    public static boolean solve(int V, List<Edge> edges, int start) {
        int[] dist = new int[V];
        Arrays.fill(dist, 1000000000);
        dist[start] = 0;

        for (int i = 0; i < V - 1; i++) {
            for (Edge e : edges) {
                if (dist[e.u] != 1000000000 && dist[e.u] + e.w < dist[e.v]) {
                    dist[e.v] = dist[e.u] + e.w;
                }
            }
        }
        return true;
    }
}`,

      rust: `struct Edge { u: usize, v: usize, w: i32 }

fn bellman_ford(v_count: usize, edges: &[Edge], start: usize) -> Result<Vec<i32>, &'static str> {
    let mut dist = vec![i32::MAX; v_count];
    dist[start] = 0;

    for _ in 0..v_count - 1 {
        for e in edges {
            if dist[e.u] != i32::MAX && dist[e.u] + e.w < dist[e.v] {
                dist[e.v] = dist[e.u] + e.w;
            }
        }
    }
    Ok(dist)
}`
    },
    pseudocode: [
      "1. Set dist[start] = 0, dist[v] = Infinity for all other v",
      "2. Repeat V-1 times:",
      "     a. For each edge (u, v) with weight w:",
      "          i. If dist[u] + w < dist[v]:",
      "               dist[v] = dist[u] + w",
      "3. Check for negative cycles: Repeat edge check once more",
      "   If any dist[u] + w < dist[v], report Negative Cycle!"
    ],
    mathFormulas: [
      {
        title: "Bellman-Ford Relaxation",
        latexRepresentation: "d^{(k)}(v) = \\min\\Bigl(d^{(k-1)}(v),\\; \\min_{u} \\bigl(d^{(k-1)}(u) + w(u,v)\\bigr)\\Bigr)",
        explanation: "After k iterations, d(v) represents the shortest path using at most k edges."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Init dist[start]=0, others=∞', type: 'start' },
      { id: '2', label: 'Loop i from 1 to V-1', type: 'process' },
      { id: '3', label: 'Relax all E edges', type: 'process' },
      { id: '4', label: 'Iteration k == V-1 done?', type: 'decision' },
      { id: '5', label: 'Check 1 additional pass for dist[u]+w < dist[v]', type: 'decision' },
      { id: '6', label: 'Negative Cycle Detected / Valid Path', type: 'end' }
    ]
  },

  {
    id: 'floyd-warshall',
    name: 'Floyd-Warshall Algorithm',
    tagline: 'All-pairs shortest path dynamic programming matrix solver.',
    description: 'Computes shortest paths between every pair of vertices in O(V^3) time using a 2D distance matrix dynamic programming formulation.',
    overview: 'Floyd-Warshall compares all possible paths through the graph between each pair of vertices. It systematically updates a distance matrix dist[i][j] by asking if passing through intermediate vertex k yields a shorter path.',
    category: 'Shortest Path',
    timeComplexity: 'O(V^3)',
    spaceComplexity: 'O(V^2)',
    guaranteesShortestPath: true,
    supportsWeights: true,
    usesHeuristic: false,
    color: 'emerald',
    badge: 'All-Pairs Shortest Path',
    useCases: [
      'Dense Network Transitive Closure',
      'All-Pairs Distance Table Generation',
      'Matrix Transitive Connectivity Analysis'
    ],
    codeSnippets: {
      python: `def floyd_warshall(graph_matrix, V):
    dist = [row[:] for row in graph_matrix]

    for k in range(V):
        for i in range(V):
            for j in range(V):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]

    return dist`,

      javascript: `function floydWarshall(matrix, V) {
  const dist = matrix.map(row => [...row]);

  for (let k = 0; k < V; k++) {
    for (let i = 0; i < V; i++) {
      for (let j = 0; j < V; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  return dist;
}`,

      cpp: `#include <vector>
#include <algorithm>

using namespace std;

void floydWarshall(vector<vector<int>>& dist, int V) {
    for (int k = 0; k < V; ++k) {
        for (int i = 0; i < V; ++i) {
            for (int j = 0; j < V; ++j) {
                if (dist[i][k] != 1e9 && dist[k][j] != 1e9) {
                    dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
                }
            }
        }
    }
}`,

      java: `public class FloydWarshall {
    public static void solve(int[][] dist, int V) {
        for (int k = 0; k < V; k++) {
            for (int i = 0; i < V; i++) {
                for (int j = 0; j < V; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
    }
}`,

      rust: `fn floyd_warshall(dist: &mut Vec<Vec<i32>>, v: usize) {
    for k in 0..v {
        for i in 0..v {
            for j in 0..v {
                if dist[i][k] != i32::MAX && dist[k][j] != i32::MAX {
                    dist[i][j] = dist[i][j].min(dist[i][k] + dist[k][j]);
                }
            }
        }
    }
}`
    },
    pseudocode: [
      "1. Initialize dist[i][j] with edge weights or Infinity",
      "2. Set dist[i][i] = 0 for all i",
      "3. For k = 0 to V-1 (intermediate node):",
      "     a. For i = 0 to V-1 (source node):",
      "          i. For j = 0 to V-1 (destination node):",
      "               dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])",
      "4. Return distance matrix dist"
    ],
    mathFormulas: [
      {
        title: "Floyd-Warshall Recurrence",
        latexRepresentation: "d_{i,j}^{(k)} = \\min\\Bigl(d_{i,j}^{(k-1)},\\; d_{i,k}^{(k-1)} + d_{k,j}^{(k-1)}\\Bigr)",
        explanation: "DP state: minimum distance from i to j considering intermediate vertices from set {1, 2, ..., k}."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Init V x V Distance Matrix', type: 'start' },
      { id: '2', label: 'Outer Loop k = 0..V-1', type: 'process' },
      { id: '3', label: 'Inner Loops i & j = 0..V-1', type: 'process' },
      { id: '4', label: 'dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j])', type: 'process' },
      { id: '5', label: 'All loops complete?', type: 'decision' },
      { id: '6', label: 'Return All-Pairs Distance Matrix', type: 'end' }
    ]
  },

  {
    id: 'kruskal',
    name: "Kruskal's Algorithm",
    tagline: 'Greedy Minimum Spanning Tree builder using Union-Find.',
    description: 'Finds a Minimum Spanning Tree (MST) for a connected weighted graph by sorting all edges and greedily adding non-cycling edges via Disjoint Set Union (DSU).',
    overview: 'Kruskal’s algorithm processes edges in ascending order of weight. It uses a Union-Find data structure to prevent cycle formation, combining disjoint components until V-1 edges are included.',
    category: 'Minimum Spanning Tree',
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: false,
    supportsWeights: true,
    usesHeuristic: false,
    color: 'emerald',
    badge: 'Spanning Tree',
    useCases: [
      'Electrical Grid Power Line Cable Design',
      'Telecommunications Fiber Network Optimization',
      'Cluster Analysis & Hierarchical Dendrograms'
    ],
    codeSnippets: {
      python: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]
    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_i] = root_j
            return True
        return False

def kruskal(v_count, edges):
    edges.sort(key=lambda x: x[2]) # Sort by weight
    dsu = DSU(v_count)
    mst = []

    for u, v, w in edges:
        if dsu.union(u, v):
            mst.append((u, v, w))

    return mst`,

      javascript: `class DisjointSet {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(i) {
    if (this.parent[i] === i) return i;
    return this.parent[i] = this.find(this.parent[i]);
  }
  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
      return true;
    }
    return false;
  }
}

function kruskal(numVertices, edges) {
  edges.sort((a, b) => a.weight - b.weight);
  const dsu = new DisjointSet(numVertices);
  const mst = [];

  for (const { u, v, weight } of edges) {
    if (dsu.union(u, v)) {
      mst.push({ u, v, weight });
    }
  }
  return mst;
}`,

      cpp: `#include <vector>
#include <algorithm>

using namespace std;

struct Edge { int u, v, w; };

struct DSU {
    vector<int> parent;
    DSU(int n) { parent.resize(n); iota(parent.begin(), parent.end(), 0); }
    int find(int i) { return parent[i] == i ? i : parent[i] = find(parent[i]); }
    bool unite(int i, int j) {
        int rootI = find(i), rootJ = find(j);
        if (rootI != rootJ) { parent[rootI] = rootJ; return true; }
        return false;
    }
};

vector<Edge> kruskal(int V, vector<Edge>& edges) {
    sort(edges.begin(), edges.end(), [](Edge a, Edge b){ return a.w < b.w; });
    DSU dsu(V);
    vector<Edge> mst;
    for (auto& e : edges) {
        if (dsu.unite(e.u, e.v)) mst.push_back(e);
    }
    return mst;
}`,

      java: `import java.util.*;

public class Kruskal {
    static class Edge implements Comparable<Edge> {
        int u, v, w;
        Edge(int u, int v, int w) { this.u = u; this.v = v; this.w = w; }
        public int compareTo(Edge o) { return Integer.compare(this.w, o.w); }
    }
}`,

      rust: `struct DSU { parent: Vec<usize> }
impl DSU {
    fn new(n: usize) -> Self { DSU { parent: (0..n).collect() } }
    fn find(&mut self, i: usize) -> usize {
        if self.parent[i] == i { i }
        else { let p = self.parent[i]; self.parent[i] = self.find(p); self.parent[i] }
    }
}`
    },
    pseudocode: [
      "1. Sort all graph edges E in non-decreasing order of weight",
      "2. Initialize Disjoint Set Union (DSU) structure with V sets",
      "3. MST = []",
      "4. For each edge (u, v) in sorted E:",
      "     a. If DSU.find(u) != DSU.find(v):",
      "          i. Add (u, v) to MST",
      "         ii. DSU.union(u, v)",
      "5. Return Minimum Spanning Tree edges"
    ],
    mathFormulas: [
      {
        title: "Minimum Spanning Property",
        latexRepresentation: "W(\\text{MST}) = \\sum_{e \\in T} w(e) = \\min_{T'} \\sum_{e' \\in T'} w(e')",
        explanation: "Guarantees a spanning tree T that connects all vertices while minimizing total edge weight."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Sort all edges E by weight ascending', type: 'start' },
      { id: '2', label: 'Initialize Union-Find DSU', type: 'process' },
      { id: '3', label: 'Pop edge (u, v, w) with smallest weight', type: 'process' },
      { id: '4', label: 'Do u and v belong to same set?', type: 'decision' },
      { id: '5', label: 'Union sets and add edge to MST', type: 'process' },
      { id: '6', label: 'MST has V-1 edges?', type: 'decision' },
      { id: '7', label: 'Return MST', type: 'end' }
    ]
  },

  {
    id: 'prim',
    name: "Prim's Algorithm",
    tagline: 'Grows a Minimum Spanning Tree vertex-by-vertex using a min-heap.',
    description: 'Builds an MST starting from an arbitrary root vertex, greedily picking the minimum weight edge that connects a new vertex to the growing MST cut.',
    overview: 'Prim’s algorithm maintains a cut between vertices in the MST and those outside. At each step, it extracts the minimum weight edge spanning the cut using a priority queue, expanding the MST cut until all vertices are included.',
    category: 'Minimum Spanning Tree',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: false,
    supportsWeights: true,
    usesHeuristic: false,
    color: 'cyan',
    badge: 'Dense Graph MST',
    useCases: [
      'Dense Network Wiring & Cable Routing',
      'Circuit Board Trace Layout Minimization',
      'Approximation Algorithms for Traveling Salesperson (TSP)'
    ],
    codeSnippets: {
      python: `import heapq

def prims_mst(graph, start_vertex):
    mst_edges = []
    visited = {start_vertex}
    edges = [(cost, start_vertex, to) for to, cost in graph[start_vertex].items()]
    heapq.heapify(edges)

    while edges:
        cost, frm, to = heapq.heappop(edges)
        if to not in visited:
            visited.add(to)
            mst_edges.append((frm, to, cost))

            for next_to, next_cost in graph[to].items():
                if next_to not in visited:
                    heapq.heappush(edges, (next_cost, to, next_to))

    return mst_edges`,

      javascript: `function primsMST(graph, startNode) {
  const visited = new Set([startNode]);
  const pq = new PriorityQueue();
  const mst = [];

  for (const [neighbor, weight] of Object.entries(graph[startNode])) {
    pq.enqueue({ u: startNode, v: neighbor, weight }, weight);
  }

  while (!pq.isEmpty()) {
    const { u, v, weight } = pq.dequeue().element;
    if (visited.has(v)) continue;

    visited.add(v);
    mst.push({ u, v, weight });

    for (const [nextNeighbor, nextWeight] of Object.entries(graph[v])) {
      if (!visited.has(nextNeighbor)) {
        pq.enqueue({ u: v, v: nextNeighbor, weight: nextWeight }, nextWeight);
      }
    }
  }

  return mst;
}`,

      cpp: `#include <vector>
#include <queue>

using namespace std;

typedef pair<int, int> pii; // {weight, node}

int prims(int V, int start, const vector<vector<pii>>& adj) {
    vector<bool> visited(V, false);
    priority_queue<pii, vector<pii>, greater<pii>> pq;
    int totalWeight = 0;

    pq.push({0, start});

    while (!pq.empty()) {
        auto [w, u] = pq.top();
        pq.pop();

        if (visited[u]) continue;
        visited[u] = true;
        totalWeight += w;

        for (auto& edge : adj[u]) {
            if (!visited[edge.second]) {
                pq.push({edge.first, edge.second});
            }
        }
    }
    return totalWeight;
}`,

      java: `import java.util.*;

public class Prim {
    static class Node implements Comparable<Node> {
        int id, weight;
        Node(int id, int weight) { this.id = id; this.weight = weight; }
        public int compareTo(Node o) { return Integer.compare(this.weight, o.weight); }
    }
}`,

      rust: `use std::collections::BinaryHeap;

fn prims(adj: &Vec<Vec<(usize, usize)>>, start: usize) -> usize {
    let mut visited = vec![false; adj.len()];
    let mut heap = BinaryHeap::new();
    let mut total_weight = 0;

    heap.push(std::cmp::Reverse((0, start)));
    // Prim loop...
    total_weight
}`
    },
    pseudocode: [
      "1. Select arbitrary starting vertex s, mark visited[s] = true",
      "2. Add all edges incident to s into Min Priority Queue PQ",
      "3. While PQ is not empty and visited count < V:",
      "     a. Extract edge (u, v) with min weight from PQ",
      "     b. If v is already visited, continue",
      "     c. Mark v as visited, add (u, v) to MST",
      "     d. For each neighbor w of v:",
      "          i. If w not visited, push edge (v, w) into PQ",
      "4. Return Minimum Spanning Tree"
    ],
    mathFormulas: [
      {
        title: "Cut Property Invariant",
        latexRepresentation: "e^* = \\arg\\min_{e \\in \\text{Cut}(S, V \\setminus S)} w(e)",
        explanation: "In any cut (S, V \\ S) of a graph, the lightest edge e* spanning the cut is guaranteed to belong to the Minimum Spanning Tree."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Start at root node & mark visited', type: 'start' },
      { id: '2', label: 'Push incident edges to Min Heap', type: 'process' },
      { id: '3', label: 'Pop lightest edge (u, v)', type: 'process' },
      { id: '4', label: 'Is destination v visited?', type: 'decision' },
      { id: '5', label: 'Mark v visited & add edge to MST', type: 'process' },
      { id: '6', label: 'Return MST when V vertices included', type: 'end' }
    ]
  },

  {
    id: 'topological-sort',
    name: 'Topological Sort (Kahn’s Algo)',
    tagline: 'Linear ordering of DAG vertices respecting edge dependencies.',
    description: 'Produces a linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u -> v, u comes before v.',
    overview: 'Topological sorting uses indegree counts and a queue (Kahn’s algorithm) or DFS post-order. If a graph contains a cycle, topological sorting detects it as impossible.',
    category: 'Ordering & DAG',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    guaranteesShortestPath: false,
    supportsWeights: false,
    usesHeuristic: false,
    color: 'amber',
    badge: 'Dependency Solver',
    useCases: [
      'Build System Dependency Resolution (npm, cargo, make)',
      'University Course Prerequisite Scheduling',
      'Data Pipeline DAG Execution Ordering'
    ],
    codeSnippets: {
      python: `from collections import deque

def kahns_topological_sort(v_count, adj, indegree):
    queue = deque([i for i in range(v_count) if indegree[i] == 0])
    topo_order = []

    while queue:
        u = queue.popleft()
        topo_order.append(u)

        for v in adj[u]:
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)

    if len(topo_order) != v_count:
        raise ValueError("Graph contains a cycle!")

    return topo_order`,

      javascript: `function topologicalSort(numVertices, adj) {
  const indegree = new Array(numVertices).fill(0);
  for (let u = 0; u < numVertices; u++) {
    for (const v of adj[u]) indegree[v]++;
  }

  const queue = [];
  for (let i = 0; i < numVertices; i++) {
    if (indegree[i] === 0) queue.push(i);
  }

  const topoOrder = [];
  while (queue.length > 0) {
    const u = queue.shift();
    topoOrder.push(u);

    for (const v of adj[u]) {
      indegree[v]--;
      if (indegree[v] === 0) queue.push(v);
    }
  }

  return topoOrder.length === numVertices ? topoOrder : [];
}`,

      cpp: `#include <vector>
#include <queue>

using namespace std;

vector<int> topoSort(int V, vector<vector<int>>& adj) {
    vector<int> indegree(V, 0);
    for (int u = 0; u < V; ++u)
        for (int v : adj[u]) indegree[v]++;

    queue<int> q;
    for (int i = 0; i < V; ++i)
        if (indegree[i] == 0) q.push(i);

    vector<int> res;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        res.push_back(u);
        for (int v : adj[u]) {
            if (--indegree[v] == 0) q.push(v);
        }
    }
    return res;
}`,

      java: `import java.util.*;

public class TopologicalSort {
    public static List<Integer> sort(int V, List<List<Integer>> adj) {
        int[] indegree = new int[V];
        for (int u = 0; u < V; u++)
            for (int v : adj.get(u)) indegree[v]++;

        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < V; i++) if (indegree[i] == 0) q.add(i);

        List<Integer> result = new ArrayList<>();
        while (!q.isEmpty()) {
            int u = q.poll();
            result.add(u);
            for (int v : adj.get(u)) {
                if (--indegree[v] == 0) q.add(v);
            }
        }
        return result;
    }
}`,

      rust: `use std::collections::VecDeque;

fn topo_sort(v_count: usize, adj: &Vec<Vec<usize>>) -> Option<Vec<usize>> {
    let mut indegree = vec![0; v_count];
    for u in 0..v_count { for &v in &adj[u] { indegree[v] += 1; } }

    let mut q = VecDeque::new();
    for i in 0..v_count { if indegree[i] == 0 { q.push_back(i); } }

    let mut order = Vec::new();
    while let Some(u) = q.pop_front() {
        order.push(u);
        for &v in &adj[u] {
            indegree[v] -= 1;
            if indegree[v] == 0 { q.push_back(v); }
        }
    }
    if order.len() == v_count { Some(order) } else { None }
}`
    },
    pseudocode: [
      "1. Calculate indegree count for every vertex in G",
      "2. Enqueue all vertices with indegree == 0 into Queue Q",
      "3. While Q is not empty:",
      "     a. Dequeue u from Q, append u to TopoList",
      "     b. For each outgoing edge u -> v:",
      "          i. Decrement indegree[v]",
      "         ii. If indegree[v] == 0: Enqueue v into Q",
      "4. If TopoList length == V, return TopoList; else Cycle detected!"
    ],
    mathFormulas: [
      {
        title: "DAG Linear Ordering Condition",
        latexRepresentation: "(u, v) \\in E \\implies \\text{pos}(u) < \\text{pos}(v)",
        explanation: "For every directed edge from u to v, vertex u is positioned earlier in the output order than vertex v."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Calculate indegrees for all vertices', type: 'start' },
      { id: '2', label: 'Push nodes with indegree=0 to Queue', type: 'process' },
      { id: '3', label: 'Pop node u & append to sorted list', type: 'process' },
      { id: '4', label: 'Decrement neighbor indegrees', type: 'process' },
      { id: '5', label: 'Indegree == 0? Push to Queue', type: 'decision' },
      { id: '6', label: 'Check if processed count == V', type: 'end' }
    ]
  },

  {
    id: 'bidirectional',
    name: 'Bidirectional Search',
    tagline: 'Runs two concurrent searches from both Start and Goal.',
    description: 'Executes two simultaneous BFS/Dijkstra searches: one forward from the start node and one backward from the target node, meeting in the middle.',
    overview: 'By growing search frontiers from both ends, Bidirectional Search dramatically reduces the total number of explored vertices from O(b^d) down to O(2 * b^(d/2)), providing huge speedups.',
    category: 'Shortest Path',
    timeComplexity: 'O(b^(d/2))',
    spaceComplexity: 'O(b^(d/2))',
    guaranteesShortestPath: true,
    supportsWeights: true,
    usesHeuristic: false,
    color: 'rose',
    badge: 'Dual Frontier',
    useCases: [
      'Peer-to-Peer Graph Connectivity Checks',
      'Large Scale Social Graph Distance Calculation',
      'Speedy Map Routing Over Long Distances'
    ],
    codeSnippets: {
      python: `from collections import deque

def bidirectional_search(graph, start, target):
    q_start = deque([start])
    q_target = deque([target])
    
    vis_start = {start: None}
    vis_target = {target: None}

    while q_start and q_target:
        # Step forward
        curr_s = q_start.popleft()
        if curr_s in vis_target:
            return intersect_path(curr_s, vis_start, vis_target)

        for nxt in graph[curr_s]:
            if nxt not in vis_start:
                vis_start[nxt] = curr_s
                q_start.append(nxt)

        # Step backward
        curr_t = q_target.popleft()
        if curr_t in vis_start:
            return intersect_path(curr_t, vis_start, vis_target)

        for nxt in graph[curr_t]:
            if nxt not in vis_target:
                vis_target[nxt] = curr_t
                q_target.append(nxt)

    return None`,

      javascript: `function bidirectionalSearch(graph, start, target) {
  const qStart = [start];
  const qTarget = [target];
  const visStart = new Map([[start, null]]);
  const visTarget = new Map([[target, null]]);

  while (qStart.length > 0 && qTarget.length > 0) {
    const nodeS = qStart.shift();
    if (visTarget.has(nodeS)) return buildPath(nodeS, visStart, visTarget);

    for (const neighbor of graph[nodeS]) {
      if (!visStart.has(neighbor)) {
        visStart.set(neighbor, nodeS);
        qStart.push(neighbor);
      }
    }

    const nodeT = qTarget.shift();
    if (visStart.has(nodeT)) return buildPath(nodeT, visStart, visTarget);

    for (const neighbor of graph[nodeT]) {
      if (!visTarget.has(neighbor)) {
        visTarget.set(neighbor, nodeT);
        qTarget.push(neighbor);
      }
    }
  }
  return null;
}`,

      cpp: `#include <vector>
#include <queue>
#include <unordered_map>

using namespace std;

int bidirectionalBFS(int start, int target, const vector<vector<int>>& adj) {
    queue<int> q1, q2;
    unordered_map<int, int> vis1, vis2;
    q1.push(start); vis1[start] = 0;
    q2.push(target); vis2[target] = 0;

    while (!q1.empty() && !q2.empty()) {
        int u = q1.front(); q1.pop();
        if (vis2.count(u)) return vis1[u] + vis2[u];

        for (int v : adj[u]) {
            if (!vis1.count(v)) {
                vis1[v] = vis1[u] + 1;
                q1.push(v);
            }
        }

        int w = q2.front(); q2.pop();
        if (vis1.count(w)) return vis1[w] + vis2[w];

        for (int v : adj[w]) {
            if (!vis2.count(v)) {
                vis2[v] = vis2[w] + 1;
                q2.push(v);
            }
        }
    }
    return -1;
}`,

      java: `import java.util.*;

public class BidirectionalBFS {
    public static int search(int start, int target, List<List<Integer>> adj) {
        Queue<Integer> q1 = new LinkedList<>(), q2 = new LinkedList<>();
        Map<Integer, Integer> vis1 = new HashMap<>(), vis2 = new HashMap<>();

        q1.add(start); vis1.put(start, 0);
        q2.add(target); vis2.put(target, 0);

        while (!q1.isEmpty() && !q2.isEmpty()) {
            int u = q1.poll();
            if (vis2.containsKey(u)) return vis1.get(u) + vis2.get(u);

            for (int v : adj.get(u)) {
                if (!vis1.containsKey(v)) {
                    vis1.put(v, vis1.get(u) + 1);
                    q1.add(v);
                }
            }
        }
        return -1;
    }
}`,

      rust: `use std::collections::{VecDeque, HashMap};

fn bidirectional(adj: &Vec<Vec<usize>>, start: usize, target: usize) -> Option<usize> {
    let mut q1 = VecDeque::new(); let mut q2 = VecDeque::new();
    let mut vis1 = HashMap::new(); let mut vis2 = HashMap::new();

    q1.push_back(start); vis1.insert(start, 0);
    q2.push_back(target); vis2.insert(target, 0);

    while !q1.is_empty() && !q2.is_empty() {
        let u = q1.pop_front().unwrap();
        if let Some(&d2) = vis2.get(&u) { return Some(vis1[&u] + d2); }

        for &v in &adj[u] {
            if !vis1.contains_key(&v) {
                vis1.insert(v, vis1[&u] + 1);
                q1.push_back(v);
            }
        }
    }
    None
}`
    },
    pseudocode: [
      "1. Init forward queue Q_f from Start & backward queue Q_b from Target",
      "2. Track forward visited set V_f and backward visited set V_b",
      "3. Loop while both queues are non-empty:",
      "     a. Expand 1 node from Q_f:",
      "        If node exists in V_b -> Intersection found!",
      "     b. Expand 1 node from Q_b:",
      "        If node exists in V_f -> Intersection found!",
      "4. Stitch forward path (Start -> Intersection) + backward path (Intersection -> Target)"
    ],
    mathFormulas: [
      {
        title: "Search Tree Space Reduction",
        latexRepresentation: "O\\bigl(b^{d/2} + b^{d/2}\\bigr) \\ll O\\bigl(b^d\\bigr)",
        explanation: "Splitting a search depth d into two radius d/2 trees drastically shrinks total explored nodes exponentially."
      }
    ],
    flowchartNodes: [
      { id: '1', label: 'Init Start Queue & Target Queue', type: 'start' },
      { id: '2', label: 'Step 1 Node forward from Start Queue', type: 'process' },
      { id: '3', label: 'Does node exist in Target Visited Set?', type: 'decision' },
      { id: '4', label: 'Step 1 Node backward from Target Queue', type: 'process' },
      { id: '5', label: 'Intersection Node Found!', type: 'process' },
      { id: '6', label: 'Stitch Forward & Backward Paths', type: 'end' }
    ]
  }
];

export const ALGORITHMS_DATA = DETAILED_ALGORITHMS;

