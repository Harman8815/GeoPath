import React, { useState } from 'react';
import { Route, Play, Compass, Cpu, Layers, Menu, X, Sparkles, Globe, Grid } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'visualizer' | 'map' | 'algorithms';
  setActiveTab: (tab: 'home' | 'visualizer' | 'map' | 'algorithms') => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onNavigateSection }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (sectionId: string) => {
    setActiveTab('home');
    setMobileMenuOpen(false);
    setTimeout(() => {
      onNavigateSection(sectionId);
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#16181d]/90 border-b border-zinc-800 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group focus:outline-none cursor-pointer"
            id="nav-logo-btn"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#22252c] border border-zinc-700/80 group-hover:border-zinc-600 transition-all shadow-sm">
              <Route className="w-5 h-5 text-slate-200 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                GeoPath
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#22252c] text-slate-300 border border-zinc-700">
                  v2.0
                </span>
              </span>
              <span className="block text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                Spatial Pathfinding
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1c1f26]/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              id="nav-home-btn"
            >
              <Compass className="w-3.5 h-3.5 text-slate-300" />
              Overview
            </button>

            {/* NEW PAGE: Map Route Explorer Button */}
            <button
              onClick={() => {
                setActiveTab('map');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-800/50'
              }`}
              id="nav-map-page-btn"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Real Map Explorer
            </button>

            {/* Grid Visualizer Page */}
            <button
              onClick={() => {
                setActiveTab('visualizer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'visualizer'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              id="nav-grid-playground-btn"
            >
              <Grid className="w-3.5 h-3.5 text-slate-300" />
              Grid Matrix
            </button>

            <button
              onClick={() => {
                setActiveTab('algorithms');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'algorithms'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              id="nav-algorithms-btn"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              Algo Library
            </button>

            <button
              onClick={() => handleLinkClick('benchmarks')}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              id="nav-benchmarks-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Benchmarks
            </button>
          </nav>

          {/* Primary Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setActiveTab('map')}
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-300 active:scale-95 transition-all shadow-md cursor-pointer group"
              id="nav-launch-map-btn"
            >
              <Globe className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-12 transition-transform" />
              Open Map Explorer
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#11151e]/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 backdrop-blur-2xl animate-in slide-in-from-top duration-200">
          <button
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
            id="mobile-nav-home-btn"
          >
            <Compass className="w-4 h-4 text-slate-300" />
            Home Overview
          </button>

          <button
            onClick={() => {
              setActiveTab('map');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-bold text-emerald-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
            id="mobile-nav-map-btn"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            Real Map Route Explorer
          </button>

          <button
            onClick={() => {
              setActiveTab('visualizer');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
            id="mobile-nav-grid-btn"
          >
            <Grid className="w-4 h-4 text-slate-300" />
            Grid Matrix Playground
          </button>

          <button
            onClick={() => {
              setActiveTab('algorithms');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
            id="mobile-nav-algorithms-btn"
          >
            <Cpu className="w-4 h-4 text-slate-400" />
            Algo Catalog & Deep Dive
          </button>

          <button
            onClick={() => handleLinkClick('benchmarks')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
            id="mobile-nav-benchmarks-btn"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Performance Benchmarks
          </button>

          <div className="pt-2">
            <button
              onClick={() => {
                setActiveTab('map');
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-xl text-center text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 flex items-center justify-center gap-2 border border-emerald-300"
              id="mobile-nav-launch-btn"
            >
              <Globe className="w-4 h-4 text-slate-950" />
              Launch Real Map Explorer
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
