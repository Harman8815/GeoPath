"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PathfindingMap from "@/components/PathfindingMap";
import SearchBar from "@/components/SearchBar";
import { useAnimationPlayback } from "@/hooks/useAnimationPlayback";
import { Graph } from "@/lib/graph";
import {
  fetchRoadNetwork,
  searchCities,
  convertToGraph,
  convertToGeoJSON,
  type CityResult,
  type OverpassResponse,
} from "@/lib/osm";
import type { GraphData, NodeModel } from "@/lib/graph/types";
import { MAP_STYLES, type MapStyleId } from "@/hooks/useMapStyles";

type SelectionMode = "none" | "source" | "destination";

export default function AppLayout() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [overpassData, setOverpassData] = useState<OverpassResponse | null>(null);
  const [geoJSON, setGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none");
  const [mapStyle, setMapStyle] = useState<MapStyleId>("dark");
  const [speed, setSpeed] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const nodes = useMemo(() => graphData?.nodes ?? [], [graphData]);
  const edges = useMemo(() => graphData?.edges ?? [], [graphData]);

  const graph = useMemo(
    () => (graphData ? Graph.fromData(graphData) : null),
    [graphData],
  );

  const playback = useAnimationPlayback({
    graph: graph ?? new Graph(),
    source: sourceId ?? "",
    target: destinationId ?? "",
    speed,
  });

  const sourceNode = useMemo(
    () => nodes.find((n) => n.id === sourceId) ?? null,
    [nodes, sourceId],
  );
  const destinationNode = useMemo(
    () => nodes.find((n) => n.id === destinationId) ?? null,
    [nodes, destinationId],
  );

  const exploredEdges = useMemo(() => {
    return playback.step?.exploredEdges ?? [];
  }, [playback.step]);

  const pathEdges = useMemo(() => {
    const path = playback.step?.path ?? [];
    if (path.length < 2) return [];
    const result: Array<{ source: string; target: string }> = [];
    for (let i = 0; i < path.length - 1; i++) {
      result.push({ source: path[i], target: path[i + 1] });
    }
    return result;
  }, [playback.step]);

  const handleCitySearch = useCallback(async (city: CityResult) => {
    setLoading(true);
    setError(null);
    setStatusMessage(`Loading road network for ${city.displayName.split(",")[0]}...`);
    try {
      const network = await fetchRoadNetwork(city.bbox);
      setOverpassData(network);
      const graph = convertToGraph(network);
      setGraphData(graph);
      const geo = convertToGeoJSON(network);
      setGeoJSON(geo);
      setSourceId(null);
      setDestinationId(null);
      playback.reset();
      setStatusMessage(
        `Loaded ${graph.nodes.length} intersections, ${graph.edges.length} road segments`,
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load road network.");
    } finally {
      setLoading(false);
    }
  }, [playback]);

  const handleMapClick = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      if (selectionMode === "none" || nodes.length === 0) return;

      let closest: { node: NodeModel; dist: number } | null = null;
      for (const node of nodes) {
        if (node.lat == null || node.lon == null) continue;
        const d =
          (node.lat - lngLat.lat) ** 2 + (node.lon - lngLat.lng) ** 2;
        if (!closest || d < closest.dist) {
          closest = { node, dist: d };
        }
      }

      if (closest) {
        if (selectionMode === "source") {
          setSourceId(closest.node.id);
          setDestinationId(null);
          playback.reset();
        } else if (selectionMode === "destination") {
          if (closest.node.id === sourceId) return;
          setDestinationId(closest.node.id);
        }
        setSelectionMode("none");
      }
    },
    [selectionMode, nodes, sourceId, playback],
  );

  const handlePlay = useCallback(() => {
    if (!sourceId || !destinationId) {
      setError("Please select both source and destination on the map.");
      return;
    }
    playback.play();
  }, [sourceId, destinationId, playback]);

  const handleReset = useCallback(() => {
    playback.reset();
    setSourceId(null);
    setDestinationId(null);
    setSelectionMode("none");
  }, [playback]);

  const handleStyleChange = useCallback((style: MapStyleId) => {
    setMapStyle(style);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <PathfindingMap
        geoJSON={geoJSON}
        exploredEdges={exploredEdges}
        pathEdges={pathEdges}
        nodes={nodes}
        sourceNode={sourceNode}
        destinationNode={destinationNode}
        onMapClick={handleMapClick}
        mapStyle={MAP_STYLES[mapStyle].url}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex flex-col gap-3">
          <div className="pointer-events-auto flex items-center gap-3">
            <SearchBar onCitySelect={handleCitySearch} disabled={loading} />
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg bg-white/90 px-4 py-2 text-sm shadow-lg backdrop-blur-sm dark:bg-black/80 dark:text-white"
              >
                {statusMessage}
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex items-center gap-2"
          >
            <h1 className="text-lg font-bold text-white drop-shadow-md">
              GeoPath
            </h1>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              Dijkstra Simulator
            </span>
          </motion.div>

          {!graphData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none max-w-md"
            >
              <div className="rounded-lg bg-white/90 px-4 py-3 text-sm shadow-lg backdrop-blur-sm dark:bg-black/80 dark:text-white">
                <p className="font-medium">Getting Started</p>
                <ol className="mt-1 list-inside list-decimal text-black/70 dark:text-white/70">
                  <li>Search for any city above</li>
                  <li>Click the map to set Source and Destination</li>
                  <li>Hit Start to watch Dijkstra explore the roads</li>
                </ol>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="pointer-events-auto">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg bg-white/90 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-sm transition-colors hover:bg-white dark:bg-black/80 dark:text-white dark:hover:bg-black/90"
              >
                {sidebarOpen ? "Hide Controls" : "Show Controls"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="pointer-events-auto flex gap-3"
              >
                <div className="w-80 rounded-xl bg-white/95 p-5 shadow-2xl backdrop-blur-sm dark:bg-black/90 dark:text-white">
                  <h3 className="mb-4 text-sm font-semibold">Controls</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-black/60 dark:text-white/60">
                        Map Style
                      </label>
                      <div className="flex gap-2">
                        {(Object.keys(MAP_STYLES) as MapStyleId[]).map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleStyleChange(id)}
                            className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium transition-all ${
                              mapStyle === id
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300"
                                : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                            }`}
                          >
                            {MAP_STYLES[id].name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-black/60 dark:text-white/60">
                        Selection Mode
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectionMode("source")}
                          className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium transition-all ${
                            selectionMode === "source"
                              ? "border-green-500 bg-green-50 text-green-700 shadow-sm dark:bg-green-900/30 dark:text-green-300"
                              : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                          }`}
                        >
                          Source
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectionMode("destination")}
                          className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium transition-all ${
                            selectionMode === "destination"
                              ? "border-red-500 bg-red-50 text-red-700 shadow-sm dark:bg-red-900/30 dark:text-red-300"
                              : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                          }`}
                        >
                          Destination
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectionMode("none")}
                          className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium transition-all ${
                            selectionMode === "none"
                              ? "border-black/20 bg-black/5 dark:border-white/20 dark:bg-white/10"
                              : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                          }`}
                        >
                          None
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wider text-black/60 dark:text-white/60">
                        <span>Animation Speed</span>
                        <span className="font-mono">{speed}x</span>
                      </label>
                      <input
                        type="range"
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handlePlay}
                        disabled={playback.status === "playing"}
                        className="rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                      >
                        {playback.status === "idle" ? "Start" : playback.status === "playing" ? "Running..." : "Start"}
                      </button>
                      <button
                        type="button"
                        onClick={playback.pause}
                        disabled={playback.status !== "playing"}
                        className="rounded-md border border-black/10 px-3 py-2.5 text-sm font-medium transition-all hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        onClick={playback.resume}
                        disabled={playback.status !== "paused"}
                        className="rounded-md border border-black/10 px-3 py-2.5 text-sm font-medium transition-all hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-md border border-black/10 px-3 py-2.5 text-sm font-medium transition-all hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        Reset
                      </button>
                    </div>

                    {playback.step && (
                      <div className="rounded-lg bg-black/5 p-4 dark:bg-white/5">
                        <p className="text-xs text-black/70 dark:text-white/70">
                          {playback.step.description}
                        </p>
                        <div className="mt-3 flex gap-4 text-xs">
                          <div>
                            <span className="text-black/50 dark:text-white/50">Visited:</span>{" "}
                            <span className="font-mono font-medium">{playback.step.visited.length}</span>
                          </div>
                          <div>
                            <span className="text-black/50 dark:text-white/50">Step:</span>{" "}
                            <span className="font-mono font-medium">{playback.currentIndex + 1}/{playback.steps.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <div className="pointer-events-auto rounded-lg bg-red-500 px-4 py-2 text-sm text-white shadow-lg">
            {error}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white/90 px-6 py-4 shadow-2xl backdrop-blur-sm dark:bg-black/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm font-medium">Loading road network...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
