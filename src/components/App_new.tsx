import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { BackgroundGraph } from './BackgroundGraph';
import { Hero } from './Hero';
import { AlgorithmCards } from './AlgorithmCards';
import { HowItWorks } from './HowItWorks';
import { BenchmarkSection } from './BenchmarkSection';
import { VisualizerSection } from './VisualizerSection';
import { AlgorithmCatalog } from './AlgorithmCatalog';
import { AlgorithmDetailPage } from './AlgorithmDetailPage';
import { CallToAction } from './CallToAction';
import { Footer } from './Footer';
import { AlgorithmType } from '../types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'visualizer' | 'map' | 'algorithms'>('home');
  const [selectedAlgoId, setSelectedAlgoId] = useState<string | null>(null);

  // Read URL query parameter on mount and handle browser back/forward buttons
  useEffect(() => {
    const parseUrlParam = () => {
      const params = new URLSearchParams(window.location.search);
      const algoParam = params.get('algo');
      if (algoParam) {
        setSelectedAlgoId(algoParam);
        setActiveTab('algorithms');
      } else {
        setSelectedAlgoId(null);
      }
    };

    parseUrlParam();

    const handlePopState = () => {
      parseUrlParam();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    // If returning from algorithm detail page, clear URL param
    if (selectedAlgoId) {
      handleBackToCatalog();
    }
    setActiveTab('home');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSelectAlgorithm = (algoId: string) => {
    setSelectedAlgoId(algoId);
    setActiveTab('algorithms');
    
    // Update URL query parameter without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('algo', algoId);
    window.history.pushState({}, '', url.toString());

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setSelectedAlgoId(null);
    
    // Remove URL query parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('algo');
    window.history.pushState({}, '', url.toString());

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAlgorithmForPlayground = (algo: AlgorithmType) => {
    handleSelectAlgorithm(algo);
  };

  const handleOpenMap = () => {
    window.location.href = '/map';
  };

  return (
    <div className="min-h-screen bg-[#121417] text-slate-100 font-sans antialiased selection:bg-slate-700 selection:text-white relative overflow-x-hidden">
      {/* Background radial grid pattern & canvas graph */}
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-50 z-0" />
      {activeTab === 'home' && <BackgroundGraph />}

      {activeTab === 'home' && (
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Responsive Header */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (selectedAlgoId) handleBackToCatalog();
              setActiveTab(tab);
            }}
            onNavigateSection={handleNavigateSection}
          />

          {/* Main Landing Page Content */}
          <main className="flex-grow">
            <Hero
              onOpenVisualizer={() => setActiveTab('map')}
              onOpenMap={handleOpenMap}
              onNavigateSection={handleNavigateSection}
            />

            <AlgorithmCards
              onSelectAlgorithmForPlayground={handleSelectAlgorithmForPlayground}
              onOpenMap={handleOpenMap}
            />

            <HowItWorks
              onOpenMap={handleOpenMap}
            />


            <CallToAction
              onOpenVisualizer={() => setActiveTab('map')}
              onOpenMap={handleOpenMap}
            />
          </main>

          {/* Minimalist Dark Footer */}
          <Footer
            onNavigateSection={handleNavigateSection}
            onOpenVisualizer={() => setActiveTab('map')}
            onOpenMap={handleOpenMap}
          />
        </div>
      )}


      {activeTab === 'visualizer' && (
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (selectedAlgoId) handleBackToCatalog();
              setActiveTab(tab);
            }}
            onNavigateSection={handleNavigateSection}
          />
          <main className="flex-grow max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 keep-scrolling-touch mt-4">
            <VisualizerSection onBackToHome={() => setActiveTab('home')} onOpenMap={handleOpenMap} />
          </main>
          <Footer
            onNavigateSection={handleNavigateSection}
            onOpenVisualizer={() => setActiveTab('map')}
            onOpenMap={handleOpenMap}
          />
        </div>
      )}

      {activeTab === 'algorithms' && (
        <div className="relative z-10 flex flex-col min-h-screen bg-[#121417]">
          <Navbar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (selectedAlgoId) handleBackToCatalog();
              setActiveTab(tab);
            }}
            onNavigateSection={handleNavigateSection}
          />
          <main className="flex-grow">
            {selectedAlgoId ? (
              <AlgorithmDetailPage
                algoId={selectedAlgoId}
                onBack={handleBackToCatalog}
                onSelectAlgo={handleSelectAlgorithm}
                onOpenMap={() => setActiveTab('map')}
              />
            ) : (
              <AlgorithmCatalog
                onSelectAlgorithm={handleSelectAlgorithm}
                onOpenMap={() => setActiveTab('map')}
              />
            )}
          </main>
          {!selectedAlgoId && (
            <Footer
              onNavigateSection={handleNavigateSection}
              onOpenVisualizer={() => setActiveTab('map')}
              onOpenMap={handleOpenMap}
            />
          )}
        </div>
      )}
    </div>
  );
}
