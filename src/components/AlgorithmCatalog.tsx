import React, { useState } from 'react';
import { Search, Sparkles, Cpu, Filter, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { DETAILED_ALGORITHMS } from '../data/algorithmsData';

interface AlgorithmCatalogProps {
  onSelectAlgorithm: (algoId: string) => void;
  onOpenMap?: () => void;
}

export const AlgorithmCatalog: React.FC<AlgorithmCatalogProps> = ({ onSelectAlgorithm }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Shortest Path', 'Graph Traversal', 'Minimum Spanning Tree', 'Ordering & DAG'];

  const filteredAlgorithms = DETAILED_ALGORITHMS.filter((algo) => {
    const matchesCategory = selectedCategory === 'All' || algo.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      algo.name.toLowerCase().includes(query) ||
      algo.tagline.toLowerCase().includes(query) ||
      algo.description.toLowerCase().includes(query) ||
      algo.category.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#121417] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Code & Math Library</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Algorithm Catalog & Deep Dive
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Explore 10+ graph pathfinding and spanning tree algorithms with non-editable multi-language code snippets, memory cell execution logs, step-by-step flowcharts, and mathematical formulas.
          </p>
        </div>

        {/* Search Bar & Category Filter Controls Bar */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#16181d]/90 border border-zinc-800 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input Field */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search algorithms by name, keyword, or complexity..."
                className="w-full h-11 pl-10 pr-4 bg-[#121417] border border-zinc-700 hover:border-zinc-600 focus:border-emerald-400 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                id="algorithm-catalog-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Result Counter Badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 self-end md:self-auto">
              <span>Found <strong className="text-emerald-400">{filteredAlgorithms.length}</strong> algorithms</span>
            </div>

          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-[#121417] text-slate-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
                id={`filter-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlgorithms.map((algo) => (
            <div
              key={algo.id}
              className="relative group rounded-3xl p-6 bg-[#16181d]/90 border border-zinc-800 hover:border-zinc-700 hover:bg-[#1c1f26]/90 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xl hover:shadow-2xl"
            >
              {/* Card Top Details */}
              <div className="space-y-4">
                
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800/90 text-slate-300 border border-zinc-700/80 text-[10px] font-mono font-semibold">
                    {algo.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    {algo.badge}
                  </span>
                </div>

                {/* Name & Tagline */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    {algo.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{algo.tagline}</p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 bg-[#121417]/80 p-3 rounded-2xl border border-zinc-800/80">
                  {algo.description}
                </p>

                {/* Metrics Badges */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded-xl bg-[#121417] border border-zinc-800 flex items-center justify-between">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-emerald-400 font-bold">{algo.timeComplexity}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121417] border border-zinc-800 flex items-center justify-between">
                    <span className="text-slate-400">Space:</span>
                    <span className="text-amber-400 font-bold">{algo.spaceComplexity}</span>
                  </div>
                </div>

                {/* Sample Use Cases */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Applications</span>
                  <ul className="space-y-1">
                    {algo.useCases.slice(0, 2).map((useCase, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Bottom Card Action */}
              <div className="pt-4 border-t border-zinc-800/80">
                <button
                  onClick={() => onSelectAlgorithm(algo.id)}
                  className="w-full py-3 rounded-2xl bg-[#22252c] hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs transition-all duration-200 border border-zinc-700 hover:border-emerald-400 flex items-center justify-center gap-2 cursor-pointer shadow-md group/btn"
                  id={`read-more-${algo.id}-btn`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-400 group-hover/btn:text-slate-950 transition-colors" />
                  Read More & Run Interactive
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Empty Search Fallback */}
        {filteredAlgorithms.length === 0 && (
          <div className="p-12 rounded-3xl bg-[#16181d] border border-zinc-800 text-center space-y-3">
            <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No algorithms found matching &quot;{searchQuery}&quot;</h3>
            <p className="text-xs text-slate-400">Try adjusting your search terms or choosing a different category filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
