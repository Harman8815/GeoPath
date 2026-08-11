import React from 'react';
import { Route, Heart, Command, Cpu, Compass } from 'lucide-react';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenVisualizer: () => void;
  onOpenMap: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection, onOpenVisualizer, onOpenMap }) => {
  return (
    <footer className="relative bg-[#1214173f] border-t border-zinc-800 pt-16 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 border border-slate-700">
                <Route className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                GeoPath
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              GeoPath is an interactive pathfinding and graph algorithm visualization platform designed for real-time spatial path analysis, heuristic comparisons, and algorithm education.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Built with React 19 • Canvas API • Tailwind CSS</span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-slate-200 transition-colors"
                >
                  Home Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('algorithms')}
                  className="hover:text-slate-200 transition-colors"
                >
                  Supported Algorithms
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('how-it-works')}
                  className="hover:text-slate-200 transition-colors"
                >
                  4-Step Pipeline
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('benchmarks')}
                  className="hover:text-slate-200 transition-colors"
                >
                  Performance Benchmarks
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenVisualizer}
                  className="text-slate-300 hover:text-white font-semibold transition-colors"
                >
                  Launch Interactive Playground →
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenMap}
                  className="text-emerald-400 hover:text-white font-semibold transition-colors"
                >
                  Open GIS Map →
                </button>
              </li>
            </ul>
          </div>

          {/* Keyboard Shortcuts Guide */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5 text-slate-300" />
              Visualizer Shortcuts
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>Drag Node</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">Start / Target</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>Click / Drag</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">Wall Block</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>Swamp Tool</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 text-[10px]">5x Weight</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>A* Search</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">Manhattan</kbd>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GeoPath Pathfinding Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">API Specs</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
