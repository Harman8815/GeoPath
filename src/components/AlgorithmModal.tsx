import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, Code, FileText, Cpu, GitFork, Play, Pause, RotateCcw, 
  Copy, Check, ChevronDown, Sparkles, Layers, Activity, FastForward, Navigation, Hash
} from 'lucide-react';
import { DetailedAlgorithm, ProgrammingLanguage, MemoryLogStep, CellType, GridNode } from '../types';

interface AlgorithmModalProps {
  algorithm: DetailedAlgorithm;
  onClose: () => void;
}

type TabType = 'code' | 'pseudocode' | 'math' | 'flowchart' | 'memory';

const LANGUAGE_LABELS: Record<ProgrammingLanguage, { label: string; icon: string }> = {
  python: { label: 'Python 3', icon: '🐍' },
  javascript: { label: 'JavaScript / TS', icon: '⚡' },
  cpp: { label: 'C++ 20', icon: '⚙️' },
  java: { label: 'Java 17', icon: '☕' },
  rust: { label: 'Rust 2021', icon: '🦀' }
};

export const AlgorithmModal: React.FC<AlgorithmModalProps> = ({ algorithm, onClose }) => {
  const [selectedLang, setSelectedLang] = useState<ProgrammingLanguage>('python');
  const [activeTab, setActiveTab] = useState<TabType>('code');
  const [copied, setCopied] = useState(false);

  // Live Interactive Render UI State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(30); // ms per step
  const [grid, setGrid] = useState<GridNode[][]>([]);
  const [memoryLogs, setMemoryLogs] = useState<MemoryLogStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stats, setStats] = useState({ visited: 0, pathLength: 0, status: 'Idle' });

  const ROWS = 12;
  const COLS = 16;
  const START_POS = useMemo(() => ({ r: 2, c: 2 }), []);
  const TARGET_POS = useMemo(() => ({ r: 9, c: 13 }), []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGrid = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setMemoryLogs([]);
    setCurrentStepIndex(-1);
    setStats({ visited: 0, pathLength: 0, status: 'Idle' });

    const newGrid: GridNode[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: GridNode[] = [];
      for (let c = 0; c < COLS; c++) {
        let type: CellType = 'empty';
        if (r === START_POS.r && c === START_POS.c) type = 'start';
        else if (r === TARGET_POS.r && c === TARGET_POS.c) type = 'target';
        else if ((r === 4 && c >= 3 && c <= 12) || (r === 7 && c >= 2 && c <= 11 && c !== 6)) {
          type = 'wall';
        }

        row.push({
          row: r,
          col: c,
          type,
          distance: r === START_POS.r && c === START_POS.c ? 0 : Infinity,
          heuristic: Math.abs(r - TARGET_POS.r) + Math.abs(c - TARGET_POS.c),
          totalCost: Infinity,
          isVisited: false,
          previousNode: null,
          weight: 1
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  }, [START_POS, TARGET_POS]);

  // Initialize interactive grid
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeGrid();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [algorithm.id, initializeGrid]);

  // Run pathfinding animation and generate memory cell logs
  const handleRunAnimation = () => {
    initializeGrid();
    setIsRunning(true);
    setIsPaused(false);
    setStats(prev => ({ ...prev, status: 'Running...' }));
    
    // Automatically switch to memory tab so user sees live logs
    setActiveTab('memory');

    // Generate step-by-step trace simulation
    const logs: MemoryLogStep[] = [];
    let stepCount = 0;

    const visitedNodes: { r: number; c: number }[] = [];
    const queue: { r: number; c: number; dist: number }[] = [{ r: START_POS.r, c: START_POS.c, dist: 0 }];
    const visitedSet = new Set<string>();
    visitedSet.add(`${START_POS.r},${START_POS.c}`);

    logs.push({
      step: ++stepCount,
      action: 'Initialize Memory Structure',
      details: `Allocated Grid Matrix [${ROWS}x${COLS}], set Start Node (${START_POS.r},${START_POS.c}) dist=0.`,
      memoryCellState: {
        queueSize: 1,
        visitedCount: 1,
        currentWorkingNode: `(${START_POS.r},${START_POS.c})`,
        distanceUpdate: `dist[${START_POS.r}][${START_POS.c}] = 0`,
        heapState: [`(${START_POS.r},${START_POS.c}) [dist: 0]`]
      },
      timestampMs: Date.now()
    });

    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0]
    ];

    let foundTarget = false;
    const parentMap = new Map<string, string>();

    while (queue.length > 0 && !foundTarget) {
      // Sort for Dijkstra/A* simulation behavior
      if (algorithm.id === 'dijkstra' || algorithm.id === 'astar') {
        queue.sort((a, b) => {
          const costA = a.dist + (algorithm.id === 'astar' ? Math.abs(a.r - TARGET_POS.r) + Math.abs(a.c - TARGET_POS.c) : 0);
          const costB = b.dist + (algorithm.id === 'astar' ? Math.abs(b.r - TARGET_POS.r) + Math.abs(b.c - TARGET_POS.c) : 0);
          return costA - costB;
        });
      }

      const current = queue.shift()!;
      visitedNodes.push({ r: current.r, c: current.c });

      logs.push({
        step: ++stepCount,
        action: `Pop Heap/Queue Node (${current.r}, ${current.c})`,
        details: `Memory Cell Read: Extracted Node (${current.r},${current.c}) with accumulated distance ${current.dist}.`,
        memoryCellState: {
          queueSize: queue.length,
          visitedCount: visitedNodes.length,
          currentWorkingNode: `(${current.r},${current.c})`,
          distanceUpdate: `Examining neighbors of (${current.r},${current.c})`,
          heapState: queue.slice(0, 3).map(q => `(${q.r},${q.c}) [dist: ${q.dist}]`)
        },
        timestampMs: Date.now()
      });

      if (current.r === TARGET_POS.r && current.c === TARGET_POS.c) {
        foundTarget = true;
        logs.push({
          step: ++stepCount,
          action: 'Target Reached!',
          details: `Target Node (${TARGET_POS.r},${TARGET_POS.c}) popped from queue. Path construction phase initiated.`,
          memoryCellState: {
            queueSize: queue.length,
            visitedCount: visitedNodes.length,
            currentWorkingNode: `(${TARGET_POS.r},${TARGET_POS.c})`,
            distanceUpdate: 'Target Found',
            heapState: ['GOAL REACHED']
          },
          timestampMs: Date.now()
        });
        break;
      }

      for (const [dr, dc] of directions) {
        const nr = current.r + dr;
        const nc = current.c + dc;

        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const key = `${nr},${nc}`;
          // Check wall
          const isWall = (nr === 4 && nc >= 3 && nc <= 12) || (nr === 7 && nc >= 2 && nc <= 11 && nc !== 6);

          if (!visitedSet.has(key) && !isWall) {
            visitedSet.add(key);
            parentMap.set(key, `${current.r},${current.c}`);
            const newDist = current.dist + 1;
            queue.push({ r: nr, c: nc, dist: newDist });

            logs.push({
              step: ++stepCount,
              action: `Memory Write: Push Neighbor (${nr}, ${nc})`,
              details: `Edge Relaxation: dist[${nr}][${nc}] updated to ${newDist}. Added to priority queue.`,
              memoryCellState: {
                queueSize: queue.length,
                visitedCount: visitedNodes.length,
                currentWorkingNode: `(${nr},${nc})`,
                distanceUpdate: `dist[${nr}][${nc}] = ${newDist}`,
                heapState: queue.slice(0, 3).map(q => `(${q.r},${q.c}) [dist: ${q.dist}]`)
              },
              timestampMs: Date.now()
            });
          }
        }
      }
    }

    setMemoryLogs(logs);

    // Animate grid visuals step by step
    let stepIdx = 0;
    timerRef.current = setInterval(() => {
      if (stepIdx < visitedNodes.length) {
        const node = visitedNodes[stepIdx];
        setGrid(prevGrid => {
          const nextGrid = prevGrid.map(row => [...row]);
          if (
            !(node.r === START_POS.r && node.c === START_POS.c) &&
            !(node.r === TARGET_POS.r && node.c === TARGET_POS.c)
          ) {
            nextGrid[node.r][node.c] = {
              ...nextGrid[node.r][node.c],
              type: 'visited'
            };
          }
          return nextGrid;
        });
        setStats({
          visited: stepIdx + 1,
          pathLength: 0,
          status: `Exploring node ${stepIdx + 1}/${visitedNodes.length}`
        });
        setCurrentStepIndex(stepIdx);
        stepIdx++;
      } else {
        // Trace back path
        if (timerRef.current) clearInterval(timerRef.current);
        
        let currKey = `${TARGET_POS.r},${TARGET_POS.c}`;
        const path: { r: number; c: number }[] = [];
        while (currKey && parentMap.has(currKey)) {
          const [pr, pc] = currKey.split(',').map(Number);
          path.push({ r: pr, c: pc });
          currKey = parentMap.get(currKey)!;
        }

        let pIdx = 0;
        const pathInterval = setInterval(() => {
          if (pIdx < path.length) {
            const pNode = path[pIdx];
            setGrid(prevGrid => {
              const nextGrid = prevGrid.map(row => [...row]);
              if (
                !(pNode.r === START_POS.r && pNode.c === START_POS.c) &&
                !(pNode.r === TARGET_POS.r && pNode.c === TARGET_POS.c)
              ) {
                nextGrid[pNode.r][pNode.c] = {
                  ...nextGrid[pNode.r][pNode.c],
                  type: 'path'
                };
              }
              return nextGrid;
            });
            pIdx++;
          } else {
            clearInterval(pathInterval);
            setIsRunning(false);
            setStats({
              visited: visitedNodes.length,
              pathLength: path.length + 1,
              status: 'Completed Optimal Path!'
            });
          }
        }, 20);
      }
    }, speed);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(algorithm.codeSnippets[selectedLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[92vh] bg-[#16181d] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#121417]/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{algorithm.name}</h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {algorithm.badge}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-slate-300 border border-zinc-700 text-[10px] font-mono">
                  {algorithm.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">{algorithm.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
              id="close-algorithm-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split View Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT SIDE: Code Block, Memory Log, Pseudocode, Math & Flowchart (7 cols) */}
          <div className="lg:col-span-7 border-r border-zinc-800 flex flex-col h-full bg-[#121417]/60 overflow-hidden">
            
            {/* Navigation Tabs Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#181a1f] border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-1 bg-[#121417] p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'code' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                  id="tab-code-btn"
                >
                  <Code className="w-3.5 h-3.5" />
                  Code
                </button>
                <button
                  onClick={() => setActiveTab('pseudocode')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'pseudocode' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                  id="tab-pseudocode-btn"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Pseudocode
                </button>
                <button
                  onClick={() => setActiveTab('math')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'math' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                  id="tab-math-btn"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Math Formulas
                </button>
                <button
                  onClick={() => setActiveTab('flowchart')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'flowchart' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                  id="tab-flowchart-btn"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  Flowchart
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                    activeTab === 'memory' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                  id="tab-memory-btn"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Memory Log
                  {memoryLogs.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              </div>

              {/* Language Selection Dropdown (For Code Tab) */}
              {activeTab === 'code' && (
                <div className="relative flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Language:</span>
                  <div className="relative">
                    <select
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value as ProgrammingLanguage)}
                      className="appearance-none bg-[#121417] text-white border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium cursor-pointer focus:outline-none"
                      id="language-select-dropdown"
                    >
                      {(Object.keys(LANGUAGE_LABELS) as ProgrammingLanguage[]).map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_LABELS[lang].icon} {LANGUAGE_LABELS[lang].label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy Code"
                    id="copy-code-btn"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Tab Body View */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-4">
              
              {/* TAB 1: Non-Editable Source Code Block */}
              {activeTab === 'code' && (
                <div className="relative rounded-xl bg-[#0e1013] border border-zinc-800 p-4 overflow-x-auto shadow-inner">
                  <pre className="text-slate-200 text-xs leading-relaxed font-mono">
                    {algorithm.codeSnippets[selectedLang].split('\n').map((line, idx) => (
                      <div key={idx} className="table-row hover:bg-zinc-800/30">
                        <span className="table-cell text-slate-600 pr-4 select-none text-right font-mono text-[11px] w-8">
                          {idx + 1}
                        </span>
                        <span className="table-cell">{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              )}

              {/* TAB 2: Stepwise Pseudocode */}
              {activeTab === 'pseudocode' && (
                <div className="space-y-3 font-sans">
                  <div className="p-4 rounded-xl bg-[#181a1f] border border-zinc-800">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Algorithmic Pseudocode Breakdown
                    </h3>
                    <p className="text-xs text-slate-400">
                      Standard step-by-step logical sequence executed during pathfinding.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {algorithm.pseudocode.map((line, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-xl bg-[#14161a] border border-zinc-800/80 font-mono text-xs text-slate-200 hover:border-zinc-700 transition-all flex items-start gap-3"
                      >
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold text-[10px]">
                          Line {idx + 1}
                        </span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Mathematical Foundations & Formulas */}
              {activeTab === 'math' && (
                <div className="space-y-4 font-sans">
                  <div className="p-4 rounded-xl bg-[#181a1f] border border-zinc-800">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Mathematical Formulations & Complexity
                    </h3>
                    <p className="text-xs text-slate-400">
                      Formal definitions, edge relaxation equations, and Big-O efficiency metrics.
                    </p>
                  </div>

                  {/* Complexity Grid Card */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#14161a] border border-zinc-800 text-center">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Time Complexity</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{algorithm.timeComplexity}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#14161a] border border-zinc-800 text-center">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Space Complexity</span>
                      <span className="text-base font-bold text-amber-400 font-mono">{algorithm.spaceComplexity}</span>
                    </div>
                  </div>

                  {/* Math Formula Blocks */}
                  {algorithm.mathFormulas.map((form, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#14161a] border border-zinc-800 space-y-2">
                      <span className="text-xs font-bold text-slate-200 block">{form.title}</span>
                      <div className="p-3 rounded-lg bg-[#0e1013] border border-zinc-800 font-mono text-center text-emerald-300 text-sm overflow-x-auto">
                        {form.latexRepresentation}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{form.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: Flowchart Diagram */}
              {activeTab === 'flowchart' && (
                <div className="space-y-4 font-sans">
                  <div className="p-4 rounded-xl bg-[#181a1f] border border-zinc-800">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <GitFork className="w-4 h-4 text-emerald-400" />
                      Algorithm Decision Flowchart
                    </h3>
                    <p className="text-xs text-slate-400">
                      Visual execution pipeline from initialization to path reconstruction.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#14161a] border border-zinc-800 space-y-3">
                    {algorithm.flowchartNodes.map((node, idx) => (
                      <div key={node.id} className="flex flex-col items-center">
                        <div className={`w-full max-w-md p-3.5 rounded-xl border text-center transition-all shadow-sm ${
                          node.type === 'start' || node.type === 'end' 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                            : node.type === 'decision'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold rotate-0'
                            : 'bg-zinc-800/80 border-zinc-700 text-slate-200'
                        }`}>
                          <span className="text-xs font-mono">{node.label}</span>
                        </div>
                        {idx < algorithm.flowchartNodes.length - 1 && (
                          <div className="w-0.5 h-4 bg-zinc-700 my-1 relative">
                            <div className="w-1.5 h-1.5 border-r border-b border-zinc-400 rotate-45 absolute bottom-0 -left-[2.5px]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Memory Cell Execution Log (Populated on Run Animation!) */}
              {activeTab === 'memory' && (
                <div className="space-y-4 font-sans">
                  <div className="p-4 rounded-xl bg-[#181a1f] border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Memory Cell Execution Log
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Stepwise stack trace & RAM cell mutations recorded during animation.
                      </p>
                    </div>
                    <button
                      onClick={handleRunAnimation}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      id="run-animation-memory-btn"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      Run Animation
                    </button>
                  </div>

                  {memoryLogs.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#14161a] border border-dashed border-zinc-800 text-center space-y-3">
                      <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                      <div>
                        <p className="text-xs font-semibold text-slate-300">No Memory Logs Generated Yet</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                          Click &quot;Run Animation&quot; on the right panel to execute the pathfinder and capture live memory cell mutations in real time.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {memoryLogs.map((log) => (
                        <div 
                          key={log.step}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                            log.step === currentStepIndex + 1
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md'
                              : 'bg-[#14161a] border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-emerald-400 font-mono">Step #{log.step}</span>
                            <span className="text-slate-500 font-mono">{log.action}</span>
                          </div>
                          <p className="text-slate-200 font-sans leading-relaxed text-xs">{log.details}</p>
                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-slate-400 bg-[#0e1013] p-2 rounded-lg border border-zinc-800/80">
                            <div>Queue Size: <span className="text-white font-bold">{log.memoryCellState.queueSize}</span></div>
                            <div>Visited Count: <span className="text-white font-bold">{log.memoryCellState.visitedCount}</span></div>
                            <div className="col-span-2 text-emerald-300">State: {log.memoryCellState.distanceUpdate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* RIGHT SIDE: Interactive Render UI / Simulator Canvas (5 cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-[#16181d] overflow-y-auto space-y-4">
            
            {/* Render Canvas Header Controls */}
            <div className="p-4 rounded-2xl bg-[#121417] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Live Render UI Canvas
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                  {stats.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunAnimation}
                  disabled={isRunning}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  id="modal-run-animation-btn"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  Run Animation
                </button>

                <button
                  onClick={initializeGrid}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-zinc-700 cursor-pointer"
                  id="modal-reset-grid-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Reset
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-[#181a1f] border border-zinc-800 text-slate-400">
                  Visited Nodes: <span className="text-emerald-400 font-bold">{stats.visited}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#181a1f] border border-zinc-800 text-slate-400">
                  Path Length: <span className="text-emerald-400 font-bold">{stats.pathLength}</span>
                </div>
              </div>
            </div>

            {/* Grid Matrix Visualizer Screen */}
            <div className="relative rounded-2xl bg-[#0e1013] border border-zinc-800 p-3 shadow-inner flex items-center justify-center">
              <div 
                className="grid gap-1 w-full max-w-md mx-auto aspect-4/3"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`
                }}
              >
                {grid.map((row, r) =>
                  row.map((node, c) => {
                    let cellStyle = 'bg-[#181a1f] border-zinc-800/80';
                    let content = null;

                    if (node.type === 'start') {
                      cellStyle = 'bg-emerald-500 text-slate-950 font-bold shadow-md scale-105 z-10';
                      content = <Navigation className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />;
                    } else if (node.type === 'target') {
                      cellStyle = 'bg-rose-500 text-white font-bold shadow-md scale-105 z-10';
                    } else if (node.type === 'wall') {
                      cellStyle = 'bg-zinc-800 border-zinc-700';
                    } else if (node.type === 'visited') {
                      cellStyle = 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400 animate-pulse';
                    } else if (node.type === 'path') {
                      cellStyle = 'bg-emerald-400 text-slate-950 font-bold shadow-md scale-105 z-10';
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`rounded-sm border flex items-center justify-center text-[8px] transition-all duration-150 ${cellStyle}`}
                      >
                        {content}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Informational Legend */}
            <div className="p-4 rounded-2xl bg-[#121417] border border-zinc-800 text-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">Matrix Legend</span>
              <div className="flex flex-wrap gap-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="w-3 h-3 rounded bg-emerald-500" /> Start
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="w-3 h-3 rounded bg-rose-500" /> Target
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" /> Wall
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="w-3 h-3 rounded bg-emerald-950 border border-emerald-800" /> Visited
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="w-3 h-3 rounded bg-emerald-400" /> Path
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
