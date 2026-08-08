import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Code, FileText, Cpu, GitFork, Play, RotateCcw, 
  Copy, Check, Layers, Activity, Navigation, Share2, Compass, CornerDownRight, RefreshCw, Sparkles
} from 'lucide-react';
import { DetailedAlgorithm, ProgrammingLanguage, MemoryLogStep, CellType, GridNode } from '../types';
import { DETAILED_ALGORITHMS } from '../data/algorithmsData';

interface AlgorithmDetailPageProps {
  algoId: string;
  onBack: () => void;
  onSelectAlgo?: (id: string) => void;
  onOpenMap?: () => void;
}

type TabType = 'code' | 'pseudocode' | 'math' | 'flowchart' | 'memory';

const LANGUAGE_LABELS: Record<ProgrammingLanguage, { label: string; icon: string }> = {
  python: { label: 'Python 3', icon: '🐍' },
  javascript: { label: 'JavaScript / TS', icon: '⚡' },
  cpp: { label: 'C++ 20', icon: '⚙️' },
  java: { label: 'Java 17', icon: '☕' },
  rust: { label: 'Rust 2021', icon: '🦀' }
};

// Color-based Syntax Highlighter Tokenizer for Code Snippets
const highlightSyntax = (line: string) => {
  if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
    return <span className="text-slate-500 italic font-mono">{line}</span>;
  }

  const tokenRegex = /(\b(?:def|class|return|if|else|elif|for|while|in|import|from|const|let|var|function|public|private|static|void|int|double|bool|fn|mut|struct|impl|use|pub|new|type)\b|\b(?:True|False|true|false|null|None|self|this)\b|(?:\/\/.*$|#.*$)|".*?"|'.*?'|\b\d+\b|\b[a-zA-Z_]\w*(?=\s*\())/g;

  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parts.push(line.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('//') || token.startsWith('#')) {
      parts.push(<span key={match.index} className="text-slate-500 italic font-mono">{token}</span>);
    } else if (token.startsWith('"') || token.startsWith("'")) {
      parts.push(<span key={match.index} className="text-amber-300 font-mono">{token}</span>);
    } else if (/\b(def|class|return|if|else|elif|for|while|in|import|from|const|let|var|function|public|private|static|void|int|double|bool|fn|mut|struct|impl|use|pub|new|type)\b/.test(token)) {
      parts.push(<span key={match.index} className="text-emerald-400 font-bold font-mono">{token}</span>);
    } else if (/\b(True|False|true|false|null|None|self|this)\b/.test(token)) {
      parts.push(<span key={match.index} className="text-purple-400 font-semibold font-mono">{token}</span>);
    } else if (/^\d+$/.test(token)) {
      parts.push(<span key={match.index} className="text-rose-400 font-mono">{token}</span>);
    } else if (/^[a-zA-Z_]\w*$/.test(token)) {
      parts.push(<span key={match.index} className="text-cyan-300 font-medium font-mono">{token}</span>);
    } else {
      parts.push(token);
    }

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < line.length) {
    parts.push(line.substring(lastIdx));
  }

  return parts;
};

// Generate Mermaid flowchart string for any algorithm
const generateMermaidCode = (algo: DetailedAlgorithm) => {
  if (algo.id === 'dijkstra') {
    return `flowchart TD
    A([Start: dist[start]=0]) --> B[Push (0, start) to PQ]
    B --> C{Is Priority Queue Empty?}
    C -- Yes --> Terminate[End: Return Unreachable]
    C -- No --> D[Pop node u with min distance]
    D --> E{Is u == Target?}
    E -- Yes --> Final([Reconstruct & Return Path])
    E -- No --> F[Examine adjacent edges (u, v)]
    F --> G{Is dist[u] + w(u,v) < dist[v]?}
    G -- Yes --> H[Update dist[v] & push v to PQ]
    G -- No --> LoopEdge[Next Neighbor Loop]
    H --> LoopEdge
    LoopEdge -->|Loop Back| C`;
  } else if (algo.id === 'astar') {
    return `flowchart TD
    A([Start: f(start) = g + h]) --> B[Push Start to OpenSet Priority Queue]
    B --> C{Is OpenSet Empty?}
    C -- Yes --> Terminate[End: Path Not Found]
    C -- No --> D[Pop node u with lowest f(u)]
    D --> E{Is u == Goal?}
    E -- Yes --> Final([Reconstruct Optimal Path])
    E -- No --> F[Inspect Neighbors v of u]
    F --> G{Tentative g(v) < Current g(v)?}
    G -- Yes --> H[Update g(v), f(v) = g + h, Push to OpenSet]
    G -- No --> LoopEdge[Next Neighbor Loop]
    H --> LoopEdge
    LoopEdge -->|Loop Back| C`;
  }
  return `flowchart TD
    A([Start Initialization]) --> B[Initialize Frontiers / State]
    B --> C{Queue / Frontier Empty?}
    C -- Yes --> Terminate[End: Return Result]
    C -- No --> D[Extract Next Candidate Node]
    D --> E{Is Goal Node?}
    E -- Yes --> Final([Reconstruct & Return Path])
    E -- No --> F[Explore Neighbor Connections]
    F --> G{Valid & Unvisited?}
    G -- Yes --> H[Update Distance & Enqueue]
    G -- No --> LoopEdge[Next Loop Step]
    H --> LoopEdge
    LoopEdge -->|Loop Back| C`;
};

export const AlgorithmDetailPage: React.FC<AlgorithmDetailPageProps> = ({ 
  algoId, 
  onBack, 
  onSelectAlgo,
  onOpenMap 
}) => {
  // Current algorithm index
  const algoIndex = DETAILED_ALGORITHMS.findIndex(a => a.id === algoId);
  const currentIndex = algoIndex >= 0 ? algoIndex : 0;
  const algorithm: DetailedAlgorithm = DETAILED_ALGORITHMS[currentIndex];

  const [selectedLang, setSelectedLang] = useState<ProgrammingLanguage>('python');
  const [activeTab, setActiveTab] = useState<TabType>('code');

  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [mermaidCopied, setMermaidCopied] = useState(false);
  const [flowchartMode, setFlowchartMode] = useState<'diagram' | 'mermaid'>('diagram');

  // Mouse Drag Resizer (Left Panel Width Percentage)
  const [splitRatio, setSplitRatio] = useState<number>(52);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Editable Grid Node positions
  const [startPos, setStartPos] = useState({ r: 2, c: 2 });
  const [targetPos, setTargetPos] = useState({ r: 9, c: 13 });
  const [wallNodes, setWallNodes] = useState<Set<string>>(() => {
    const defaultWalls = new Set<string>();
    // Default blue walls
    for (let c = 3; c <= 12; c++) defaultWalls.add(`4,${c}`);
    for (let c = 2; c <= 11; c++) {
      if (c !== 6) defaultWalls.add(`7,${c}`);
    }
    return defaultWalls;
  });

  // Animation & Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [speed] = useState<number>(30); // ms per step
  const [grid, setGrid] = useState<GridNode[][]>([]);
  const [memoryLogs, setMemoryLogs] = useState<MemoryLogStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stats, setStats] = useState({ visited: 0, pathLength: 0, status: 'Ready' });

  const ROWS = 12;
  const COLS = 16;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGrid = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setMemoryLogs([]);
    setCurrentStepIndex(-1);
    setStats({ visited: 0, pathLength: 0, status: 'Ready' });

    const newGrid: GridNode[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: GridNode[] = [];
      for (let c = 0; c < COLS; c++) {
        let type: CellType = 'empty';
        if (r === startPos.r && c === startPos.c) type = 'start';
        else if (r === targetPos.r && c === targetPos.c) type = 'target';
        else if (wallNodes.has(`${r},${c}`)) type = 'wall';

        row.push({
          row: r,
          col: c,
          type,
          distance: r === startPos.r && c === startPos.c ? 0 : Infinity,
          heuristic: Math.abs(r - targetPos.r) + Math.abs(c - targetPos.c),
          totalCost: Infinity,
          isVisited: false,
          previousNode: null,
          weight: 1
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  }, [startPos, targetPos, wallNodes]);

  // Reset/Initialize Grid
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeGrid();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [algorithm.id, startPos, targetPos, wallNodes, initializeGrid]);

  const handlePrevAlgo = () => {
    const prevIdx = (currentIndex - 1 + DETAILED_ALGORITHMS.length) % DETAILED_ALGORITHMS.length;
    if (onSelectAlgo) onSelectAlgo(DETAILED_ALGORITHMS[prevIdx].id);
  };

  const handleNextAlgo = () => {
    const nextIdx = (currentIndex + 1) % DETAILED_ALGORITHMS.length;
    if (onSelectAlgo) onSelectAlgo(DETAILED_ALGORITHMS[nextIdx].id);
  };

  // Resizer Bar Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = moveEvent.clientX - rect.left;
      const newRatio = (relativeX / rect.width) * 100;
      setSplitRatio(Math.max(25, Math.min(75, newRatio)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Node Editing Handlers
  const handleCellClick = (r: number, c: number) => {
    if (isRunning) return; // Non-editable while running

    if (r === targetPos.r && c === targetPos.c) return;

    const key = `${r},${c}`;
    if (wallNodes.has(key)) {
      const updated = new Set(wallNodes);
      updated.delete(key);
      setWallNodes(updated);
    } else {
      setStartPos({ r, c });
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (isRunning) return; // Non-editable while running

    if (r === startPos.r && c === startPos.c) return;

    const key = `${r},${c}`;
    if (wallNodes.has(key)) {
      const updated = new Set(wallNodes);
      updated.delete(key);
      setWallNodes(updated);
    }

    setTargetPos({ r, c });
  };

  const handleRunAnimation = () => {
    initializeGrid();
    setIsRunning(true);
    setStats(prev => ({ ...prev, status: 'Executing...' }));
    setActiveTab('memory');

    const logs: MemoryLogStep[] = [];
    let stepCount = 0;

    const visitedNodes: { r: number; c: number }[] = [];
    const queue: { r: number; c: number; dist: number }[] = [{ r: startPos.r, c: startPos.c, dist: 0 }];
    const visitedSet = new Set<string>();
    visitedSet.add(`${startPos.r},${startPos.c}`);

    logs.push({
      step: ++stepCount,
      action: 'Initialize Matrix Search',
      details: `Start: (${startPos.r},${startPos.c}), Target: (${targetPos.r},${targetPos.c}).`,
      memoryCellState: {
        queueSize: 1,
        visitedCount: 1,
        currentWorkingNode: `(${startPos.r},${startPos.c})`,
        distanceUpdate: `dist[${startPos.r}][${startPos.c}] = 0`,
        heapState: [`(${startPos.r},${startPos.c}) [dist: 0]`]
      },
      timestampMs: Date.now()
    });

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let foundTarget = false;
    const parentMap = new Map<string, string>();

    while (queue.length > 0 && !foundTarget) {
      if (algorithm.id === 'dijkstra' || algorithm.id === 'astar') {
        queue.sort((a, b) => {
          const costA = a.dist + (algorithm.id === 'astar' ? Math.abs(a.r - targetPos.r) + Math.abs(a.c - targetPos.c) : 0);
          const costB = b.dist + (algorithm.id === 'astar' ? Math.abs(b.r - targetPos.r) + Math.abs(b.c - targetPos.c) : 0);
          return costA - costB;
        });
      }

      const current = queue.shift()!;
      visitedNodes.push({ r: current.r, c: current.c });

      logs.push({
        step: ++stepCount,
        action: `Pop Node (${current.r}, ${current.c})`,
        details: `Pop node dist ${current.dist}. Checking 4 neighbors.`,
        memoryCellState: {
          queueSize: queue.length,
          visitedCount: visitedNodes.length,
          currentWorkingNode: `(${current.r},${current.c})`,
          distanceUpdate: `Inspecting neighbors of (${current.r},${current.c})`,
          heapState: queue.slice(0, 3).map(q => `(${q.r},${q.c}) [dist: ${q.dist}]`)
        },
        timestampMs: Date.now()
      });

      if (current.r === targetPos.r && current.c === targetPos.c) {
        foundTarget = true;
        logs.push({
          step: ++stepCount,
          action: 'Target Reached!',
          details: `Target Node (${targetPos.r},${targetPos.c}) popped. Traceback path.`,
          memoryCellState: {
            queueSize: queue.length,
            visitedCount: visitedNodes.length,
            currentWorkingNode: `(${targetPos.r},${targetPos.c})`,
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
          const isWall = wallNodes.has(key);

          if (!visitedSet.has(key) && !isWall) {
            visitedSet.add(key);
            parentMap.set(key, `${current.r},${current.c}`);
            const newDist = current.dist + 1;
            queue.push({ r: nr, c: nc, dist: newDist });

            logs.push({
              step: ++stepCount,
              action: `Push Neighbor (${nr}, ${nc})`,
              details: `dist[${nr}][${nc}] = ${newDist}. Added to queue.`,
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

    let stepIdx = 0;
    timerRef.current = setInterval(() => {
      if (stepIdx < visitedNodes.length) {
        const node = visitedNodes[stepIdx];
        setGrid(prevGrid => {
          const nextGrid = prevGrid.map(row => [...row]);
          if (
            !(node.r === startPos.r && node.c === startPos.c) &&
            !(node.r === targetPos.r && node.c === targetPos.c)
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
          status: `Exploring ${stepIdx + 1}/${visitedNodes.length}`
        });
        setCurrentStepIndex(stepIdx);
        stepIdx++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        
        let currKey = `${targetPos.r},${targetPos.c}`;
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
                !(pNode.r === startPos.r && pNode.c === startPos.c) &&
                !(pNode.r === targetPos.r && pNode.c === targetPos.c)
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
              status: 'Path Complete'
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

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(generateMermaidCode(algorithm));
    setMermaidCopied(true);
    setTimeout(() => setMermaidCopied(false), 2000);
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Helper render method for active tab content
  const renderTabContent = (tab: TabType) => {
    switch (tab) {
      case 'code':
        return (
          <div className="relative h-full flex flex-col">
            <div className="p-3 bg-[#111317] border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Language:</span>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as ProgrammingLanguage)}
                  className="bg-[#181a1f] text-white border border-zinc-700 hover:border-zinc-600 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none"
                  id="language-select-dropdown"
                >
                  {(Object.keys(LANGUAGE_LABELS) as ProgrammingLanguage[]).map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang].icon} {LANGUAGE_LABELS[lang].label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy Source Code"
                id="copy-code-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {/* Read-only syntax highlighted code box */}
            <div className="p-4 flex-1 bg-[#0b0c0e] overflow-auto select-text">
              <div className="text-slate-200 text-xs leading-relaxed font-mono">
                {algorithm.codeSnippets[selectedLang].split('\n').map((line, idx) => (
                  <div key={idx} className="table-row hover:bg-zinc-800/40">
                    <span className="table-cell text-slate-600 pr-3 select-none text-right font-mono text-[11px] w-8">
                      {idx + 1}
                    </span>
                    <span className="table-cell whitespace-pre">{highlightSyntax(line)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'pseudocode':
        return (
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            <div className="p-3 rounded-xl bg-[#111317] border border-zinc-800">
              <h3 className="text-xs font-bold text-white mb-0.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Step-by-Step Pseudocode Logic
              </h3>
              <p className="text-[11px] text-slate-400">High-level imperative breakdown for graph operations.</p>
            </div>
            <div className="space-y-2">
              {algorithm.pseudocode.map((line, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-[#121417] border border-zinc-800/80 font-mono text-xs text-slate-200 flex items-start gap-2.5 hover:border-zinc-700 transition-all"
                >
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold text-[10px] shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="leading-relaxed">{line}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'math':
        return (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#111317] border border-zinc-800 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Time Complexity</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{algorithm.timeComplexity}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#111317] border border-zinc-800 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Space Complexity</span>
                <span className="text-base font-bold text-amber-400 font-mono">{algorithm.spaceComplexity}</span>
              </div>
            </div>

            {algorithm.mathFormulas.map((form, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#121417] border border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-white block">{form.title}</span>
                <div className="p-2.5 rounded-lg bg-[#0b0c0e] border border-zinc-800 font-mono text-center text-emerald-300 text-xs overflow-x-auto">
                  {form.latexRepresentation}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{form.explanation}</p>
              </div>
            ))}
          </div>
        );

      case 'flowchart':
        return (
          <div className="p-4 overflow-y-auto h-full space-y-4">
            {/* Header & Sub-tab Switcher */}
            <div className="p-3 rounded-xl bg-[#111317] border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Decision Flowchart & Iterative Loops</h3>
                  <p className="text-[10px] text-slate-400">Condition blocks with YES/NO branches and circular loopback cycles.</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#0b0c0e] p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setFlowchartMode('diagram')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    flowchartMode === 'diagram' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                  id="flowchart-mode-diagram-btn"
                >
                  Diagram View
                </button>
                <button
                  onClick={() => setFlowchartMode('mermaid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    flowchartMode === 'mermaid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                  id="flowchart-mode-mermaid-btn"
                >
                  Mermaid Code
                </button>
              </div>
            </div>

            {flowchartMode === 'mermaid' ? (
              /* Mermaid Syntax View */
              <div className="p-4 rounded-2xl bg-[#0b0c0e] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> Mermaid Syntax Definition
                  </span>
                  <button
                    onClick={handleCopyMermaid}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    id="copy-mermaid-btn"
                  >
                    {mermaidCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {mermaidCopied ? 'Copied' : 'Copy Mermaid'}
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-[#121417] border border-zinc-800/80 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed select-text">
                  {generateMermaidCode(algorithm)}
                </pre>
              </div>
            ) : (
              /* Diagrammatic Rich View with Decision Diamonds & Loop Arrows */
              <div className="p-5 rounded-2xl bg-[#111317] border border-zinc-800 flex flex-col items-center space-y-5">
                
                {/* 1. START NODE */}
                <div className="w-full max-w-sm p-3 rounded-full bg-emerald-500/10 border-2 border-emerald-500/60 text-center shadow-lg">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                    🟢 START: Initialize Distance Matrix & Priority Queue
                  </span>
                </div>

                {/* Down Arrow */}
                <div className="w-0.5 h-4 bg-emerald-500/50 relative">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-emerald-400 rotate-45 absolute -bottom-1 -left-[3px]" />
                </div>

                {/* 2. DECISION CONDITION DIAMOND #1 */}
                <div className="relative w-full max-w-md p-4 rounded-2xl bg-[#161920] border-2 border-amber-500/50 text-center shadow-xl space-y-2">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                    Condition Block (Loop Test)
                  </div>
                  <h4 className="text-xs font-bold text-amber-200 font-mono">Is Priority Queue / OpenSet Empty?</h4>

                  {/* Branches */}
                  <div className="pt-2 grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-left">
                      <span className="font-bold text-rose-400 block mb-0.5">YES ➔ Exit</span>
                      <span>No path found or graph exhausted. Terminate.</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-right">
                      <span className="font-bold text-emerald-400 block mb-0.5">NO ➔ Continue</span>
                      <span>Extract node u with min tentative cost.</span>
                    </div>
                  </div>
                </div>

                {/* Down Arrow */}
                <div className="w-0.5 h-4 bg-zinc-700 relative">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-zinc-400 rotate-45 absolute -bottom-1 -left-[3px]" />
                </div>

                {/* 3. PROCESS STEP */}
                <div className="w-full max-w-md p-3 rounded-xl bg-[#14161a] border border-cyan-500/40 text-center space-y-1 shadow-md">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono block">Process Step</span>
                  <p className="text-xs font-semibold text-slate-200">Pop node <strong>u</strong> with minimum distance/cost</p>
                </div>

                {/* Down Arrow */}
                <div className="w-0.5 h-4 bg-zinc-700 relative">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-zinc-400 rotate-45 absolute -bottom-1 -left-[3px]" />
                </div>

                {/* 4. DECISION CONDITION DIAMOND #2 */}
                <div className="relative w-full max-w-md p-4 rounded-2xl bg-[#161920] border-2 border-amber-500/50 text-center shadow-xl space-y-2">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                    Condition Block (Goal Test)
                  </div>
                  <h4 className="text-xs font-bold text-amber-200 font-mono">Is node u == Target?</h4>

                  <div className="pt-2 grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-left">
                      <span className="font-bold text-emerald-400 block mb-0.5">YES ➔ Optimal Goal</span>
                      <span>Reconstruct path via parent links & return.</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-right">
                      <span className="font-bold text-amber-400 block mb-0.5">NO ➔ Expand Edges</span>
                      <span>Inspect all adjacent neighbors v of u.</span>
                    </div>
                  </div>
                </div>

                {/* Down Arrow */}
                <div className="w-0.5 h-4 bg-zinc-700 relative">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-zinc-400 rotate-45 absolute -bottom-1 -left-[3px]" />
                </div>

                {/* 5. RELAXATION / HEURISTIC PROCESS & LOOPBACK */}
                <div className="w-full max-w-md p-4 rounded-2xl bg-[#121417] border-2 border-emerald-500/40 text-center space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Edge Relaxation Loop</span>
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" /> Circular Cycle
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0b0c0e] border border-zinc-800 text-xs font-mono text-slate-200">
                    If <code>dist[u] + w(u,v) &lt; dist[v]</code> ➔ Update <code>dist[v]</code> & push v to Heap
                  </div>

                  {/* Circular Loop Back Connection Box */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2 font-mono font-bold">
                    <CornerDownRight className="w-4 h-4 text-emerald-400" />
                    <span>Loop Back ➔ Repeat next iteration at Priority Queue check</span>
                  </div>
                </div>

                {/* 6. END NODE */}
                <div className="w-full max-w-sm p-3 rounded-full bg-rose-500/10 border-2 border-rose-500/60 text-center shadow-lg mt-2">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                    🔴 END: Search Complete / Shortest Path Found
                  </span>
                </div>

              </div>
            )}
          </div>
        );

      case 'memory':
        return (
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            <div className="p-3 rounded-xl bg-[#111317] border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Memory Cell Trace
                </h3>
                <p className="text-[10px] text-slate-400">Live RAM mutations during search execution.</p>
              </div>
              <button
                onClick={handleRunAnimation}
                disabled={isRunning}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                id="tab-memory-run-btn"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                Run
              </button>
            </div>

            {memoryLogs.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#111317] border border-dashed border-zinc-800 text-center space-y-2">
                <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Click the play icon on the canvas to generate live memory trace logs.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {memoryLogs.map((log) => (
                  <div 
                    key={log.step}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                      log.step === currentStepIndex + 1
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : 'bg-[#111317] border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-emerald-400 font-mono">Step #{log.step}</span>
                      <span className="text-slate-400 font-mono">{log.action}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-[11px]">{log.details}</p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400 bg-[#0b0c0e] p-2 rounded-lg border border-zinc-800">
                      <div>Queue: <span className="text-white font-bold">{log.memoryCellState.queueSize}</span></div>
                      <div>Visited: <span className="text-white font-bold">{log.memoryCellState.visitedCount}</span></div>
                      <div className="col-span-2 text-emerald-300 font-bold">{log.memoryCellState.distanceUpdate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-[#0b0c0e] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      
      {/* 1. BREADCRUMB HEADER BAR */}
      <div className="h-11 bg-[#14161a] border-b border-zinc-800/90 px-3 flex items-center justify-between shrink-0 font-sans text-xs">
        
        {/* Left: Breadcrumbs & Algorithm Details */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={onBack}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700 shrink-0"
            id="breadcrumbs-back-catalog-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            Catalog
          </button>

          <span className="text-slate-600">/</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-emerald-400 font-mono text-[11px] font-semibold shrink-0">
            {algorithm.category}
          </span>
          <span className="text-slate-600">/</span>

          <div className="flex items-center gap-2 shrink-0">
            <h1 className="font-bold text-white text-xs sm:text-sm tracking-tight">{algorithm.name}</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              {algorithm.badge}
            </span>
          </div>
        </div>

        {/* Center: Previous / Next Algorithm Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-[#0b0c0e] px-2 py-1 rounded-xl border border-zinc-800">
          <button
            onClick={handlePrevAlgo}
            className="p-1 rounded-lg hover:bg-zinc-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Previous Algorithm"
            id="prev-algo-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 text-[11px] font-mono font-semibold text-slate-300">
            {currentIndex + 1} / {DETAILED_ALGORITHMS.length}
          </span>

          <button
            onClick={handleNextAlgo}
            className="p-1 rounded-lg hover:bg-zinc-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Next Algorithm"
            id="next-algo-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareLink}
            className="px-2.5 py-1 rounded-lg bg-[#181a1f] hover:bg-zinc-800 text-slate-300 hover:text-white text-xs font-semibold border border-zinc-700/80 flex items-center gap-1.5 transition-all cursor-pointer"
            id="share-link-btn"
          >
            {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
          </button>

          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
              id="header-open-gis-btn"
            >
              <Compass className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden sm:inline">GIS Map</span>
            </button>
          )}
        </div>

      </div>

      {/* 2. MAIN RESIZABLE WORKSPACE AREA */}
      <div ref={containerRef} className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT PANEL: Multi-Tab IDE View */}
        <div 
          className="flex flex-col bg-[#14161a] overflow-hidden transition-none border-b md:border-b-0 md:border-r border-zinc-800/80"
          style={{ width: window.innerWidth >= 768 ? `${splitRatio}%` : '100%' }}
        >
          {/* Tab Header */}
          <div className="px-3 py-2 bg-[#111317] border-b border-zinc-800/80 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-[#0b0c0e] p-1 rounded-xl border border-zinc-800/80">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'code' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
                id="tab-code-btn"
              >
                <Code className="w-3.5 h-3.5" />
                Code
              </button>

              <button
                onClick={() => setActiveTab('pseudocode')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'pseudocode' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
                id="tab-pseudocode-btn"
              >
                <FileText className="w-3.5 h-3.5" />
                Pseudocode
              </button>

              <button
                onClick={() => setActiveTab('math')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'math' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
                id="tab-math-btn"
              >
                <Layers className="w-3.5 h-3.5" />
                Math
              </button>

              <button
                onClick={() => setActiveTab('flowchart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'flowchart' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
                id="tab-flowchart-btn"
              >
                <GitFork className="w-3.5 h-3.5" />
                Flowchart
              </button>

              <button
                onClick={() => setActiveTab('memory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  activeTab === 'memory' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
                id="tab-memory-btn"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Memory
                {memoryLogs.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-hidden relative bg-[#0b0c0e]">
            {renderTabContent(activeTab)}
          </div>
        </div>

        {/* MOUSE DRAG RESIZER HANDLE BAR */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden md:flex w-2 hover:w-2.5 bg-[#14161a] hover:bg-emerald-500/80 cursor-col-resize transition-all shrink-0 items-center justify-center group z-30 select-none ${
            isDragging ? 'bg-emerald-400 w-2.5' : ''
          }`}
          title="Click and drag to resize panels"
        >
          <div className="w-0.5 h-8 rounded-full bg-zinc-600 group-hover:bg-slate-950 transition-colors" />
        </div>

        {/* RIGHT PANEL: Live Interactive Grid Canvas */}
        <div 
          className="flex-1 flex flex-col bg-[#0e1013] overflow-hidden p-3 md:p-4 space-y-3 relative"
          style={{ width: window.innerWidth >= 768 ? `${100 - splitRatio}%` : '100%' }}
        >
          {/* Interactive Matrix Grid Canvas Container */}
          <div className="flex-1 bg-[#0b0c0e] border border-zinc-800/80 rounded-2xl p-4 shadow-inner flex flex-col items-center justify-center overflow-auto relative min-h-[300px]">
            
            {/* FLOATING CIRCULAR ACTION BUTTONS & STATUS BADGE */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#14161a]/90 backdrop-blur-md p-1.5 rounded-full border border-zinc-800 shadow-xl">
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-[#0b0c0e] text-emerald-400 border border-zinc-800 font-bold">
                {stats.status}
              </span>

              {/* Circular Play / Run Icon Button */}
              <button
                onClick={handleRunAnimation}
                disabled={isRunning}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="Run Animation"
                id="floating-circular-run-btn"
              >
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              </button>

              {/* Circular Reset Icon Button */}
              <button
                onClick={initializeGrid}
                className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="Reset Grid"
                id="floating-circular-reset-btn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Editable Matrix Grid */}
            <div 
              className={`grid gap-1.5 w-full max-w-lg aspect-4/3 transition-opacity ${
                isRunning ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`
              }}
            >
              {grid.map((row, r) =>
                row.map((node, c) => {
                  let cellStyle = 'bg-[#181a1f] border-zinc-800/80 hover:border-zinc-600';
                  let content = null;

                  if (node.type === 'start') {
                    cellStyle = 'bg-emerald-500 text-slate-950 font-bold shadow-md scale-105 z-10 border-emerald-400';
                    content = <Navigation className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />;
                  } else if (node.type === 'target') {
                    cellStyle = 'bg-rose-500 text-white font-bold shadow-md scale-105 z-10 border-rose-400';
                  } else if (node.type === 'wall') {
                    cellStyle = 'bg-blue-600 border-blue-500 shadow-sm';
                  } else if (node.type === 'visited') {
                    cellStyle = 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400 animate-pulse';
                  } else if (node.type === 'path') {
                    cellStyle = 'bg-emerald-400 text-slate-950 font-bold shadow-md scale-105 z-10 border-emerald-300';
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleCellRightClick(e, r, c)}
                      className={`rounded-md border flex items-center justify-center text-[8px] transition-all duration-150 select-none ${cellStyle}`}
                      title={isRunning ? 'Grid locked during execution' : `(${r},${c}) Left-click: Start / Clear | Right-click: Target`}
                    >
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Matrix Legend & Interactive Edit Help Footer */}
          <div className="p-2.5 rounded-xl bg-[#14161a] border border-zinc-800 text-xs shrink-0 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-300">
              <span className="text-slate-400 font-bold">Edit Mode:</span>
              <span>🖱️ <strong>Left-Click:</strong> Move Start / Clear</span>
              <span>🖱️ <strong>Right-Click:</strong> Move Target</span>
              {isRunning && <span className="text-amber-400 font-bold">(Locked while animating)</span>}
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1 text-slate-300"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Start</div>
              <div className="flex items-center gap-1 text-slate-300"><div className="w-2.5 h-2.5 rounded bg-rose-500" /> Target</div>
              <div className="flex items-center gap-1 text-slate-300"><div className="w-2.5 h-2.5 rounded bg-blue-600 border border-blue-400" /> Wall</div>
              <div className="flex items-center gap-1 text-slate-300"><div className="w-2.5 h-2.5 rounded bg-emerald-400" /> Path</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
