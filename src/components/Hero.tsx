import React from 'react';
import { Play, ArrowRight, Cpu, Sparkles, Route, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import { HeroMiniVisualizer } from './HeroMiniVisualizer';

interface HeroProps {
  onOpenVisualizer: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenVisualizer, onNavigateSection }) => {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-slate-800/20 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Top Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs font-semibold backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interactive Pathfinding & Algorithm Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Visualize <br />
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Optimal Pathfinding
              </span>
              <br />
              in Real Time
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              GeoPath transforms graph theory into crisp, interactive spatial visualizers. Watch Dijkstra, A*, BFS, and DFS compute optimal trajectories step-by-step across custom grid terrains.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onOpenVisualizer}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all border border-slate-600/80 shadow-md flex items-center justify-center gap-2.5 cursor-pointer group"
                id="hero-explore-geopath-btn"
              >
                <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                Explore GeoPath Visualizer
              </button>

              <button
                onClick={() => onNavigateSection('algorithms')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-slate-800 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                id="hero-view-algorithms-btn"
              >
                <span>Supported Algorithms</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Cpu className="w-3.5 h-3.5 text-slate-300" />
                  4 Core Engines
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Dijkstra, A*, BFS & DFS
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Real-time Telemetry
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Node count & execution ms
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Route className="w-3.5 h-3.5 text-amber-400" />
                  Weighted Terrains
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Swamps, hills & mazes
                </div>
              </div>
            </div>
          </div>

          {/* Right Interactive Hero Canvas */}
          <div className="lg:col-span-6 w-full">
            <HeroMiniVisualizer onOpenFullVisualizer={onOpenVisualizer} />
          </div>

        </div>
      </div>
    </section>
  );
};
