"use client";

import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "deck.gl";
import { TripsLayer } from "@deck.gl/geo-layers";
import { createGeoJSONCircle } from "../helpers";
import { useEffect, useState, useRef } from "react";
import { getBoundingBoxFromPolygon, getMapGraph, getNearestNode, getCurrentCachedAreas } from "../services/MapService";
import { Graph } from "../models/Graph";
import Interface from "./Interface";
import { INITIAL_COLORS, INITIAL_VIEW_STATE, MAP_STYLE } from "../config";
import { usePathfinding } from "../hooks/usePathfinding";
import type { OverpassNode, MapSettings, ColorScheme, ViewState } from "../types";

export default function Map() {
  const [startNode, setStartNode] = useState<OverpassNode | null>(null);
  const [endNode, setEndNode] = useState<OverpassNode | null>(null);
  const [selectionRadius, setSelectionRadius] = useState<{ contour: number[][] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchingArea, setFetchingArea] = useState<{ contour: number[][] } | null>(null);
  const [settings, setSettings] = useState<MapSettings>({ algorithm: "astar", radius: 4, speed: 5 });
  const [colors, setColors] = useState<ColorScheme>(INITIAL_COLORS);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [fadeRadius, setFadeRadius] = useState(false);
  const [fadeRadiusReverse, setFadeRadiusReverse] = useState(false);
  const [placeEnd, setPlaceEnd] = useState(false);
  const [currentGraph, setCurrentGraph] = useState<Graph | null>(null);
  const [cachedAreas, setCachedAreas] = useState<{ contour: number[][] }[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [pulseOpacity, setPulseOpacity] = useState(1);

  const interfaceRef = useRef<any>(null);

  const {
    isRunning,
    isFinished,
    waypoints,
    exploredEdges,
    finalPath,
    startPathfinding,
    resetPathfinding,
    setGraph,
    setEndNodeId,
    timer,
  } = usePathfinding();

  const handleMapClick = async (e: any, info: any, radius: number | null = null) => {
    if (isRunning) return;

    setFadeRadiusReverse(false);
    setFadeRadius(true);
    resetPathfinding();

    if (info.rightButton || placeEnd) {
      if (e.layer?.id !== "selection-radius") {
        interfaceRef.current?.showSnack("Please select a point inside the radius.", "info");
        return;
      }

      if (loading) {
        interfaceRef.current?.showSnack("Please wait for all data to load.", "info");
        return;
      }

      setLoading(true);
      setApiStatus('loading');

      try {
        // Use existing graph to find nearest node without API call
        const node = await getNearestNode(e.coordinate[1], e.coordinate[0], currentGraph);
        if (!node) {
          interfaceRef.current?.showSnack("No path was found in the vicinity, please try another location.", "info");
          setApiStatus('error');
          setLoading(false);
          return;
        }

        setEndNode(node);
        setEndNodeId(node.id);
        setApiStatus('success');
      } catch (error: any) {
        console.error("[GeoPath] Error fetching end node:", error);
        interfaceRef.current?.showSnack(error.message || "An error occurred while fetching the end node.", "error");
        setApiStatus('error');
      } finally {
        setLoading(false);
      }

      return;
    }

    setLoading(true);
    setApiStatus('loading');

    try {
      const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
      if (!node) {
        interfaceRef.current?.showSnack("No path was found in the vicinity, please try another location.", "info");
        setApiStatus('error');
        setLoading(false);
        setFetchingArea(null);
        return;
      }

      setStartNode(node);
      setEndNode(null);
      
      const circle = createGeoJSONCircle([node.lon, node.lat], radius ?? settings.radius);
      setSelectionRadius([{ contour: circle }]);

      const boundingBox = getBoundingBoxFromPolygon(circle);
      
      // Show fetching area visualization (expanded with buffer)
      const expandedBBox = {
        minLat: boundingBox.minLat - (boundingBox.maxLat - boundingBox.minLat) * 0.25,
        maxLat: boundingBox.maxLat + (boundingBox.maxLat - boundingBox.minLat) * 0.25,
        minLon: boundingBox.minLon - (boundingBox.maxLon - boundingBox.minLon) * 0.25,
        maxLon: boundingBox.maxLon + (boundingBox.maxLon - boundingBox.minLon) * 0.25,
      };
      const fetchingContour = [
        [expandedBBox.minLon, expandedBBox.minLat],
        [expandedBBox.maxLon, expandedBBox.minLat],
        [expandedBBox.maxLon, expandedBBox.maxLat],
        [expandedBBox.minLon, expandedBBox.maxLat],
        [expandedBBox.minLon, expandedBBox.minLat],
      ];
      setFetchingArea({ contour: fetchingContour });
      setIsFetching(true);

      const graph = await getMapGraph(boundingBox, node.id);
      
      setCurrentGraph(graph);
      setGraph(graph);
      setApiStatus('success');
      setFetchingArea(null);
      setIsFetching(false);
      
      // Update cached areas visualization
      updateCachedAreasVisualization();
    } catch (error: any) {
      console.error("[GeoPath] Error loading map graph:", error);
      interfaceRef.current?.showSnack(error.message || "An error occurred while loading the map graph.", "error");
      setApiStatus('error');
      setFetchingArea(null);
      setIsFetching(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPathfinding = () => {
    if (!startNode || !endNode) return;
    
    setFadeRadiusReverse(true);
    setTimeout(() => {
      resetPathfinding();
      startPathfinding(settings.algorithm);
    }, 400);
  };

  const handleClearPath = () => {
    resetPathfinding();
    setStartNode(null);
    setEndNode(null);
    setSelectionRadius([]);
  };

  const handleLocationChange = (location: any) => {
    setViewState({ 
      ...viewState, 
      longitude: location.longitude, 
      latitude: location.latitude, 
      zoom: 13, 
      transitionDuration: 1, 
      transitionInterpolator: new FlyToInterpolator() 
    });
  };

  const handleSettingsChange = (newSettings: MapSettings) => {
    setSettings(newSettings);
    localStorage.setItem("path_settings", JSON.stringify({ settings: newSettings, colors }));
  };

  const handleColorsChange = (newColors: ColorScheme) => {
    setColors(newColors);
    localStorage.setItem("path_settings", JSON.stringify({ settings, colors: newColors }));
  };

  const handleAlgorithmChange = (algorithm: string) => {
    handleClearPath();
    handleSettingsChange({ ...settings, algorithm: algorithm as any });
  };

  const handleRadiusChange = (radius: number) => {
    handleSettingsChange({ ...settings, radius });
    if (startNode) {
      handleMapClick({ coordinate: [startNode.lon, startNode.lat] }, {}, radius);
    }
  };

  const updateCachedAreasVisualization = () => {
    const cachedBBoxes = getCurrentCachedAreas();
    const contours = cachedBBoxes.map(bbox => {
      // Convert bounding box to polygon contour
      return [
        [bbox.minLon, bbox.minLat],
        [bbox.maxLon, bbox.minLat],
        [bbox.maxLon, bbox.maxLat],
        [bbox.minLon, bbox.maxLat],
        [bbox.minLon, bbox.minLat], // Close the polygon
      ];
    });
    setCachedAreas(contours.map(contour => ({ contour })));
  };

  // Clear status indicators after 3 seconds
  useEffect(() => {
    if (apiStatus === 'success' || apiStatus === 'error') {
      const timer = setTimeout(() => {
        setApiStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [apiStatus]);

  // Pulsing animation for fetching area
  useEffect(() => {
    if (!isFetching) {
      setPulseOpacity(1);
      return;
    }

    const interval = setInterval(() => {
      setPulseOpacity(prev => prev === 1 ? 0.5 : 1);
    }, 500);

    return () => clearInterval(interval);
  }, [isFetching]);

  useEffect(() => {
    console.log("[GeoPath] Map component mounted");
    navigator.geolocation.getCurrentPosition(
      (res) => handleLocationChange(res.coords),
      (err) => console.log("[GeoPath] Geolocation error:", err)
    );

    const savedSettings = localStorage.getItem("path_settings");
    if (savedSettings) {
      try {
        const items = JSON.parse(savedSettings);
        setSettings(items.settings);
        setColors(items.colors);
      } catch (error) {
        console.error("[GeoPath] Error loading settings:", error);
      }
    }
  }, []);

  const selectionRadiusOpacity = fadeRadius ? (fadeRadiusReverse ? 0 : 1) : 0;

  console.log("[GeoPath] Map render:", { startNode, endNode, loading, isRunning, waypoints: waypoints.length, viewState, apiStatus });

  return (
    <>
      <div onContextMenu={(e) => { e.preventDefault(); }} style={{ height: "100vh", width: "100vw", position: "relative", backgroundColor: "#1F242D", overflow: "hidden" }}>
        {/* API Status Indicator */}
        {apiStatus === 'loading' && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '20px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Loading map data...
          </div>
        )}
        {apiStatus === 'success' && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 200, 100, 0.9)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '20px',
            zIndex: 1000,
            fontSize: '14px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ✓ Data loaded successfully
          </div>
        )}
        {apiStatus === 'error' && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(200, 50, 50, 0.9)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '20px',
            zIndex: 1000,
            fontSize: '14px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ✗ Failed to load data
          </div>
        )}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
        <DeckGL
          initialViewState={viewState}
          controller={{ doubleClickZoom: false, keyboard: false }}
          onClick={handleMapClick}
          style={{ width: "100%", height: "100%" }}
          getTooltip={() => null}
        >
          <PolygonLayer
            id={"selection-radius"}
            data={selectionRadius}
            pickable={true}
            stroked={true}
            getPolygon={(d: any) => d.contour}
            getFillColor={[80, 210, 0, 10]}
            getLineColor={[9, 142, 46, 175]}
            getLineWidth={3}
            opacity={selectionRadiusOpacity}
          />
          <PolygonLayer
            id={"cached-areas"}
            data={cachedAreas}
            pickable={false}
            stroked={true}
            getPolygon={(d: any) => d.contour}
            getFillColor={[0, 100, 255, 25]}
            getLineColor={[0, 100, 255, 100]}
            getLineWidth={2}
            opacity={1}
          />
          {fetchingArea && (
            <PolygonLayer
              id={"fetching-area"}
              data={[fetchingArea]}
              pickable={false}
              stroked={true}
              getPolygon={(d: any) => d.contour}
              getFillColor={[255, 165, 0, isFetching ? 40 : 20]}
              getLineColor={[255, 165, 0, isFetching ? 255 : 150]}
              getLineWidth={isFetching ? 4 : 2}
              opacity={isFetching ? pulseOpacity : 1}
            />
          )}
          <TripsLayer
            id={"explored-edges-layer"}
            data={exploredEdges}
            opacity={1}
            widthMinPixels={2}
            widthMaxPixels={3}
            fadeTrail={false}
            currentTime={exploredEdges.length > 0 ? exploredEdges[exploredEdges.length - 1].timestamps[1] : 0}
            trailLength={100000}
            jointRounded={true}
            capRounded={true}
            getColor={(d: any) => colors[d.color as keyof typeof colors]}
            updateTriggers={{
              getColor: [colors.explored],
              data: exploredEdges,
            }}
          />
          <TripsLayer
            id={"final-path-layer"}
            data={finalPath}
            opacity={1}
            widthMinPixels={4}
            widthMaxPixels={6}
            fadeTrail={false}
            currentTime={finalPath.length > 0 ? finalPath[finalPath.length - 1].timestamps[1] : 0}
            trailLength={100000}
            jointRounded={true}
            capRounded={true}
            getColor={(d: any) => colors[d.color as keyof typeof colors]}
            updateTriggers={{
              getColor: [colors.finalPath],
              data: finalPath,
            }}
          />
          <TripsLayer
            id={"pathfinding-layer"}
            data={waypoints}
            opacity={1}
            widthMinPixels={3}
            widthMaxPixels={5}
            fadeTrail={false}
            currentTime={timer}
            trailLength={1000}
            jointRounded={true}
            capRounded={true}
            getColor={(d: any) => colors[d.color as keyof typeof colors]}
            updateTriggers={{
              getColor: [colors.path, colors.route],
              data: waypoints,
              currentTime: timer,
            }}
          />
          <ScatterplotLayer
            id="start-end-points"
            data={[
              ...(startNode ? [{ coordinates: [startNode.lon, startNode.lat], color: colors.startNodeFill, lineColor: colors.startNodeBorder }] : []),
              ...(endNode ? [{ coordinates: [endNode.lon, endNode.lat], color: colors.endNodeFill, lineColor: colors.endNodeBorder }] : []),
            ]}
            pickable={true}
            opacity={1}
            stroked={true}
            filled={true}
            radiusScale={1}
            radiusMinPixels={7}
            radiusMaxPixels={20}
            lineWidthMinPixels={1}
            lineWidthMaxPixels={3}
            getPosition={(d: any) => d.coordinates}
            getFillColor={(d: any) => d.color}
            getLineColor={(d: any) => d.lineColor}
          />
          <MapGL
            reuseMaps
            mapLib={maplibregl as any}
            mapStyle={MAP_STYLE}
            doubleClickZoom={false}
            onLoad={() => console.log("[GeoPath] MapGL onLoad - map loaded successfully")}
            onError={(e: any) => console.error("[GeoPath] MapGL error:", e)}
            style={{ width: "100%", height: "100%" }}
          />
        </DeckGL>
      </div>
      <Interface
        ref={interfaceRef}
        canStart={!!startNode && !!endNode}
        started={isRunning}
        animationEnded={isFinished}
        playbackOn={false}
        time={timer}
        maxTime={timer}
        settings={settings}
        colors={colors}
        loading={loading}
        cinematic={false}
        placeEnd={placeEnd}
        startPathfinding={handleStartPathfinding}
        toggleAnimation={() => {}}
        clearPath={handleClearPath}
        timeChanged={() => {}}
        changeLocation={handleLocationChange}
        setSettings={handleSettingsChange}
        changeAlgorithm={handleAlgorithmChange}
        setColors={handleColorsChange}
        setCinematic={() => {}}
        setPlaceEnd={setPlaceEnd}
        changeRadius={handleRadiusChange}
      />
      <div className="attrib-container">
        <summary className="maplibregl-ctrl-attrib-button" title="Toggle attribution" aria-label="Toggle attribution"></summary>
        <div className="maplibregl-ctrl-attrib-inner">© <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="http://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors</div>
      </div>
    </>
  );
}
