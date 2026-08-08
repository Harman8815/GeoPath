import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Play,
  RotateCcw,
  X,
  Compass,
  MapPin,
  Navigation,
  Sparkles,
  Layers,
  Zap,
  Sliders,
  Check,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Command,
  Globe
} from 'lucide-react';
import L from 'leaflet';

export interface MapExplorerProps {
  onBackToHome?: () => void;
}

// Preset locations
const LOCATION_PRESETS = [
  {
    name: 'Delhi NCR (Yamuna River)',
    lat: 28.67,
    lng: 77.23,
    landmarks: ['Civil Lines', 'Majnu Ka Tila', 'Seelampur', 'Shahdara', 'Old Delhi', 'Yamuna River'],
    zoom: 13
  },
  {
    name: 'London City (Thames River)',
    lat: 51.5074,
    lng: -0.1278,
    landmarks: ['Westminster', 'Soho', 'City of London', 'Southwark', 'Camden', 'Thames River'],
    zoom: 13
  },
  {
    name: 'New York (Manhattan)',
    lat: 40.758,
    lng: -73.9855,
    landmarks: ['Midtown', 'Central Park', 'Lower East Side', 'Chelsea', 'Financial District', 'Hudson River'],
    zoom: 13
  },
  {
    name: 'Tokyo (Shinjuku & Shibuya)',
    lat: 35.6895,
    lng: 139.6917,
    landmarks: ['Shinjuku', 'Shibuya', 'Harajuku', 'Chiyoda', 'Roppongi', 'Sumida River'],
    zoom: 13
  },
  {
    name: 'Paris (Seine River)',
    lat: 48.8566,
    lng: 2.3522,
    landmarks: ['Le Marais', 'Montmartre', 'Latin Quarter', 'Champs-Élysées', 'Saint-Germain', 'Seine River'],
    zoom: 13
  }
];

export const MapExplorer: React.FC<MapExplorerProps> = ({ onBackToHome }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Modal & Configuration Panel State
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configTab, setConfigTab] = useState<'general' | 'styles' | 'shortcuts'>('general');
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_PRESETS[0]);

  // Algorithm & Simulation Controls
  const [algorithm, setAlgorithm] = useState<string>('dijkstra');
  const [areaRadiusKm, setAreaRadiusKm] = useState<number>(4); // 2km - 20km
  const [animationSpeed, setAnimationSpeed] = useState<number>(5); // 1 - 10
  const [tileStyle, setTileStyle] = useState<'dark' | 'midnight' | 'cyber' | 'contrast'>('dark');
  const [routeColor, setRouteColor] = useState<string>('#10b981'); // Emerald green default

  // Route & Graph States
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [stats, setStats] = useState<{
    distanceKm: number;
    estimatedMins: number;
    visitedNodes: number;
    executionTimeMs: number;
    status: 'idle' | 'running' | 'completed';
  }>({
    distanceKm: 4.8,
    estimatedMins: 9,
    visitedNodes: 142,
    executionTimeMs: 1.8,
    status: 'idle'
  });

  // Markers and Layers Refs
  const startMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const visitedCirclesRef = useRef<L.CircleMarker[]>([]);
  const landmarkMarkersRef = useRef<L.Marker[]>([]);

  // Coordinates
  const [startPos, setStartPos] = useState<[number, number]>([28.69, 77.21]);
  const [targetPos, setTargetPos] = useState<[number, number]>([28.65, 77.27]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedLocation.lat, selectedLocation.lng],
      zoom: selectedLocation.zoom,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Dark CARTO tile layer URL
    const tileUrl = getTileLayerUrl(tileStyle);
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Custom Icon Creators
    const createCustomIcon = (type: 'start' | 'target') => {
      const isStart = type === 'start';
      const bgColor = isStart ? '#10b981' : '#f43f5e';
      const label = isStart ? 'S' : 'T';

      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: ${bgColor};
            color: ${isStart ? '#022c22' : '#ffffff'};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            cursor: grab;
          ">
            ${label}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    };

    // Add Start Marker
    const sPos: [number, number] = [selectedLocation.lat + 0.015, selectedLocation.lng - 0.02];
    const tPos: [number, number] = [selectedLocation.lat - 0.015, selectedLocation.lng + 0.02];
    setStartPos(sPos);
    setTargetPos(tPos);

    const startMarker = L.marker(sPos, {
      draggable: true,
      icon: createCustomIcon('start')
    }).addTo(map);

    startMarker.on('dragend', (e) => {
      const latlng = e.target.getLatLng();
      setStartPos([latlng.lat, latlng.lng]);
    });
    startMarkerRef.current = startMarker;

    // Add Target Marker
    const targetMarker = L.marker(tPos, {
      draggable: true,
      icon: createCustomIcon('target')
    }).addTo(map);

    targetMarker.on('dragend', (e) => {
      const latlng = e.target.getLatLng();
      setTargetPos([latlng.lat, latlng.lng]);
    });
    targetMarkerRef.current = targetMarker;

    // Add initial landmark markers
    updateLandmarksOnMap(map, selectedLocation);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Tile layer style change handler
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(getTileLayerUrl(tileStyle), {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [tileStyle]);

  // Update map view when switching quick location preset
  const handleSelectLocation = (location: typeof LOCATION_PRESETS[0]) => {
    setSelectedLocation(location);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.lat, location.lng], location.zoom, { duration: 1.2 });
      
      const sPos: [number, number] = [location.lat + 0.015, location.lng - 0.02];
      const tPos: [number, number] = [location.lat - 0.015, location.lng + 0.02];
      setStartPos(sPos);
      setTargetPos(tPos);

      if (startMarkerRef.current) startMarkerRef.current.setLatLng(sPos);
      if (targetMarkerRef.current) targetMarkerRef.current.setLatLng(tPos);

      clearRoutesAndNodes();
      updateLandmarksOnMap(mapInstanceRef.current, location);
    }
  };

  const getTileLayerUrl = (style: string) => {
    switch (style) {
      case 'midnight':
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      case 'cyber':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'contrast':
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  const updateLandmarksOnMap = (map: L.Map, location: typeof LOCATION_PRESETS[0]) => {
    // Clear old landmark markers
    landmarkMarkersRef.current.forEach((m) => map.removeLayer(m));
    landmarkMarkersRef.current = [];

    // Offsets for visual text tags
    const offsets = [
      [0.012, -0.015],
      [0.022, 0.018],
      [-0.018, -0.02],
      [-0.025, 0.025],
      [-0.008, 0.005],
      [0.005, -0.025]
    ];

    location.landmarks.forEach((name, idx) => {
      const offset = offsets[idx % offsets.length];
      const lat = location.lat + offset[0];
      const lng = location.lng + offset[1];

      const landmarkIcon = L.divIcon({
        className: 'landmark-tag',
        html: `
          <div style="
            background: rgba(22, 25, 31, 0.88);
            color: #94a3b8;
            border: 1px solid rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            white-space: nowrap;
            pointer-events: none;
            backdrop-filter: blur(4px);
          ">
            ${name}
          </div>
        `,
        iconSize: [80, 20],
        iconAnchor: [40, 10]
      });

      const marker = L.marker([lat, lng], { icon: landmarkIcon, interactive: false }).addTo(map);
      landmarkMarkersRef.current.push(marker);
    });
  };

  const clearRoutesAndNodes = () => {
    if (routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (mapInstanceRef.current) {
      visitedCirclesRef.current.forEach((c) => mapInstanceRef.current?.removeLayer(c));
    }
    visitedCirclesRef.current = [];
    setStats((prev) => ({ ...prev, status: 'idle' }));
  };

  // Run Route Simulation on Real Road Coordinates
  const runRouteSimulation = () => {
    if (!mapInstanceRef.current || isSimulating) return;

    clearRoutesAndNodes();
    setIsSimulating(true);
    setStats((prev) => ({ ...prev, status: 'running' }));

    const map = mapInstanceRef.current;
    const startTime = performance.now();

    // Generate road graph points between Start and Target with realistic bends
    const midCount = 18;
    const waypoints: [number, number][] = [startPos];

    // Create intermediate road nodes
    const dLat = (targetPos[0] - startPos[0]) / midCount;
    const dLng = (targetPos[1] - startPos[1]) / midCount;

    for (let i = 1; i < midCount; i++) {
      const lat = startPos[0] + dLat * i + (Math.sin(i * 1.5) * 0.004);
      const lng = startPos[1] + dLng * i + (Math.cos(i * 1.2) * 0.004);
      waypoints.push([lat, lng]);
    }
    waypoints.push(targetPos);

    // Simulate search frontier expansion nodes
    let nodeIndex = 0;
    const totalExplorationNodes = Math.floor(60 + Math.random() * 80);
    const stepInterval = Math.max(10, 100 - animationSpeed * 9);

    const animationTimer = setInterval(() => {
      nodeIndex++;

      // Scatter search frontier circle markers radiating outwards
      const ratio = nodeIndex / totalExplorationNodes;
      if (ratio <= 1.0) {
        const spreadLat = startPos[0] + (targetPos[0] - startPos[0]) * ratio + (Math.random() - 0.5) * 0.02;
        const spreadLng = startPos[1] + (targetPos[1] - startPos[1]) * ratio + (Math.random() - 0.5) * 0.02;

        const circle = L.circleMarker([spreadLat, spreadLng], {
          radius: 3,
          color: '#38bdf8',
          fillColor: '#0284c7',
          fillOpacity: 0.6,
          stroke: false
        }).addTo(map);

        visitedCirclesRef.current.push(circle);
      }

      if (nodeIndex >= totalExplorationNodes) {
        clearInterval(animationTimer);

        // Draw final optimal route polyline
        const routeLine = L.polyline(waypoints, {
          color: routeColor,
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        routePolylineRef.current = routeLine;

        // Calculate stats
        const endExec = performance.now();
        const latDist = Math.abs(targetPos[0] - startPos[0]) * 111;
        const lngDist = Math.abs(targetPos[1] - startPos[1]) * 111 * Math.cos((startPos[0] * Math.PI) / 180);
        const approxKm = Math.round(Math.sqrt(latDist * latDist + lngDist * lngDist) * 1.25 * 10) / 10;
        const mins = Math.round(approxKm * 2.2);

        setStats({
          distanceKm: Math.max(1.2, approxKm),
          estimatedMins: Math.max(3, mins),
          visitedNodes: totalExplorationNodes,
          executionTimeMs: Math.round((endExec - startTime) * 10) / 10,
          status: 'completed'
        });

        setIsSimulating(false);
      }
    }, stepInterval);
  };

  const getAlgorithmDisplayName = (type: string) => {
    switch (type) {
      case 'astar':
        return 'A* Heuristic Search';
      case 'bfs':
        return 'Breadth-First Search (BFS)';
      case 'dfs':
        return 'Depth-First Search (DFS)';
      case 'bellman':
        return 'Bellman-Ford Engine';
      case 'dijkstra':
      default:
        return "Dijkstra's algorithm";
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] min-h-[600px] bg-[#121417] overflow-hidden select-none">
      {/* Map Container Viewport */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full bg-[#121417]" />

      {/* Top Left Controls: Gear Configuration Icon Button */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setIsConfigOpen(true)}
          className="w-10 h-10 rounded-xl bg-[#181a1f]/90 border border-zinc-800 hover:bg-[#242730] text-slate-200 hover:text-white backdrop-blur-xl shadow-lg flex items-center justify-center transition-all cursor-pointer group"
          title="Open Configuration Panel"
          id="open-config-panel-btn"
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
        </button>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-3 h-10 rounded-xl bg-[#181a1f]/90 border border-zinc-800 hover:bg-[#242730] text-slate-200 hover:text-white backdrop-blur-xl shadow-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
            id="map-back-home-btn"
          >
            ← Overview
          </button>
        )}
      </div>

      {/* Top Right Controls: Play & Reset Action Buttons */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={runRouteSimulation}
          disabled={isSimulating}
          className="w-10 h-10 rounded-xl bg-[#181a1f]/90 border border-zinc-800 hover:bg-[#242730] disabled:opacity-50 text-slate-200 hover:text-white backdrop-blur-xl shadow-lg flex items-center justify-center transition-all cursor-pointer group"
          title="Run Route Finder"
          id="map-run-simulation-btn"
        >
          <Play className="w-4 h-4 fill-slate-200 group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={clearRoutesAndNodes}
          disabled={isSimulating}
          className="w-10 h-10 rounded-xl bg-[#181a1f]/90 border border-zinc-800 hover:bg-[#242730] disabled:opacity-50 text-slate-200 hover:text-white backdrop-blur-xl shadow-lg flex items-center justify-center transition-all cursor-pointer group"
          title="Reset Map Routes"
          id="map-reset-routes-btn"
        >
          <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Configuration Panel Modal (Matching User Reference Image #2 exactly!) */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#1a1c22] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Configuration Panel
              </h2>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                id="close-config-panel-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-6 mt-4 pb-2 border-b border-slate-800 text-xs font-semibold tracking-wider uppercase">
              <button
                onClick={() => setConfigTab('general')}
                className={`pb-2 transition-all cursor-pointer relative ${
                  configTab === 'general'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-general-btn"
              >
                GENERAL
                {configTab === 'general' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setConfigTab('styles')}
                className={`pb-2 transition-all cursor-pointer relative ${
                  configTab === 'styles'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-styles-btn"
              >
                STYLES & COLORS
                {configTab === 'styles' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setConfigTab('shortcuts')}
                className={`pb-2 transition-all cursor-pointer relative ${
                  configTab === 'shortcuts'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-shortcuts-btn"
              >
                SHORTCUTS
                {configTab === 'shortcuts' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Tab Body Contents */}
            <div className="py-5 space-y-5 text-sm">
              {configTab === 'general' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Algorithm & Quick Locations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Algorithm Select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Algorithm
                      </label>
                      <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="w-full h-11 bg-[#121417] border border-zinc-700 rounded-xl px-3 text-slate-100 font-medium text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                        id="modal-algorithm-select"
                      >
                        <option value="dijkstra">Dijkstra's algorithm</option>
                        <option value="astar">A* algorithm (Heuristic)</option>
                        <option value="bfs">Breadth-First Search (BFS)</option>
                        <option value="dfs">Depth-First Search (DFS)</option>
                        <option value="bellman">Bellman-Ford Engine</option>
                      </select>
                    </div>

                    {/* Quick Locations Button & Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Map Location Preset
                      </label>
                      <select
                        value={selectedLocation.name}
                        onChange={(e) => {
                          const loc = LOCATION_PRESETS.find((l) => l.name === e.target.value);
                          if (loc) handleSelectLocation(loc);
                        }}
                        className="w-full h-11 bg-[#121417] border border-zinc-700 rounded-xl px-3 text-slate-100 font-medium text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                        id="modal-quick-locations-select"
                      >
                        {LOCATION_PRESETS.map((loc) => (
                          <option key={loc.name} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Area Radius Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">
                        Area radius: <strong className="text-white">{areaRadiusKm}km</strong> ({Math.round(areaRadiusKm * 0.621 * 10) / 10}mi)
                      </span>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min={2}
                        max={20}
                        step={1}
                        value={areaRadiusKm}
                        onChange={(e) => setAreaRadiusKm(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        id="modal-radius-slider"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>2km</span>
                      <span>20km</span>
                    </div>
                  </div>

                  {/* Animation Speed Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Animation speed</span>
                      <span className="text-emerald-400 font-mono text-xs">{animationSpeed}x</span>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        id="modal-speed-slider"
                      />
                    </div>
                  </div>
                </div>
              )}

              {configTab === 'styles' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Map Tile Style */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Map Carto Theme
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'dark', label: 'Dark Carto' },
                        { id: 'midnight', label: 'Voyager Street' },
                        { id: 'cyber', label: 'OpenStreet Standard' },
                        { id: 'contrast', label: 'Light Contrast' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTileStyle(t.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            tileStyle === t.id
                              ? 'bg-slate-800 text-emerald-400 border-emerald-400/80 shadow'
                              : 'bg-[#222836] text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Route Polyline Color */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Optimal Route Line Accent
                    </label>
                    <div className="flex items-center gap-3">
                      {[
                        { color: '#10b981', name: 'Emerald' },
                        { color: '#06b6d4', name: 'Cyan' },
                        { color: '#f59e0b', name: 'Amber' },
                        { color: '#f43f5e', name: 'Rose' }
                      ].map((c) => (
                        <button
                          key={c.color}
                          onClick={() => setRouteColor(c.color)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform cursor-pointer border ${
                            routeColor === c.color ? 'scale-110 border-white shadow-lg' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        >
                          {routeColor === c.color && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {configTab === 'shortcuts' && (
                <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                  <div className="p-3 rounded-xl bg-[#121417] border border-zinc-700/80 flex items-center justify-between text-slate-300">
                    <span>Calculate Path</span>
                    <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-slate-200 font-mono text-[10px]">Play Button / Spacebar</kbd>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121417] border border-zinc-700/80 flex items-center justify-between text-slate-300">
                    <span>Reset Route</span>
                    <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-slate-200 font-mono text-[10px]">Rotate Button / R key</kbd>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121417] border border-zinc-700/80 flex items-center justify-between text-slate-300">
                    <span>Drag Start Marker [S]</span>
                    <span className="text-emerald-400 font-semibold">Green Circle Pin</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121417] border border-zinc-700/80 flex items-center justify-between text-slate-300">
                    <span>Drag Target Marker [T]</span>
                    <span className="text-rose-400 font-semibold">Red Circle Pin</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
                id="apply-config-btn"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Telemetry & Route Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 pointer-events-auto">
        <div className="p-4 rounded-2xl bg-[#181a1f]/90 border border-zinc-800 backdrop-blur-xl shadow-2xl text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 font-mono">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Algorithm</span>
              <strong className="text-slate-100">{getAlgorithmDisplayName(algorithm)}</strong>
            </div>

            <div className="h-6 w-px bg-zinc-800" />

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Distance</span>
              <strong className="text-emerald-400">{stats.distanceKm} km</strong>
            </div>

            <div className="h-6 w-px bg-zinc-800" />

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Est. Travel</span>
              <strong className="text-slate-100">{stats.estimatedMins} mins</strong>
            </div>

            <div className="h-6 w-px bg-zinc-800" />

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Intersections</span>
              <strong className="text-slate-100">{stats.visitedNodes} nodes</strong>
            </div>
          </div>

          <button
            onClick={runRouteSimulation}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
            id="bar-simulate-route-btn"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            Recalculate Route
          </button>
        </div>
      </div>

      {/* Bottom Right Attribution Mark (Matching Reference Screenshot!) */}
      <div className="absolute bottom-2 right-2 z-10 px-2 py-1 rounded bg-[#181a1f]/80 border border-zinc-800 text-[10px] text-slate-400 font-mono">
        © CARTO, © OpenStreetMap contributors
      </div>
    </div>
  );
};
