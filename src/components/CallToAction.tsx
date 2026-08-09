import React from 'react';
import { Play, Sparkles, Route, ArrowRight, Map } from 'lucide-react';

export const CallToAction: React.FC<{ onOpenVisualizer: () => void; onOpenMap: () => void }> = ({ onOpenVisualizer, onOpenMap }) => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 bg-[#16181d]/95 border border-zinc-800 backdrop-blur-2xl text-center overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              <span>Instant Interactive Sandbox</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Master Spatial <br />
              <span className="text-slate-200">
                Pathfinding Algorithms?
              </span>
            </h2>

            {/* Description */}
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Launch the interactive GeoPath playground. Place start and target coordinates, construct recursive mazes, add terrain weights, and run Dijkstra, A*, BFS, or DFS in real-time.
            </p>

            {/* Action CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenVisualizer}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all shadow-md border border-slate-600/80 flex items-center justify-center gap-2.5 cursor-pointer group"
                id="cta-launch-visualizer-btn"
              >
                <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                Launch GeoPath Visualizer Now
              </button>

              <button
                onClick={onOpenMap}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all shadow-md border border-emerald-300 flex items-center justify-center gap-2.5 cursor-pointer group"
                id="cta-open-gis-map-btn"
              >
                <Map className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
                Open GIS Map
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
