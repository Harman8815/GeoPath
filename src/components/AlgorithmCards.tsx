import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Info, Map } from 'lucide-react';
import { ALGORITHMS_DATA } from '../data/algorithmsData';
import { AlgorithmType } from '../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface AlgorithmCardsProps {
  onSelectAlgorithmForPlayground: (algo: AlgorithmType) => void;
  onOpenMap: () => void;
}

export const AlgorithmCards: React.FC<AlgorithmCardsProps> = ({ onSelectAlgorithmForPlayground, onOpenMap }) => {
  const [activeSimulation, setActiveSimulation] = useState<AlgorithmType | null>('astar');

  return (
    <section id="algorithms" className="py-20 relative">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-slate-300" />
            <span>Core Engines</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Supported Pathfinding Algorithms
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From classic greedy exploration to heuristic spatial optimization, GeoPath provides precise visual feedback on how each algorithm computes optimal paths.
          </p>
        </div>

        {/* Swiper Carousel */}
        <div className="algorithm-swiper-container relative">
          <Swiper
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView="auto"
            speed={400}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: false,
            }}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            modules={[EffectCoverflow, Autoplay, Navigation, Pagination]}
            className="algorithm-swiper"
          >
            {ALGORITHMS_DATA.map((algo) => {
              const isSimulating = activeSimulation === algo.id;

              return (
                <SwiperSlide key={algo.id} className="algorithm-slide">
                  <div
                    className={`relative group rounded-2xl p-6 bg-[#16181d]/90 border backdrop-blur-xl transition-all duration-500 flex flex-col justify-between max-w-[85vw] md:max-w-[520px] ${
                      isSimulating
                        ? 'border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                        : 'border-zinc-800 hover:border-zinc-700 hover:bg-[#1c1f26]/90'
                    }`}
                  >
                    {/* Header Tag & Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-slate-900 text-slate-300 border-slate-700">
                          {algo.badge}
                        </span>

                        {/* Guarantees Shortest Path Indicator */}
                        {algo.guaranteesShortestPath ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Guarantees Shortest Path
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-medium bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Does NOT Guarantee Shortest
                          </span>
                        )}
                      </div>

                      {/* Title & Tagline */}
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-slate-200 transition-colors">
                        {algo.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mb-3">
                        {algo.tagline}
                      </p>

                      {/* Description */}
                      <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        {algo.description}
                      </p>

                      {/* Complexities Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                            Time Complexity
                          </span>
                          <span className="text-slate-200 font-semibold">{algo.timeComplexity}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                            Space Complexity
                          </span>
                          <span className="text-slate-200 font-semibold">{algo.spaceComplexity}</span>
                        </div>
                      </div>

                      {/* Capabilities Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${
                          algo.supportsWeights
                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {algo.supportsWeights ? '✓ Weighted Terrain' : '✗ Unweighted Only'}
                        </span>

                        <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${
                          algo.usesHeuristic
                            ? 'bg-slate-800 text-emerald-300 border-slate-700'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {algo.usesHeuristic ? '✓ Heuristic Guided (h(n))' : '✗ No Heuristic'}
                        </span>
                      </div>

                      {/* Primary Use Cases */}
                      <div className="space-y-1.5 mb-6">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Common Applications:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {algo.useCases.map((useCase, idx) => (
                            <span key={idx} className="text-xs bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md border border-slate-800">
                              • {useCase}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setActiveSimulation(isSimulating ? null : algo.id)}
                        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                        {isSimulating ? 'Hide Visual Pattern' : 'Preview Search Shape'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={onOpenMap}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
                          id={`open-gis-map-${algo.id}`}
                        >
                          <Map className="w-3.5 h-3.5 text-slate-950" />
                          GIS Map
                        </button>
                        <button
                          onClick={() => onSelectAlgorithmForPlayground(algo.id)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-600/80 flex items-center gap-1.5 cursor-pointer"
                          id={`test-in-visualizer-${algo.id}`}
                        >
                          Run in Visualizer →
                        </button>
                      </div>
                    </div>

                    {/* Animated Expansion Shape Visualizer Preview */}
                    {isSimulating && (
                      <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                          <span>Exploration Expansion Shape</span>
                          <span className="text-[10px] text-slate-500">Simulated Beam</span>
                        </div>

                        <div className="h-16 relative rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                          {algo.id === 'astar' && (
                            <div className="w-full h-full flex items-center justify-between px-6 relative">
                              <div className="w-3 h-3 rounded-full bg-emerald-400" />
                              <div className="h-0.5 bg-emerald-400/80 flex-1 mx-2 relative animate-pulse" />
                              <div className="w-3 h-3 rounded-full bg-rose-500" />
                              <span className="absolute text-[10px] font-mono text-slate-300 bottom-1 left-1/2 -translate-x-1/2">
                                Heuristic Vector Beam (Focused)
                              </span>
                            </div>
                          )}

                          {algo.id === 'dijkstra' && (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full bg-slate-400 animate-ping absolute opacity-50" />
                              <div className="w-10 h-10 rounded-full border border-slate-500/60 animate-pulse absolute" />
                              <div className="w-14 h-14 rounded-full border border-slate-600/30 absolute" />
                              <span className="text-[10px] font-mono text-slate-300">
                                Uniform Concentric Ring Expansion
                              </span>
                            </div>
                          )}

                          {algo.id === 'bfs' && (
                            <div className="relative w-full h-full flex items-center justify-center gap-1">
                              <div className="w-2 h-8 rounded bg-slate-700/30" />
                              <div className="w-2 h-8 rounded bg-slate-700/60" />
                              <div className="w-2 h-8 rounded bg-slate-400 animate-pulse" />
                              <div className="w-2 h-8 rounded bg-slate-700/60" />
                              <div className="w-2 h-8 rounded bg-slate-700/30" />
                              <span className="absolute text-[10px] font-mono text-slate-300 bottom-1">
                                Level-by-Level FIFO Wavefront
                              </span>
                            </div>
                          )}

                          {algo.id === 'dfs' && (
                            <div className="relative w-full h-full flex items-center justify-between px-8">
                              <div className="w-2 h-2 rounded-full bg-rose-400" />
                              <div className="h-0.5 bg-rose-500 w-full mx-2 animate-pulse" />
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="absolute text-[10px] font-mono text-slate-300 bottom-1 left-1/2 -translate-x-1/2">
                                Deep Single Branch Exploration
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Custom Navigation Arrows */}
          <div className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-900/90 border border-zinc-700 hover:bg-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all backdrop-blur-xl shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-900/90 border border-zinc-700 hover:bg-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all backdrop-blur-xl shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
