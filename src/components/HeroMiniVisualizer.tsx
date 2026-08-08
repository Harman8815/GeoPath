import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Play } from 'lucide-react';
import { AlgorithmType, GridNode } from '../types';
import { createGrid, executeAlgorithm, generateRandomWalls, generateWeightedSwamps } from '../utils/pathfinding';

export const HeroMiniVisualizer: React.FC<{ onOpenFullVisualizer: () => void }> = ({ onOpenFullVisualizer }) => {
  const ROWS = 10;
  const COLS = 20;

  const [grid, setGrid] = useState<GridNode[][]>([]);
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('astar');
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<{ visited: number; length: number; time: number } | null>(null);
  const [activePreset, setActivePreset] = useState<'default' | 'city' | 'swamp'>('city');

  const startPos = useMemo(() => ({ row: 2, col: 2 }), []);
  const targetPos = useMemo(() => ({ row: 7, col: 17 }), []);

  const initDefaultCityGrid = useCallback(() => {
    const newGrid = createGrid(ROWS, COLS, startPos, targetPos);
    const walls = [
      [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
      [1, 12], [2, 12], [3, 12], [4, 12], [5, 12],
      [5, 13], [5, 14], [5, 15],
      [7, 8], [8, 8], [9, 8],
    ];
    walls.forEach(([r, c]) => {
      if (r < ROWS && c < COLS && newGrid[r][c].type !== 'start' && newGrid[r][c].type !== 'target') {
        newGrid[r][c].type = 'wall';
      }
    });
    setGrid(newGrid);
    setStats(null);
    setActivePreset('city');
  }, [startPos, targetPos]);

  // Init grid on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initDefaultCityGrid();
  }, [initDefaultCityGrid]);

  const handleCellClick = (r: number, c: number) => {
    if (isRunning) return;
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(node => ({ ...node })));
      const targetCell = newGrid[r][c];
      if (targetCell.type === 'start' || targetCell.type === 'target') return prevGrid;

      if (targetCell.type === 'empty') {
        targetCell.type = 'wall';
      } else if (targetCell.type === 'wall') {
        targetCell.type = 'weight';
        targetCell.weight = 5;
      } else {
        targetCell.type = 'empty';
        targetCell.weight = 1;
      }
      return newGrid;
    });
  };

  const runMiniSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);

    // Reset previous path / visited states
    const cleanGrid = grid.map(row =>
      row.map(node => ({
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
      targetNode
    );

    let step = 0;
    const interval = setInterval(() => {
      if (step < visitedNodesInOrder.length) {
        const node = visitedNodesInOrder[step];
        if (node.type !== 'start' && node.type !== 'target') {
          setGrid(prev => {
            const copy = prev.map(r => r.map(n => ({ ...n })));
            if (copy[node.row][node.col].type !== 'start' && copy[node.row][node.col].type !== 'target') {
              copy[node.row][node.col].type = 'visited';
            }
            return copy;
          });
        }
        step++;
      } else {
        clearInterval(interval);
        // Highlight shortest path
        shortestPath.forEach((pNode, index) => {
          setTimeout(() => {
            setGrid(prev => {
              const copy = prev.map(r => r.map(n => ({ ...n })));
              if (copy[pNode.row][pNode.col].type !== 'start' && copy[pNode.row][pNode.col].type !== 'target') {
                copy[pNode.row][pNode.col].type = 'path';
              }
              return copy;
            });
            if (index === shortestPath.length - 1) {
              setIsRunning(false);
              setStats({
                visited: visitedNodesInOrder.length,
                length: shortestPath.length,
                time: executionTimeMs,
              });
            }
          }, index * 25);
        });

        if (shortestPath.length === 0) {
          setIsRunning(false);
          setStats({ visited: visitedNodesInOrder.length, length: 0, time: executionTimeMs });
        }
      }
    }, 12);
  };

  const handleApplyPreset = (preset: 'city' | 'swamp' | 'random') => {
    if (isRunning) return;
    if (preset === 'city') {
      initDefaultCityGrid();
    } else if (preset === 'swamp') {
      const base = createGrid(ROWS, COLS, startPos, targetPos);
      const swampGrid = generateWeightedSwamps(base, 0.25);
      setGrid(swampGrid);
      setActivePreset('swamp');
      setStats(null);
    } else {
      const base = createGrid(ROWS, COLS, startPos, targetPos);
      const randGrid = generateRandomWalls(base, 0.22);
      setGrid(randGrid);
      setActivePreset('default');
      setStats(null);
    }
  };

  return (
    <div className="relative group rounded-2xl p-1 bg-[#1c1f26] border border-zinc-800 shadow-xl">
      <div className="relative rounded-[14px] bg-[#16181d]/95 backdrop-blur-xl p-4 sm:p-5 overflow-hidden border border-zinc-800">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              Interactive Path Canvas
            </h3>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-[#121417] p-0.5 rounded-lg border border-zinc-800 text-[11px]">
              <button
                onClick={() => setSelectedAlgo('astar')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  selectedAlgo === 'astar' ? 'bg-[#22252c] text-white border border-zinc-700' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="mini-algo-astar"
              >
                A*
              </button>
              <button
                onClick={() => setSelectedAlgo('dijkstra')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  selectedAlgo === 'dijkstra' ? 'bg-[#22252c] text-white border border-zinc-700' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="mini-algo-dijkstra"
              >
                Dijkstra
              </button>
              <button
                onClick={() => setSelectedAlgo('bfs')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  selectedAlgo === 'bfs' ? 'bg-[#22252c] text-white border border-zinc-700' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="mini-algo-bfs"
              >
                BFS
              </button>
            </div>

            <button
              onClick={runMiniSimulation}
              disabled={isRunning}
              className="px-3 py-1 text-xs font-semibold text-white bg-[#22252c] hover:bg-[#2c303a] disabled:opacity-50 rounded-lg flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
              id="mini-run-pathfinder-btn"
            >
              <Play className="w-3 h-3 fill-white" />
              {isRunning ? 'Tracing...' : 'Run'}
            </button>
          </div>
        </div>

        {/* Grid Canvas Display */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div
            className="grid gap-1 justify-center mx-auto max-w-full"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(14px, 1fr))`,
            }}
          >
            {grid.map((row, rIdx) =>
              row.map((node, cIdx) => {
                let bgClass = 'bg-[#121417] border-zinc-800/80 hover:bg-[#22252c]';

                if (node.type === 'start') {
                  bgClass = 'bg-emerald-500 text-slate-950 shadow-sm border-emerald-400 scale-105 z-10';
                } else if (node.type === 'target') {
                  bgClass = 'bg-rose-500 text-white shadow-sm border-rose-400 scale-105 z-10';
                } else if (node.type === 'wall') {
                  bgClass = 'bg-[#2a2d36] border-zinc-700/80 rounded-sm shadow-inner';
                } else if (node.type === 'weight') {
                  bgClass = 'bg-amber-950/70 border-amber-800/60 text-amber-400';
                } else if (node.type === 'visited') {
                  bgClass = 'bg-[#22252c] border-zinc-700/50 animate-pulse';
                } else if (node.type === 'path') {
                  bgClass = 'bg-emerald-400 text-slate-950 border-emerald-300 scale-105 z-10';
                }

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={isRunning}
                    title={`Cell [${rIdx}, ${cIdx}] - ${node.type}`}
                    className={`aspect-square min-w-[16px] min-h-[16px] rounded-[3px] border flex items-center justify-center transition-all duration-150 cursor-pointer ${bgClass}`}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Preset Selector & Legend */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Start</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-slate-800" />
              <span>Wall</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Optimal Route</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Presets:</span>
            <button
              onClick={() => handleApplyPreset('city')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                activePreset === 'city' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Grid City
            </button>
            <button
              onClick={() => handleApplyPreset('swamp')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                activePreset === 'swamp' ? 'bg-slate-800 text-amber-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Weighted Terrain
            </button>
            <button
              onClick={() => handleApplyPreset('random')}
              className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Random
            </button>
          </div>
        </div>

        {/* Stats Telemetry Bar */}
        {stats && (
          <div className="mt-3 p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-1">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Visited: <strong className="text-slate-200">{stats.visited}</strong> nodes
              </span>
              <span className="text-slate-400">
                Route: <strong className="text-emerald-400">{stats.length}</strong> hops
              </span>
              <span className="text-slate-400">
                Time: <strong className="text-amber-400">{stats.time.toFixed(1)}ms</strong>
              </span>
            </div>
            <button
              onClick={onOpenFullVisualizer}
              className="text-slate-300 hover:text-white font-semibold text-[11px] flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              Full Playground →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
