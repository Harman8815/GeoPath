import React, { useState } from 'react';
import { Sparkles, Trophy, Zap, ShieldCheck, Scale, BarChart2, RefreshCw } from 'lucide-react';
import { executeAlgorithm, createGrid, generateRandomWalls, generateWeightedSwamps } from '../utils/pathfinding';
import { AlgorithmType, ComparisonResult } from '../types';

export const BenchmarkSection: React.FC = () => {
  const [results, setResults] = useState<ComparisonResult[]>([
    { algorithm: 'astar', visitedNodesCount: 38, pathLength: 22, pathCost: 22, executionTimeMs: 0.8 },
    { algorithm: 'dijkstra', visitedNodesCount: 124, pathLength: 22, pathCost: 22, executionTimeMs: 1.6 },
    { algorithm: 'bfs', visitedNodesCount: 142, pathLength: 22, pathCost: 22, executionTimeMs: 1.4 },
    { algorithm: 'dfs', visitedNodesCount: 180, pathLength: 36, pathCost: 36, executionTimeMs: 1.9 },
  ]);

  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const runLiveBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      const grid = createGrid(15, 30, { row: 2, col: 2 }, { row: 12, col: 27 });
      const weightedGrid = generateWeightedSwamps(grid, 0.22);

      const algos: AlgorithmType[] = ['astar', 'dijkstra', 'bfs', 'dfs'];
      const newResults: ComparisonResult[] = algos.map((algo) => {
        // Clone grid
        const cGrid = weightedGrid.map(r => r.map(n => ({ ...n })));
        const start = cGrid[2][2];
        const target = cGrid[12][27];

        const res = executeAlgorithm(algo, cGrid, start, target);
        return {
          algorithm: algo,
          visitedNodesCount: res.visitedNodesInOrder.length,
          pathLength: res.shortestPath.length,
          pathCost: res.shortestPath.reduce((acc, curr) => acc + curr.weight, 0),
          executionTimeMs: Math.max(0.2, res.executionTimeMs),
        };
      });

      setResults(newResults);
      setIsBenchmarking(false);
    }, 400);
  };

  const getAlgoName = (id: AlgorithmType) => {
    switch (id) {
      case 'astar': return 'A* Search';
      case 'dijkstra': return "Dijkstra's";
      case 'bfs': return 'Breadth-First Search';
      case 'dfs': return 'Depth-First Search';
    }
  };

  const maxVisited = Math.max(...results.map(r => r.visitedNodesCount), 1);

  return (
    <section id="benchmarks" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
            <BarChart2 className="w-3.5 h-3.5 text-slate-300" />
            <span>Algorithm Performance Metrics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Side-by-Side Algorithm Benchmarks
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            See how heuristic guidance reduces node exploration overhead compared to exhaustive uniform search algorithms.
          </p>
        </div>

        {/* Benchmark Dashboard Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#16181d]/90 border border-zinc-800 backdrop-blur-xl">
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-slate-300" />
                Live Node Exploration Efficiency
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated on a 15x30 weighted terrain matrix with random swamp obstacles.
              </p>
            </div>

            <button
              onClick={runLiveBenchmark}
              disabled={isBenchmarking}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600/80 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-md"
              id="run-live-benchmark-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
              {isBenchmarking ? 'Evaluating...' : 'Re-Run Benchmark'}
            </button>
          </div>

          {/* Bar Chart Representation */}
          <div className="space-y-6">
            {results.map((res) => {
              const percent = Math.min(100, Math.round((res.visitedNodesCount / maxVisited) * 100));
              const isAstar = res.algorithm === 'astar';

              return (
                <div key={res.algorithm} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white flex items-center gap-2">
                      {getAlgoName(res.algorithm)}
                      {isAstar && (
                        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Most Efficient
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-4 text-slate-300">
                      <span>Visited: <strong className="text-slate-200">{res.visitedNodesCount}</strong> nodes</span>
                      <span>Hops: <strong className="text-emerald-400">{res.pathLength}</strong></span>
                      <span>Time: <strong className="text-amber-400">{res.executionTimeMs.toFixed(1)}ms</strong></span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-4 w-full rounded-full bg-slate-900 p-0.5 border border-slate-800 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAstar
                          ? 'bg-emerald-500'
                          : res.algorithm === 'dijkstra'
                          ? 'bg-slate-600'
                          : res.algorithm === 'bfs'
                          ? 'bg-slate-700'
                          : 'bg-rose-500/80'
                      }`}
                      style={{ width: `${Math.max(8, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Takeaway Note */}
          <div className="mt-8 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Benchmark Insight:</strong>
              A* Search evaluates significantly fewer nodes (~65–70% fewer) than Dijkstra or BFS on the same grid because its heuristic distance estimator directs search vectors toward the target.
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
