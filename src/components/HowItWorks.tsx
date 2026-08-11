import React, { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Map,
  Share2,
  Cpu,
  Route,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface HowItWorksProps {
  onOpenMap: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenMap }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  interface Step {
    id: string;
    number: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    description: string;
    details: string[];
    previewGraphic: React.ReactNode;
  }

  const steps = useMemo(() => [
    {
      id: "map",
      number: "01",
      title: "Map & Terrain Grid",
      subtitle: "Define Spatial Boundaries",
      icon: Map,
      description:
        "Define your spatial environment: place start and target coordinates, construct impassable barrier walls, or assign weighted friction cells like traffic delays or swamp terrain.",
      details: [
        "Custom Start & Target Placement",
        "Impassable Obstacle Walls & Mazes",
        "Multi-cost Weighted Terrains (Traffic, Hills, Swamps)",
      ],
      previewGraphic: (
        <div className="grid grid-cols-6 gap-2 p-6 rounded-2xl bg-slate-950 border border-slate-800">
          {Array.from({ length: 24 }).map((_, i) => {
            let cellStyle = "bg-slate-900 border-slate-800";
            let label = "";

            if (i === 2) {
              cellStyle =
                "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm";
              label = "S";
            } else if (i === 21) {
              cellStyle =
                "bg-rose-500 text-white font-bold border-rose-400 shadow-sm";
              label = "T";
            } else if ([7, 8, 13, 14].includes(i)) {
              cellStyle = "bg-slate-800 border-slate-700";
              label = "█";
            } else if ([9, 15].includes(i)) {
              cellStyle = "bg-amber-950/80 text-amber-400 border-amber-800/60";
              label = "5x";
            }

            return (
              <div
                key={i}
                className={`aspect-square rounded-lg border flex items-center justify-center text-xs font-mono transition-all ${cellStyle}`}
              >
                {label}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "graph",
      number: "02",
      title: "Graph Transformation",
      subtitle: "Nodes & Weighted Edges",
      icon: Share2,
      description:
        "The spatial grid is transformed into a directed/undirected graph matrix. Every grid cell becomes a Node V, and adjacent traversable steps become weighted Edges E.",
      details: [
        "Adjacency Matrix & Neighbor Lists",
        "Edge Weight Calculation: Cost = Distance × Terrain Multiplier",
        "Spatial Coordinate Indexing (Row, Col)",
      ],
      previewGraphic: (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center relative min-h-[200px]">
          <div className="relative w-full max-w-xs h-36 flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
              N₁
            </div>

            <div className="flex-1 h-0.5 bg-slate-600 relative mx-2">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                w = 1.0
              </span>
            </div>

            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-mono font-bold text-slate-300 text-xs">
              N₂
            </div>

            <div className="flex-1 h-0.5 bg-slate-600 relative mx-2">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                w = 5.0
              </span>
            </div>

            <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center font-mono font-bold text-rose-400 text-xs">
              N₃
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "algorithm",
      number: "03",
      title: "Algorithm Execution",
      subtitle: "Priority Queue & Heuristics",
      icon: Cpu,
      description:
        "The selected algorithm expands outward from the start node. Priority queues evaluate total candidate costs f(n) = g(n) + h(n), recording predecessor pointers.",
      details: [
        "Priority Queue (Min-Heap / OpenSet)",
        "Heuristic Distance Calculation (Manhattan / Euclidean)",
        "Predecessor Node Pointer Tracing",
      ],
      previewGraphic: (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
            <span className="text-emerald-400 font-bold">OpenSet [0]:</span>
            <span>Node (2, 5) → f = 12.4 (g:4, h:8.4)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
            <span className="text-slate-200 font-bold">VisitedSet:</span>
            <span>42 Nodes Evaluated</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
            <span className="text-amber-400 font-bold">Current Node:</span>
            <span>Expanding Neighbors (N, S, E, W)</span>
          </div>
        </div>
      ),
    },
    {
      id: "route",
      number: "04",
      title: "Optimal Route Extraction",
      subtitle: "Path Trace & Telemetry",
      icon: Route,
      description:
        "Once the target node is reached, GeoPath backtracks through previous node pointers to render the optimal shortest path vector line and display search analytics.",
      details: [
        "Backtracking Pointer Reconstruction",
        "Shortest Path Cost & Hop Metrics",
        "Algorithm Search Efficiency Score",
      ],
      previewGraphic: (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Path Reconstruction Complete
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-500">Visited</span>
              <strong className="text-slate-200">48 Nodes</strong>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-500">
                Path Length
              </span>
              <strong className="text-emerald-400">18 Steps</strong>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-500">
                Search Time
              </span>
              <strong className="text-amber-400">1.8 ms</strong>
            </div>
          </div>
        </div>
      ),
    },
  ] as Step[], []);

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      steps.forEach((_, i) => {
        const stepEl = stepRefs.current[i];
        if (!stepEl) return;

        const isReversed = i % 2 === 1;

        gsap.fromTo(
          stepEl,
          {
            x: isReversed ? -120 : 120,
            opacity: 0,
            scale: 0.92,
          },
          {
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: stepEl,
              scroller: window,
              start: "top bottom-=10%",
              end: "top center",
              scrub: false,
              toggleActions: "play none none reverse",
              invalidateOnRefresh: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [steps]);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative bg-[#12141717] py-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Pipeline</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How GeoPath Visualizes Pathfinding
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From raw spatial grids to mathematical graph matrices and precision
            route extraction — scroll through the 4-stage pathfinding
            architecture.
          </p>
        </div>

        <div className="relative" ref={trackRef}>
          <div className="absolute left-1/2 top-0 bottom-0 hidden md:block w-px bg-slate-800 -translate-x-1/2" />

          <div className="relative z-20 flex justify-center gap-3 mb-16">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    stepRefs.current[index]?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  className={`
                    relative flex items-center justify-center
                    w-12 h-12 rounded-full border
                    transition-all duration-500 ease-out
                    cursor-pointer
                    hover:border-emerald-400 hover:text-emerald-400
                    ${
                      "bg-slate-900 border-slate-700 text-slate-500"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          <div className="space-y-24 md:space-y-32">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isReversed = index % 2 === 1;

              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  className={`
                    relative grid grid-cols-1 lg:grid-cols-12 gap-8
                    items-center p-8 sm:p-10 rounded-3xl
                    bg-[#16181d]/90 border border-zinc-800
                    backdrop-blur-xl
                  `}
                >
                  <div
                    className={`
                      lg:col-span-7 space-y-6
                      ${isReversed ? "lg:order-2" : "lg:order-1"}
                    `}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                      <Icon className="w-3.5 h-3.5" />
                      <span>Step {step.number}</span>
                      <span>•</span>
                      <span>{step.subtitle}</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {step.title}
                    </h3>

                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      {step.description}
                    </p>

                    <ul className="space-y-2.5 pt-2">
                      {step.details.map((detail, dIdx) => (
                        <li
                          key={dIdx}
                          className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium"
                        >
                          <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-bold">
                            ✓
                          </span>
                          {detail}
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4 flex items-center gap-3">
                      <button
                        onClick={onOpenMap}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all border border-emerald-300 shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Map className="w-3.5 h-3.5" />
                        Open GIS Map
                      </button>

                      <button
                        onClick={() => {
                          const nextIndex = (index + 1) % steps.length;
                          stepRefs.current[nextIndex]?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600/80 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <span>Next Pipeline Phase</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`
                      lg:col-span-5
                      ${isReversed ? "lg:order-1" : "lg:order-2"}
                    `}
                  >
                    {step.previewGraphic}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
