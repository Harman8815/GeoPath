"use client";

import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "deck.gl";
import { TripsLayer } from "@deck.gl/geo-layers";
import { createGeoJSONCircle } from "../helpers";
import { useEffect, useState } from "react";
import { getBoundingBoxFromPolygon, getMapGraph, getNearestNode } from "../services/MapService";
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
  const [settings, setSettings] = useState<MapSettings>({ algorithm: "astar", radius: 4, speed: 5 });
  const [colors, setColors] = useState<ColorScheme>(INITIAL_COLORS);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [fadeRadius, setFadeRadius] = useState(false);
  const [fadeRadiusReverse, setFadeRadiusReverse] = useState(false);
  const [placeEnd, setPlaceEnd] = useState(false);

  const {
    isRunning,
    isFinished,
    waypoints,
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
        return;
      }

      if (loading) return;

      setLoading(true);

      try {
        const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
        if (!node) {
          setLoading(false);
          return;
        }

        setEndNode(node);
        setEndNodeId(node.id);
      } catch (error) {
        console.error("[GeoPath] Error fetching end node:", error);
      } finally {
        setLoading(false);
      }

      return;
    }

    setLoading(true);

    try {
      const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
      if (!node) {
        setLoading(false);
        return;
      }

      setStartNode(node);
      setEndNode(null);
      
      const circle = createGeoJSONCircle([node.lon, node.lat], radius ?? settings.radius);
      setSelectionRadius([{ contour: circle }]);

      const boundingBox = getBoundingBoxFromPolygon(circle);
      const graph = await getMapGraph(boundingBox, node.id);
      
      setGraph(graph);
    } catch (error) {
      console.error("[GeoPath] Error loading map graph:", error);
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

  useEffect(() => {
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

  return (
    <>
      <div onContextMenu={(e) => { e.preventDefault(); }} style={{ height: "100vh", width: "100vw", position: "relative" }}>
        <DeckGL
          initialViewState={viewState}
          controller={{ doubleClickZoom: false, keyboard: false }}
          onClick={handleMapClick}
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
          <TripsLayer
            id={"pathfinding-layer"}
            data={waypoints}
            opacity={1}
            widthMinPixels={3}
            widthMaxPixels={5}
            fadeTrail={false}
            currentTime={timer}
            getColor={(d: any) => colors[d.color as keyof typeof colors]}
            updateTriggers={{
              getColor: [colors.path, colors.route],
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
            onLoad={() => console.log("[GeoPath] MapGL onLoad")}
            onError={(e: any) => console.error("[GeoPath] MapGL error:", e)}
          />
        </DeckGL>
      </div>
      <Interface
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
