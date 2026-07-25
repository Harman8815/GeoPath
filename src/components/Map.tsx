"use client";

import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl";
import maplibregl from "maplibre-gl";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "deck.gl";
import { TripsLayer } from "@deck.gl/geo-layers";
import { createGeoJSONCircle } from "../helpers";
import { useEffect, useRef, useState } from "react";
import { getBoundingBoxFromPolygon, getMapGraph, getNearestNode } from "../services/MapService";
import PathfindingState from "../models/PathfindingState";
import Interface from "./Interface";
import { INITIAL_COLORS, INITIAL_VIEW_STATE, MAP_STYLE } from "../config";
import useSmoothStateChange from "../hooks/useSmoothStateChange";

export default function Map() {
  const [startNode, setStartNode] = useState<any>(null);
  const [endNode, setEndNode] = useState<any>(null);
  const [selectionRadius, setSelectionRadius] = useState<any>([]);
  const [tripsData, setTripsData] = useState<any>([]);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [animationEnded, setAnimationEnded] = useState(false);
  const [playbackOn, setPlaybackOn] = useState(false);
  const [playbackDirection, setPlaybackDirection] = useState(1);
  const [fadeRadiusReverse, setFadeRadiusReverse] = useState(false);
  const [cinematic, setCinematic] = useState(false);
  const [placeEnd, setPlaceEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ algorithm: "astar", radius: 4, speed: 5 });
  const [colors, setColors] = useState(INITIAL_COLORS);
  const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE);
  const ui = useRef<any>(null);
  const fadeRadius = useRef(false);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const timer = useRef(0);
  const waypoints = useRef<any>([]);
  const state = useRef(new PathfindingState());
  const traceNode = useRef<any>(null);
  const traceNode2 = useRef<any>(null);
  const selectionRadiusOpacity = useSmoothStateChange(0, 0, 1, 400, fadeRadius.current, fadeRadiusReverse);

  async function mapClick(e: any, info: any, radius: number | null = null) {
    if (started && !animationEnded) return;

    setFadeRadiusReverse(false);
    fadeRadius.current = true;
    clearPath();

    if (info.rightButton || placeEnd) {
      if (e.layer?.id !== "selection-radius") {
        ui.current?.showSnack("Please select a point inside the radius.", "info");
        return;
      }

      if (loading) {
        ui.current?.showSnack("Please wait for all data to load.", "info");
        return;
      }

      const loadingHandle = setTimeout(() => {
        setLoading(true);
      }, 300);

      const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
      if (!node) {
        ui.current?.showSnack("No path was found in the vicinity, please try another location.");
        clearTimeout(loadingHandle);
        setLoading(false);
        return;
      }

      const realEndNode = state.current.getNode(node.id);
      setEndNode(node);

      clearTimeout(loadingHandle);
      setLoading(false);

      if (!realEndNode) {
        ui.current?.showSnack("An error occurred. Please try again.");
        return;
      }
      state.current.endNode = realEndNode;

      return;
    }

    const loadingHandle = setTimeout(() => {
      setLoading(true);
    }, 300);

    const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
    if (!node) {
      ui.current?.showSnack("No path was found in the vicinity, please try another location.");
      clearTimeout(loadingHandle);
      setLoading(false);
      return;
    }

    setStartNode(node);
    setEndNode(null);
    const circle = createGeoJSONCircle([node.lon, node.lat], radius ?? settings.radius);
    setSelectionRadius([{ contour: circle }]);

    getMapGraph(getBoundingBoxFromPolygon(circle), node.id).then((graph) => {
      state.current.graph = graph;
      clearPath();
      clearTimeout(loadingHandle);
      setLoading(false);
    });
  }

  function startPathfinding() {
    setFadeRadiusReverse(true);
    setTimeout(() => {
      clearPath();
      state.current.start(settings.algorithm);
      setStarted(true);
    }, 400);
  }

  function toggleAnimation(loop = true, direction = 1) {
    if (time === 0 && !animationEnded) return;
    setPlaybackDirection(direction);
    if (animationEnded) {
      if (loop && time >= timer.current) {
        setTime(0);
      }
      setStarted(true);
      setPlaybackOn(!playbackOn);
      return;
    }
    setStarted(!started);
    if (started) {
      previousTimeRef.current = null;
    }
  }

  function clearPath() {
    setStarted(false);
    setTripsData([]);
    setTime(0);
    state.current.reset();
    waypoints.current = [];
    timer.current = 0;
    previousTimeRef.current = null;
    traceNode.current = null;
    traceNode2.current = null;
    setAnimationEnded(false);
  }

  function animateStep(newTime: number) {
    const updatedNodes = state.current.nextStep();
    for (const updatedNode of updatedNodes) {
      updateWaypoints(updatedNode, updatedNode.referer);
    }

    if (state.current.finished && !animationEnded) {
      if (settings.algorithm === "bidirectional") {
        if (!traceNode.current) traceNode.current = updatedNodes[0];
        const parentNode = traceNode.current.parent;
        updateWaypoints(parentNode, traceNode.current, "route", Math.max(Math.log2(settings.speed), 1));
        traceNode.current = parentNode ?? traceNode.current;

        if (!traceNode2.current) {
          traceNode2.current = updatedNodes[0];
          traceNode2.current.parent = traceNode2.current.prevParent;
        }
        const parentNode2 = traceNode2.current.parent;
        updateWaypoints(parentNode2, traceNode2.current, "route", Math.max(Math.log2(settings.speed), 1));
        traceNode2.current = parentNode2 ?? traceNode2.current;
        setAnimationEnded(time >= timer.current && parentNode == null && parentNode2 == null);
      } else {
        if (!traceNode.current) traceNode.current = state.current.endNode;
        const parentNode = traceNode.current.parent;
        updateWaypoints(parentNode, traceNode.current, "route", Math.max(Math.log2(settings.speed), 1));
        traceNode.current = parentNode ?? traceNode.current;
        setAnimationEnded(time >= timer.current && parentNode == null);
      }
    }

    if (previousTimeRef.current != null && !animationEnded) {
      const deltaTime = newTime - previousTimeRef.current;
      setTime((prevTime) => prevTime + deltaTime * playbackDirection);
    }

    if (previousTimeRef.current != null && animationEnded && playbackOn) {
      const deltaTime = newTime - previousTimeRef.current;
      if (time >= timer.current && playbackDirection !== -1) {
        setPlaybackOn(false);
      }
      setTime((prevTime) => Math.max(Math.min(prevTime + deltaTime * 2 * playbackDirection, timer.current), 0));
    }
  }

  function animate(newTime: number) {
    for (let i = 0; i < settings.speed; i++) {
      animateStep(newTime);
    }

    previousTimeRef.current = newTime;
    requestRef.current = requestAnimationFrame(animate);
  }

  function updateWaypoints(node: any, refererNode: any, color = "path", timeMultiplier = 1) {
    if (!node || !refererNode) return;
    const distance = Math.hypot(node.longitude - refererNode.longitude, node.latitude - refererNode.latitude);
    const timeAdd = distance * 50000 * timeMultiplier;

    waypoints.current = [
      ...waypoints.current,
      {
        path: [[refererNode.longitude, refererNode.latitude], [node.longitude, node.latitude]],
        timestamps: [timer.current, timer.current + timeAdd],
        color,
      },
    ];

    timer.current += timeAdd;
    setTripsData(() => waypoints.current);
  }

  function changeLocation(location: any) {
    setViewState({ ...viewState, longitude: location.longitude, latitude: location.latitude, zoom: 13, transitionDuration: 1, transitionInterpolator: new FlyToInterpolator() });
  }

  function changeSettings(newSettings: any) {
    setSettings(newSettings);
    const items = { settings: newSettings, colors };
    localStorage.setItem("path_settings", JSON.stringify(items));
  }

  function changeColors(newColors: any) {
    setColors(newColors);
    const items = { settings, colors: newColors };
    localStorage.setItem("path_settings", JSON.stringify(items));
  }

  function changeAlgorithm(algorithm: string) {
    clearPath();
    changeSettings({ ...settings, algorithm });
  }

  function changeRadius(radius: number) {
    changeSettings({ ...settings, radius });
    if (startNode) {
      mapClick({ coordinate: [startNode.lon, startNode.lat] }, {}, radius);
    }
  }

  useEffect(() => {
    if (!started) return;
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [started, time, animationEnded, playbackOn]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((res) => {
      changeLocation(res.coords);
    });

    const settings = localStorage.getItem("path_settings");
    if (!settings) return;
    const items = JSON.parse(settings);

    setSettings(items.settings);
    setColors(items.colors);
  }, []);

  return (
    <>
      <div onContextMenu={(e) => { e.preventDefault(); }}>
        <DeckGL
          initialViewState={viewState}
          controller={{ doubleClickZoom: false, keyboard: false }}
          onClick={mapClick}
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
            data={tripsData}
            opacity={1}
            widthMinPixels={3}
            widthMaxPixels={5}
            fadeTrail={false}
            currentTime={time}
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
          />
        </DeckGL>
      </div>
      <Interface
        ref={ui}
        canStart={startNode && endNode}
        started={started}
        animationEnded={animationEnded}
        playbackOn={playbackOn}
        time={time}
        maxTime={timer.current}
        settings={settings}
        colors={colors}
        loading={loading}
        cinematic={cinematic}
        placeEnd={placeEnd}
        startPathfinding={startPathfinding}
        toggleAnimation={toggleAnimation}
        clearPath={clearPath}
        timeChanged={setTime}
        changeLocation={changeLocation}
        setSettings={changeSettings}
        changeAlgorithm={changeAlgorithm}
        setColors={changeColors}
        setCinematic={setCinematic}
        setPlaceEnd={setPlaceEnd}
        changeRadius={changeRadius}
      />
      <div className="attrib-container">
        <summary className="maplibregl-ctrl-attrib-button" title="Toggle attribution" aria-label="Toggle attribution"></summary>
        <div className="maplibregl-ctrl-attrib-inner">© <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="http://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors</div>
      </div>
    </>
  );
}
