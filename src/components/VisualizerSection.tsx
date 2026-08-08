import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import {
  Play, RotateCcw, Trash2, MapPin, Navigation
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AlgorithmType, GridNode, HeuristicType, SimulationStats } from '../types';
import {
  createGrid, executeAlgorithm, generateRandomWalls,
  generateWeightedSwamps, generateRecursiveDivisionMaze, cloneGrid
} from '../utils/pathfinding';

export const VisualizerSection: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  const ROWS = 18;
  const COLS = 36;

  const [grid, setGrid] = useState<GridNode[][]>([]);
  const [startPos, setStartPos] = useState({ row: 8, col: 5 });
  const [targetPos, setTargetPos] = useState({ row: 8, col: 30 });

  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('astar');
  const [heuristic, setHeuristic] = useState<HeuristicType>('manhattan');
  const [toolMode, setToolMode] = useState<'wall' | 'weight' | 'start' | 'target'>('wall');
  const [speedMs, setSpeedMs] = useState<number>(15);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [draggingNodeType, setDraggingNodeType] = useState<'start' | 'target' | null>(null);

  const [stats, setStats] = useState<SimulationStats>({
    visitedNodesCount: 0,
    pathLength: 0,
    pathCost: 0,
    executionTimeMs: 0,
    status: 'idle',
  });

  const [hoveredNode, setHoveredNode] = useState<GridNode | null>(null);
  const animTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  const clearAnimTimeouts = useCallback(() => {
    animTimeoutRef.current.forEach(clearTimeout);
    animTimeoutRef.current = [];
  }, []);

  const resetGridToEmpty = useCallback(() => {
    clearAnimTimeouts();
    const newGrid = createGrid(ROWS, COLS, startPos, targetPos);
    setGrid(newGrid);
    setStats({
      visitedNodesCount: 0,
      pathLength: 0,
      pathCost: 0,
      executionTimeMs: 0,
      status: 'idle',
    });
  }, [startPos, targetPos, clearAnimTimeouts]);

  const resetPathOnly = () => {
    clearAnimTimeouts();
    setGrid((prev) =>
      prev.map((row) =>
        row.map((node) => ({
          ...node,
          isVisited: false,
          previousNode: null,
          type: node.type === 'visited' || node.type === 'visiting' || node.type === 'path' ? 'empty' : node.type,
        }))
      )
    );
    setStats({
      visitedNodesCount: 0,
      pathLength: 0,
      pathCost: 0,
      executionTimeMs: 0,
      status: 'idle',
    });
  };

  // Initialize Grid
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetGridToEmpty();
  }, [resetGridToEmpty]);

  // Mouse interaction for grid drawing / dragging nodes
  const handleMouseDown = (r: number, c: number) => {
    if (stats.status === 'running') return;
    setIsMouseDown(true);

    const cell = grid[r][c];
    if (cell.type === 'start') {
      setDraggingNodeType('start');
      return;
    }
    if (cell.type === 'target') {
      setDraggingNodeType('target');
      return;
    }

    toggleCell(r, c);
  };

  const handleMouseEnter = (r: number, c: number) => {
    setHoveredNode(grid[r][c]);
    if (!isMouseDown || stats.status === 'running') return;

    if (draggingNodeType === 'start') {
      if (grid[r][c].type !== 'target') {
        setStartPos({ row: r, col: c });
        setGrid((prev) => {
          const copy = cloneGrid(prev);
          copy.forEach((row) => row.forEach((n) => { if (n.type === 'start') n.type = 'empty'; }));
          copy[r][c].type = 'start';
          return copy;
        });
      }
      return;
    }

    if (draggingNodeType === 'target') {
      if (grid[r][c].type !== 'start') {
        setTargetPos({ row: r, col: c });
        setGrid((prev) => {
          const copy = cloneGrid(prev);
          copy.forEach((row) => row.forEach((n) => { if (n.type === 'target') n.type = 'empty'; }));
          copy[r][c].type = 'target';
          return copy;
        });
      }
      return;
    }

    toggleCell(r, c);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setDraggingNodeType(null);
  };

  const toggleCell = (r: number, c: number) => {
    setGrid((prev) => {
      const copy = cloneGrid(prev);
      const cell = copy[r][c];
      if (cell.type === 'start' || cell.type === 'target') return prev;

      if (toolMode === 'wall') {
        cell.type = cell.type === 'wall' ? 'empty' : 'wall';
        cell.weight = 1;
      } else if (toolMode === 'weight') {
        cell.type = cell.type === 'weight' ? 'empty' : 'weight';
        cell.weight = cell.type === 'weight' ? 5 : 1;
      } else if (toolMode === 'start') {
        copy.forEach((row) => row.forEach((n) => { if (n.type === 'start') n.type = 'empty'; }));
        cell.type = 'start';
        setStartPos({ row: r, col: c });
      } else if (toolMode === 'target') {
        copy.forEach((row) => row.forEach((n) => { if (n.type === 'target') n.type = 'empty'; }));
        cell.type = 'target';
        setTargetPos({ row: r, col: c });
      }
      return copy;
    });
  };

  // Run Visualizer Simulation
  const handleStartSimulation = () => {
    if (stats.status === 'running') return;
    clearAnimTimeouts();

    // Clean visualization artifacts
    const cleanGrid = grid.map((row) =>
      row.map((node) => ({
        ...node,
        isVisited: false,
        previousNode: null,
        type: node.type === 'visited' || node.type === 'visiting' || node.type === 'path' ? 'empty' : node.type,
      }))
    );

    const startNode = cleanGrid[startPos.row][startPos.col];
    const targetNode = cleanGrid[targetPos.row][targetPos.col];

    const { visitedNodesInOrder, shortestPath, executionTimeMs } = executeAlgorithm(
      selectedAlgo,
      cleanGrid,
      startNode,
      targetNode,
      heuristic
    );

    setStats({
      visitedNodesCount: visitedNodesInOrder.length,
      pathLength: shortestPath.length,
      pathCost: shortestPath.reduce((acc, curr) => acc + curr.weight, 0),
      executionTimeMs,
      status: 'running',
    });

    if (speedMs === 0) {
      // Instant execution mode
      const updatedGrid = cloneGrid(cleanGrid);
      visitedNodesInOrder.forEach((vNode) => {
        if (vNode.type !== 'start' && vNode.type !== 'target') {
          updatedGrid[vNode.row][vNode.col].type = 'visited';
        }
      });
      shortestPath.forEach((pNode) => {
        if (pNode.type !== 'start' && pNode.type !== 'target') {
          updatedGrid[pNode.row][pNode.col].type = 'path';
        }
      });
      setGrid(updatedGrid);
      setStats((prev) => ({ ...prev, status: shortestPath.length > 0 ? 'completed' : 'no-path' }));
      if (shortestPath.length > 0) confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      return;
    }

    // Step-by-step animation
    visitedNodesInOrder.forEach((vNode, index) => {
      const t = setTimeout(() => {
        setGrid((prev) => {
          const copy = cloneGrid(prev);
          if (copy[vNode.row][vNode.col].type !== 'start' && copy[vNode.row][vNode.col].type !== 'target') {
            copy[vNode.row][vNode.col].type = 'visited';
          }
          return copy;
        });

        // After all visited nodes animated, animate path
        if (index === visitedNodesInOrder.length - 1) {
          if (shortestPath.length === 0) {
            setStats((prev) => ({ ...prev, status: 'no-path' }));
            return;
          }

          shortestPath.forEach((pNode, pIndex) => {
            const pt = setTimeout(() => {
              setGrid((prev) => {
                const copy = cloneGrid(prev);
                if (copy[pNode.row][pNode.col].type !== 'start' && copy[pNode.row][pNode.col].type !== 'target') {
                  copy[pNode.row][pNode.col].type = 'path';
                }
                return copy;
              });

              if (pIndex === shortestPath.length - 1) {
                setStats((prev) => ({ ...prev, status: 'completed' }));
                confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
              }
            }, pIndex * 30);
            animTimeoutRef.current.push(pt);
          });
        }
      }, index * speedMs);
      animTimeoutRef.current.push(t);
    });
  };

  // Maze Generator Triggers
  const handleApplyMaze = (type: 'recursive' | 'swamp' | 'random') => {
    resetPathOnly();
    const baseGrid = createGrid(ROWS, COLS, startPos, targetPos);
    if (type === 'recursive') {
      const mGrid = generateRecursiveDivisionMaze(baseGrid);
      setGrid(mGrid);
    } else if (type === 'swamp') {
      const sGrid = generateWeightedSwamps(baseGrid, 0.28);
      setGrid(sGrid);
    } else {
      const rGrid = generateRandomWalls(baseGrid, 0.25);
      setGrid(rGrid);
    }
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6"
      onMouseUp={handleMouseUp}
    >
      {/* Visualizer Top Bar & Playground Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#16181d]/90 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-lg bg-[#22252c] hover:bg-[#2c303a] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
            id="back-to-home-btn"
          >
            ← Back to Overview
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              GeoPath Interactive Playground
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#22252c] text-slate-300 border border-zinc-700">
                18x36 Matrix
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={resetPathOnly}
            className="px-3 py-1.5 rounded-lg bg-[#22252c] hover:bg-[#2c303a] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
            id="reset-path-btn"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Reset Path
          </button>

          <button
            onClick={resetGridToEmpty}
            className="px-3 py-1.5 rounded-lg bg-[#22252c] hover:bg-[#2c303a] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
            id="clear-grid-btn"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Clear Grid
          </button>

          <button
            onClick={handleStartSimulation}
            disabled={stats.status === 'running'}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#22252c] hover:bg-[#2c303a] disabled:opacity-50 transition-all border border-zinc-700 flex items-center gap-2 cursor-pointer shadow-md"
            id="visualize-pathfinding-btn"
          >
            <Play className="w-4 h-4 fill-white" />
            {stats.status === 'running' ? 'Tracing Path...' : 'Visualize Pathfinding'}
          </button>
        </div>
      </div>

      {/* Control Panel Settings Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl bg-[#16181d]/80 border border-zinc-800 text-xs">
        
        {/* Algorithm Selector */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
            Algorithm Engine
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {(['astar', 'dijkstra', 'bfs', 'dfs'] as AlgorithmType[]).map((algo) => (
              <button
                key={algo}
                onClick={() => setSelectedAlgo(algo)}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedAlgo === algo
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
                id={`algo-select-${algo}`}
              >
                {algo === 'astar' ? 'A* Search' : algo === 'dijkstra' ? 'Dijkstra' : algo.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Heuristic Selector (Only if A*) */}
        <div className="md:col-span-3 space-y-1">
          <label className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
            Heuristic Metric
          </label>
          <select
            value={heuristic}
            onChange={(e) => setHeuristic(e.target.value as HeuristicType)}
            disabled={selectedAlgo !== 'astar'}
            className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl px-3 text-slate-200 font-medium focus:outline-none focus:border-slate-600 disabled:opacity-40"
            id="heuristic-select"
          >
            <option value="manhattan">Manhattan Distance (dx + dy)</option>
            <option value="euclidean">Euclidean Distance (Straight Line)</option>
            <option value="octile">Octile Distance (Diagonal)</option>
          </select>
        </div>

        {/* Speed Controller */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
            Animation Speed
          </label>
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl px-3 text-slate-200 font-medium focus:outline-none focus:border-slate-600"
            id="speed-select"
          >
            <option value={0}>Instant (0ms)</option>
            <option value={8}>Fast (8ms)</option>
            <option value={20}>Normal (20ms)</option>
            <option value={60}>Slow Motion (60ms)</option>
          </select>
        </div>

        {/* Maze Generators */}
        <div className="md:col-span-3 space-y-1">
          <label className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
            Maze & Terrain Generator
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleApplyMaze('recursive')}
              className="flex-1 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition-all cursor-pointer"
              id="maze-recursive-btn"
            >
              Recursive Maze
            </button>
            <button
              onClick={() => handleApplyMaze('swamp')}
              className="flex-1 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition-all cursor-pointer"
              id="maze-swamp-btn"
            >
              Swamps (5x)
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Tool Placement Bar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#121620]/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold text-[11px] uppercase">Active Tool:</span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setToolMode('wall')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                toolMode === 'wall' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tool-wall-btn"
            >
              █ Wall Block
            </button>
            <button
              onClick={() => setToolMode('weight')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                toolMode === 'weight' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tool-weight-btn"
            >
              ≈ Swamp Terrain (5x)
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-slate-300 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Start Node (Drag)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>Target Node (Drag)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
            <span>Visited Frontier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400" />
            <span>Optimal Route Path</span>
          </div>
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div className="p-4 rounded-2xl bg-[#0d1117] border border-slate-800 shadow-2xl overflow-x-auto select-none scrollbar-none">
        <div
          className="grid gap-1 min-w-[720px] mx-auto justify-center"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(18px, 1fr))`,
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((node, cIdx) => {
              let bgClass = 'bg-[#121620] border-slate-800/80 hover:bg-slate-800';
              let icon = null;

              if (node.type === 'start') {
                bgClass = 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm z-20 scale-105';
                icon = <MapPin className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />;
              } else if (node.type === 'target') {
                bgClass = 'bg-rose-500 text-white border-rose-400 shadow-sm z-20 scale-105';
                icon = <Navigation className="w-3.5 h-3.5 text-white stroke-[3]" />;
              } else if (node.type === 'wall') {
                bgClass = 'bg-slate-800 border-slate-700/80 shadow-inner';
              } else if (node.type === 'weight') {
                bgClass = 'bg-amber-950/80 border-amber-800/80 text-amber-400 font-bold';
                icon = <span className="text-[9px]">5x</span>;
              } else if (node.type === 'visited') {
                bgClass = 'bg-slate-800/70 border-slate-700/50 animate-pulse';
              } else if (node.type === 'path') {
                bgClass = 'bg-emerald-400 text-slate-950 border-emerald-300 z-10 scale-105';
              }

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onMouseDown={() => handleMouseDown(rIdx, cIdx)}
                  onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                  className={`aspect-square min-w-[18px] min-h-[18px] rounded-[4px] border flex items-center justify-center transition-all duration-150 cursor-pointer ${bgClass}`}
                >
                  {icon}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Telemetry Footer Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#121620]/90 border border-slate-800 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Status</span>
          <strong className={`text-sm ${
            stats.status === 'completed' ? 'text-emerald-400' :
            stats.status === 'no-path' ? 'text-rose-400' :
            stats.status === 'running' ? 'text-amber-400' : 'text-slate-300'
          }`}>
            {stats.status === 'completed' ? '✓ Route Found' :
             stats.status === 'no-path' ? '✗ No Route Possible' :
             stats.status === 'running' ? 'Searching...' : 'Idle'}
          </strong>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Visited Nodes</span>
          <strong className="text-sm text-slate-200">{stats.visitedNodesCount} nodes</strong>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Shortest Path Length</span>
          <strong className="text-sm text-emerald-400">{stats.pathLength} steps</strong>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Total Path Cost</span>
          <strong className="text-sm text-amber-400">{stats.pathCost} cost</strong>
        </div>

        <div className="col-span-2 md:col-span-1 p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Execution Speed</span>
          <strong className="text-sm text-slate-300">{stats.executionTimeMs.toFixed(2)} ms</strong>
        </div>
      </div>

      {/* Node Inspection Tooltip */}
      {hoveredNode && (
        <div className="text-[11px] text-slate-400 font-mono text-center pt-1">
          Node [{hoveredNode.row}, {hoveredNode.col}] | Type: {hoveredNode.type} | Weight: {hoveredNode.weight}
        </div>
      )}
    </div>
  );
};
